/**
 * PokemonRecognizer class for handling Pokemon image recognition using MobileNet and transfer learning
 */
export class PokemonRecognizer {
    constructor() {
        this.model = null;
        this.classifier = null;
        this.isInitialized = false;
        this.labels = new Map(); // Maps class indices to Pokemon names
    }

    /**
     * Initialize the MobileNet model and KNN classifier
     */
    async initialize() {
        try {
            console.log('Loading MobileNet model...');
            this.model = await mobilenet.load();
            this.classifier = knnClassifier.create();
            this.isInitialized = true;
            console.log('MobileNet model loaded successfully');
            return true;
        } catch (error) {
            console.error('Failed to load MobileNet model:', error);
            throw new Error('Failed to initialize Pokemon recognizer');
        }
    }

    /**
     * Add an example image to the classifier for training
     * @param {HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} image - The image element
     * @param {string} pokemonName - The name of the Pokemon
     */
    async addExample(image, pokemonName) {
        if (!this.isInitialized) {
            throw new Error('Model not initialized. Call initialize() first.');
        }

        try {
            // Get the intermediate activation of MobileNet for the image
            const activation = this.model.infer(image, true);
            
            // Add the activation to the classifier with its label
            this.classifier.addExample(activation, pokemonName);
            
            // Store the label
            const numClasses = this.classifier.getNumClasses();
            this.labels.set(numClasses - 1, pokemonName);
            
            console.log(`Added example for ${pokemonName}`);
        } catch (error) {
            console.error('Error adding example:', error);
            throw new Error('Failed to add training example');
        }
    }

    /**
     * Recognize Pokemon in an image
     * @param {string|HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} input - Image input (Base64 string or element)
     * @returns {Promise<Array>} Array of predictions with confidence scores
     */
    async recognizePokemon(input) {
        if (!this.isInitialized) {
            throw new Error('Model not initialized. Call initialize() first.');
        }

        try {
            // If input is a Base64 string, create an image element
            let imageElement = input;
            if (typeof input === 'string') {
                imageElement = new Image();
                imageElement.src = input;
                await new Promise((resolve, reject) => {
                    imageElement.onload = resolve;
                    imageElement.onerror = reject;
                });
            }

            // Get the activation
            const activation = this.model.infer(imageElement, true);

            // Get predictions from the classifier
            const result = await this.classifier.predictClass(activation, 5);

            // Format predictions
            const predictions = [];
            for (const [classIndex, probability] of Object.entries(result.confidences)) {
                predictions.push({
                    pokemon: this.labels.get(parseInt(classIndex)),
                    confidence: probability
                });
            }

            // Sort by confidence
            return predictions.sort((a, b) => b.confidence - a.confidence);
        } catch (error) {
            console.error('Error during recognition:', error);
            throw new Error('Failed to recognize Pokemon');
        }
    }

    /**
     * Save the trained classifier
     * @returns {Object} Classifier dataset and labels
     */
    async saveModel() {
        if (!this.isInitialized) {
            throw new Error('Model not initialized. Call initialize() first.');
        }

        try {
            const dataset = this.classifier.getClassifierDataset();
            const state = {
                dataset: Object.entries(dataset).reduce((data, [key, value]) => ({
                    ...data,
                    [key]: Array.from(value.dataSync()),
                }), {}),
                labels: Array.from(this.labels.entries())
            };
            return state;
        } catch (error) {
            console.error('Error saving model:', error);
            throw new Error('Failed to save model');
        }
    }

    /**
     * Load a previously trained classifier
     * @param {Object} state - Saved classifier state
     */
    async loadModel(state) {
        if (!this.isInitialized) {
            throw new Error('Model not initialized. Call initialize() first.');
        }

        try {
            const dataset = Object.entries(state.dataset).reduce((dataset, [key, value]) => ({
                ...dataset,
                [key]: tf.tensor(value)
            }), {});
            
            this.classifier.setClassifierDataset(dataset);
            this.labels = new Map(state.labels);
            
            console.log('Model loaded successfully');
        } catch (error) {
            console.error('Error loading model:', error);
            throw new Error('Failed to load model');
        }
    }
} 
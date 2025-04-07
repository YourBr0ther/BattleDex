import { PokemonRecognizer } from './vision.js';

/**
 * Training utility for the Pokemon recognizer
 */
export class PokemonTrainer {
    constructor() {
        this.recognizer = new PokemonRecognizer();
        this.trainingData = new Map(); // Pokemon name -> array of image URLs
    }

    /**
     * Initialize the trainer
     */
    async initialize() {
        await this.recognizer.initialize();
        console.log('Trainer initialized');
    }

    /**
     * Add training data for a Pokemon
     * @param {string} pokemonName - Name of the Pokemon
     * @param {string[]} imageUrls - Array of image URLs
     */
    addTrainingData(pokemonName, imageUrls) {
        this.trainingData.set(pokemonName, imageUrls);
    }

    /**
     * Train the model with the provided data
     * @returns {Promise<void>}
     */
    async train() {
        if (this.trainingData.size === 0) {
            throw new Error('No training data provided');
        }

        console.log('Starting training...');
        
        for (const [pokemonName, imageUrls] of this.trainingData.entries()) {
            console.log(`Training for ${pokemonName}...`);
            
            for (const url of imageUrls) {
                try {
                    const img = new Image();
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        img.crossOrigin = 'anonymous';
                        img.src = url;
                    });
                    
                    await this.recognizer.addExample(img, pokemonName);
                } catch (error) {
                    console.warn(`Failed to process image for ${pokemonName}:`, url, error);
                    continue;
                }
            }
        }

        console.log('Training completed');
    }

    /**
     * Save the trained model
     * @returns {Promise<Object>} Saved model state
     */
    async saveModel() {
        return await this.recognizer.saveModel();
    }

    /**
     * Test the model with a single image
     * @param {string} imageUrl - URL of the test image
     * @returns {Promise<Array>} Predictions
     */
    async test(imageUrl) {
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.crossOrigin = 'anonymous';
            img.src = imageUrl;
        });
        
        return await this.recognizer.recognizePokemon(img);
    }
} 
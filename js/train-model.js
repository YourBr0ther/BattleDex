import { PokemonRecognizer } from './vision.js';

class ModelTrainer {
    constructor() {
        this.recognizer = new PokemonRecognizer();
        this.dataset = null;
        this.trainedCount = 0;
        this.totalImages = 0;
        
        // UI Elements
        this.datasetInput = document.getElementById('datasetInput');
        this.datasetInfo = document.getElementById('datasetInfo');
        this.trainBtn = document.getElementById('trainBtn');
        this.progress = document.getElementById('progress');
        this.progressFill = document.querySelector('.progress-fill');
        this.stats = document.getElementById('stats');
        this.testImageInput = document.getElementById('testImageInput');
        this.testImage = document.getElementById('testImage');
        this.testResults = document.getElementById('testResults');
        this.saveBtn = document.getElementById('saveBtn');
        
        this.initializeEventListeners();
    }

    async initialize() {
        try {
            await this.recognizer.initialize();
            console.log('Model initialized successfully');
        } catch (error) {
            console.error('Failed to initialize model:', error);
            this.updateProgress('Failed to initialize model: ' + error.message, true);
        }
    }

    initializeEventListeners() {
        // Dataset loading
        this.datasetInput.addEventListener('change', (e) => this.loadDataset(e));
        
        // Training
        this.trainBtn.addEventListener('click', () => this.startTraining());
        
        // Testing
        this.testImageInput.addEventListener('change', (e) => this.testModel(e));
        
        // Saving
        this.saveBtn.addEventListener('click', () => this.saveModel());
    }

    async loadDataset(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            this.dataset = JSON.parse(text);
            
            // Count total images
            this.totalImages = Object.values(this.dataset)
                .reduce((sum, urls) => sum + urls.length, 0);
            
            this.datasetInfo.textContent = `Loaded dataset with ${Object.keys(this.dataset).length} Pokemon and ${this.totalImages} total images`;
            this.trainBtn.disabled = false;
            
        } catch (error) {
            console.error('Error loading dataset:', error);
            this.datasetInfo.textContent = 'Error loading dataset: ' + error.message;
        }
    }

    async startTraining() {
        if (!this.dataset) return;

        this.trainBtn.disabled = true;
        this.trainedCount = 0;
        this.updateProgress('Starting training...');
        this.updateStats();

        try {
            for (const [pokemon, urls] of Object.entries(this.dataset)) {
                for (const url of urls) {
                    try {
                        const img = new Image();
                        await new Promise((resolve, reject) => {
                            img.onload = resolve;
                            img.onerror = reject;
                            img.crossOrigin = 'anonymous';
                            img.src = url;
                        });
                        
                        await this.recognizer.addExample(img, pokemon);
                        this.trainedCount++;
                        this.updateProgress(`Training: ${pokemon} (${this.trainedCount}/${this.totalImages})`);
                        this.updateStats();
                        
                    } catch (error) {
                        console.warn(`Failed to process image for ${pokemon}:`, url, error);
                        continue;
                    }
                }
            }

            this.updateProgress('Training completed successfully!');
            this.testImageInput.disabled = false;
            this.saveBtn.disabled = false;
            
        } catch (error) {
            console.error('Training failed:', error);
            this.updateProgress('Training failed: ' + error.message, true);
        }
    }

    async testModel(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Display the test image
            const reader = new FileReader();
            reader.onload = async (e) => {
                this.testImage.src = e.target.result;
                
                // Get predictions
                const predictions = await this.recognizer.recognizePokemon(this.testImage);
                
                // Display results
                this.testResults.innerHTML = predictions
                    .map(p => `${p.pokemon}: ${(p.confidence * 100).toFixed(1)}%`)
                    .join('<br>');
            };
            reader.readAsDataURL(file);
            
        } catch (error) {
            console.error('Test failed:', error);
            this.testResults.textContent = 'Test failed: ' + error.message;
        }
    }

    async saveModel() {
        try {
            const modelState = await this.recognizer.saveModel();
            
            // Save to file
            const blob = new Blob([JSON.stringify(modelState)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pokemon-model.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.updateProgress('Model saved successfully!');
        } catch (error) {
            console.error('Failed to save model:', error);
            this.updateProgress('Failed to save model: ' + error.message, true);
        }
    }

    updateProgress(message, isError = false) {
        this.progress.textContent = message;
        this.progress.style.color = isError ? '#c62828' : '#2e7d32';
        
        // Update progress bar
        const progress = (this.trainedCount / this.totalImages) * 100;
        this.progressFill.style.width = `${progress}%`;
    }

    updateStats() {
        const progress = ((this.trainedCount / this.totalImages) * 100).toFixed(1);
        this.stats.textContent = `
Training Progress:
----------------
Total Pokemon: ${Object.keys(this.dataset || {}).length}
Total Images: ${this.totalImages}
Trained: ${this.trainedCount}
Progress: ${progress}%
`;
    }
}

// Initialize the trainer when the page loads
window.addEventListener('load', async () => {
    const trainer = new ModelTrainer();
    await trainer.initialize();
}); 
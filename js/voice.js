/**
 * Voice recognition handler for Pokemon search
 */
export class VoiceSearch {
    constructor() {
        // Check if browser supports speech recognition
        window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!window.SpeechRecognition) {
            throw new Error('Speech recognition not supported in this browser.');
        }

        this.recognition = new window.SpeechRecognition();
        this.setupRecognition();
        
        // Bind event handlers
        this.onStart = () => {};
        this.onResult = () => {};
        this.onError = () => {};
        this.onEnd = () => {};
    }

    setupRecognition() {
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        // Wire up events
        this.recognition.onstart = () => {
            this.onStart();
        };

        this.recognition.onresult = (event) => {
            const result = event.results[0][0].transcript.trim().toLowerCase();
            this.onResult(result);
        };

        this.recognition.onerror = (event) => {
            this.onError(event.error);
        };

        this.recognition.onend = () => {
            this.onEnd();
        };
    }

    /**
     * Start voice recognition
     */
    start() {
        this.recognition.start();
    }

    /**
     * Stop voice recognition
     */
    stop() {
        this.recognition.stop();
    }

    /**
     * Set callback for when recognition starts
     * @param {Function} callback 
     */
    setOnStart(callback) {
        this.onStart = callback;
    }

    /**
     * Set callback for when a result is recognized
     * @param {Function} callback 
     */
    setOnResult(callback) {
        this.onResult = callback;
    }

    /**
     * Set callback for when an error occurs
     * @param {Function} callback 
     */
    setOnError(callback) {
        this.onError = callback;
    }

    /**
     * Set callback for when recognition ends
     * @param {Function} callback 
     */
    setOnEnd(callback) {
        this.onEnd = callback;
    }
} 
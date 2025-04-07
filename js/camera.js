/**
 * Camera handler for Pokemon recognition
 */
export class CameraHandler {
    constructor(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.stream = null;
        
        // Bind event handlers
        this.onFrame = () => {};
        this.onError = () => {};
    }

    /**
     * Start camera stream
     */
    async start() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            this.video.srcObject = this.stream;
            await this.video.play();

            // Set canvas size to match video
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

        } catch (error) {
            this.onError(error);
        }
    }

    /**
     * Stop camera stream
     */
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.video.srcObject = null;
    }

    /**
     * Capture current frame from video
     * @returns {string} Base64 encoded image data
     */
    captureFrame() {
        const context = this.canvas.getContext('2d');
        context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        
        // Get image data as base64 string
        return this.canvas.toDataURL('image/jpeg', 0.8);
    }

    /**
     * Set callback for frame capture
     * @param {Function} callback 
     */
    setOnFrame(callback) {
        this.onFrame = callback;
    }

    /**
     * Set callback for errors
     * @param {Function} callback 
     */
    setOnError(callback) {
        this.onError = callback;
    }
} 
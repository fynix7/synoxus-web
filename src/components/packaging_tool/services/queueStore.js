import { generateThumbnail, rateThumbnail, generatePackage } from './api';
import { saveToHistory } from './historyStore';
import { urlToBase64 } from '../utils/imageUtils';

class QueueStore {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.listeners = [];
        this.completedJobs = [];
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        const state = this.getState();
        this.listeners.forEach(l => l(state));
    }

    addJob(jobData) {
        const job = {
            id: Date.now() + Math.random(),
            status: 'pending',
            timestamp: new Date(),
            type: 'generation', // Default type
            ...jobData
        };
        this.queue.push(job);
        this.notify();
        this.processNext();
        return job.id;
    }

    async processNext() {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;
        this.notify();

        const job = this.queue[0];

        try {
            console.log(`Processing job ${job.id} of type ${job.type}`);
            let result;

            if (job.type === 'rating') {
                console.log("Starting rating API call...");
                result = await rateThumbnail(job.apiParams);
                console.log("Rating API call finished:", result);
            } else if (job.type === 'package') {
                result = await generatePackage(job.apiParams);
            } else {
                // Default to generation
                result = await generateThumbnail(job.apiParams);
            }

            if (result.success) {
                console.log("Job successful, saving to history/completed");
                let historyEntry = null;

                // Save to history for generation and package jobs
                if (job.type === 'generation' || job.type === 'package') {
                    // Prepare data for history with persistent images
                    const historyData = {
                        type: job.type, // Save the type
                        topic: job.meta.topic,
                        instructions: job.meta.instructions,
                        images: job.type === 'package' ? result.packages : result.images, // Handle different result structures
                        brandColors: job.meta.brandColors,
                        // Persist inputs for rerun
                        refThumbs: job.apiParams.refThumbs ? await Promise.all(job.apiParams.refThumbs.map(url => urlToBase64(url))) : [],
                        baseImage: job.apiParams.baseImage ? await urlToBase64(job.apiParams.baseImage) : null,
                        maskImage: job.apiParams.maskImage ? await urlToBase64(job.apiParams.maskImage) : null,
                        activeCharacters: job.apiParams.activeCharacters || []
                    };

                    historyEntry = await saveToHistory(historyData);
                }

                this.completedJobs.unshift({
                    ...job,
                    status: 'completed',
                    result: job.type === 'rating' ? result.data : (job.type === 'package' ? result.packages : result.images), // Normalize result storage
                    historyId: historyEntry?.id
                });

                // Keep completed list manageable
                if (this.completedJobs.length > 10) this.completedJobs.pop();
            } else {
                console.error("Job failed", result);
                this.completedJobs.unshift({
                    ...job,
                    status: 'failed',
                    error: result.error || 'Unknown error'
                });
            }
        } catch (error) {
            console.error("Job execution error", error);
            this.completedJobs.unshift({
                ...job,
                status: 'failed',
                error: error.message
            });
        } finally {
            this.queue.shift();
            this.processing = false;
            this.notify();
            // Process next immediately
            this.processNext();
        }
    }

    getState() {
        return {
            queue: [...this.queue],
            processing: this.processing,
            completedJobs: [...this.completedJobs]
        };
    }
}

export const queueStore = new QueueStore();

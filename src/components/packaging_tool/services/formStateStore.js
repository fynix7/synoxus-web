// Global form state persistence across tab switches
class FormStateStore {
    constructor() {
        this.state = {
            // Create Tab - SingleGenerator
            create_remix: {
                videoTitle: '',
                instructions: '',
                primaryColor: '#0071e3',
                secondaryColor: '#ff3b30',
                useSecondaryColor: false,
                variationCount: 1
            },
            // Create Tab - TemplateGenerator
            create_templates: {
                videoTitle: '',
                instructions: '',
                selectedTemplateId: '',
                primaryColor: '#0071e3',
                secondaryColor: '#ff3b30',
                useSecondaryColor: false,
                variationCount: 1
            },
            // Create Tab - CharacterRemover
            create_remover: {
                videoTitle: '',
                instructions: '',
                primaryColor: '#0071e3',
                secondaryColor: '#ff3b30',
                useSecondaryColor: false,
                variationCount: 1
            },
            // Package Tab
            package: {
                inputType: 'keyword',
                keyword: '',
                videoTopic: '',
                channelLink: '',
                primaryColor: '#0071e3',
                secondaryColor: '#ff3b30',
                useSecondaryColor: false,
                variationCount: 1
            },
            // Rate Tab
            rate: {
                urlInput: ''
            }
        };
    }

    getState(key) {
        return this.state[key] || {};
    }

    setState(key, newState) {
        this.state[key] = { ...this.state[key], ...newState };
    }

    resetState(key) {
        if (key === 'create_remix') {
            this.state[key] = {
                videoTitle: '',
                instructions: '',
                primaryColor: '#0071e3',
                secondaryColor: '#ff3b30',
                useSecondaryColor: false,
                variationCount: 1
            };
        } else if (key === 'create_templates') {
            this.state[key] = {
                videoTitle: '',
                instructions: '',
                selectedTemplateId: '',
                primaryColor: '#0071e3',
                secondaryColor: '#ff3b30',
                useSecondaryColor: false,
                variationCount: 1
            };
        } else if (key === 'create_remover') {
            this.state[key] = {
                videoTitle: '',
                instructions: '',
                primaryColor: '#0071e3',
                secondaryColor: '#ff3b30',
                useSecondaryColor: false,
                variationCount: 1
            };
        } else if (key === 'package') {
            this.state[key] = {
                inputType: 'keyword',
                keyword: '',
                videoTopic: '',
                channelLink: '',
                primaryColor: '#0071e3',
                secondaryColor: '#ff3b30',
                useSecondaryColor: false,
                variationCount: 1
            };
        } else if (key === 'rate') {
            this.state[key] = {
                urlInput: ''
            };
        }
    }
}

export const formStateStore = new FormStateStore();

export interface AudioServiceConfig {
    onTranscript?: (text: string) => void;
    onError?: (error: string) => void;
    onStateChange?: (state: 'idle' | 'listening' | 'processing' | 'speaking') => void;
}

export class AudioService {
    private recognition: SpeechRecognition | null = null;
    private synthesis: SpeechSynthesis | null = null;
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private isListening = false;
    private isSpeaking = false;
    private config: AudioServiceConfig;

    constructor(config: AudioServiceConfig = {}) {
        this.config = config;
        this.initSpeechRecognition();
        this.initSpeechSynthesis();
    }

    private initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                this.config.onStateChange?.('listening');
            };

            this.recognition.onresult = (event: SpeechRecognitionEvent) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (finalTranscript) {
                    this.config.onTranscript?.(finalTranscript);
                }
            };

            this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                this.isListening = false;
                this.config.onStateChange?.('idle');
                this.config.onError?.(`Speech recognition error: ${event.error}`);
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.config.onStateChange?.('idle');
            };
        }
    }

    private initSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            this.synthesis = window.speechSynthesis;
        }
    }

    async startListening(): Promise<boolean> {
        if (this.isListening || this.isSpeaking) {
            return false;
        }

        try {
            if (this.recognition) {
                this.recognition.start();
                return true;
            } else {
                // Fallback to manual recording
                return await this.startManualRecording();
            }
        } catch (error) {
            this.config.onError?.(`Failed to start listening: ${error}`);
            return false;
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }
    }

    private async startManualRecording(): Promise<boolean> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                // Here you would typically send the audio to a server for STT
                // For now, we'll just simulate it
                this.config.onTranscript?.("Manual recording completed - STT processing would happen here");
            };

            this.mediaRecorder.start();
            this.isListening = true;
            this.config.onStateChange?.('listening');
            return true;
        } catch (error) {
            this.config.onError?.(`Failed to access microphone: ${error}`);
            return false;
        }
    }

    speak(text: string) {
        if (this.isSpeaking) {
            this.stopSpeaking();
        }

        if (this.synthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onstart = () => {
                this.isSpeaking = true;
                this.config.onStateChange?.('speaking');
            };
            utterance.onend = () => {
                this.isSpeaking = false;
                this.config.onStateChange?.('idle');
            };
            utterance.onerror = (event) => {
                this.isSpeaking = false;
                this.config.onStateChange?.('idle');
                this.config.onError?.(`Speech synthesis error: ${event.error}`);
            };
            this.synthesis.speak(utterance);
        } else {
            this.config.onError?.('Speech synthesis not supported');
        }
    }

    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            this.config.onStateChange?.('idle');
        }
    }

    isSupported(): boolean {
        return !!(this.recognition || this.synthesis);
    }

    getState(): 'idle' | 'listening' | 'processing' | 'speaking' {
        if (this.isListening) return 'listening';
        if (this.isSpeaking) return 'speaking';
        return 'idle';
    }
} 
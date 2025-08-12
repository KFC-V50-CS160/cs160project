import React, { useState, useEffect, useRef } from 'react';
import { AudioService } from '../services/audioService';
import { AIService } from '../services/aiService';

interface AudioAssistantProps {
    onTranscript?: (text: string) => void;
    onResponse?: (text: string) => void;
    onStepChange?: (stepChange: number) => void;
    recipeDetails?: string;
}

export default function AudioAssistant({ onTranscript, onResponse, onStepChange, recipeDetails }: AudioAssistantProps) {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [error, setError] = useState('');
    const [audioLevel, setAudioLevel] = useState(0);

    const audioServiceRef = useRef<AudioService | null>(null);
    const aiServiceRef = useRef<AIService | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const handleTranscript = async (text: string) => {
        setTranscript(text);
        onTranscript?.(text);

        // Process with AI
        if (aiServiceRef.current) {
            try {
                const aiResponse = await aiServiceRef.current.processQuestion(text, recipeDetails);

                // Handle step changes first
                if (aiResponse.stepChange !== undefined && onStepChange) {
                    onStepChange(aiResponse.stepChange);
                    // For step changes, don't show response or speak - just execute silently
                    return;
                }

                // Only show and speak responses that aren't step changes
                setAiResponse(aiResponse.response);
                onResponse?.(aiResponse.response);

                // Speak the response
                if (audioServiceRef.current) {
                    audioServiceRef.current.speak(aiResponse.response);
                }
            } catch (error) {
                console.error('AI processing error:', error);
                const errorResponse = "I'm sorry, I encountered an error processing your request. Please try again.";
                setAiResponse(errorResponse);
                onResponse?.(errorResponse);

                if (audioServiceRef.current) {
                    audioServiceRef.current.speak(errorResponse);
                }
            }
        }
    };

    const handleError = (errorMessage: string) => {
        setError(errorMessage);
        setTimeout(() => setError(''), 5000);
    };

    const handleStateChange = (state: 'idle' | 'listening' | 'processing' | 'speaking') => {
        setIsListening(state === 'listening');
        setIsSpeaking(state === 'speaking');
    };

    useEffect(() => {
        // Initialize services
        audioServiceRef.current = new AudioService({
            onTranscript: handleTranscript,
            onError: handleError,
            onStateChange: handleStateChange
        });

        aiServiceRef.current = new AIService();

        return () => {
            if (audioServiceRef.current) {
                audioServiceRef.current.stopSpeaking();
                audioServiceRef.current.stopListening();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [handleTranscript, handleError, handleStateChange]);

    const toggleListening = async () => {
        if (!audioServiceRef.current) return;

        if (isListening) {
            audioServiceRef.current.stopListening();
        } else {
            const success = await audioServiceRef.current.startListening();
            if (!success) {
                setError('Failed to start listening. Please check microphone permissions.');
            }
        }
    };

    const stopSpeaking = () => {
        if (audioServiceRef.current) {
            audioServiceRef.current.stopSpeaking();
        }
    };

    // Animate audio level when listening
    useEffect(() => {
        if (isListening) {
            const animate = () => {
                setAudioLevel(Math.random() * 0.8 + 0.2);
                animationFrameRef.current = requestAnimationFrame(animate);
            };
            animate();
        } else {
            setAudioLevel(0);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isListening]);

    if (!audioServiceRef.current || !audioServiceRef.current.isSupported()) {
        return (
            <div className="audio-assistant unsupported">
                <p>Audio features are not supported in this browser.</p>
            </div>
        );
    }

    return (
        <div className="audio-assistant">
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="audio-controls">
                <button
                    className={`audio-btn ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}
                    onClick={toggleListening}
                    disabled={isSpeaking}
                    aria-label={isListening ? 'Stop listening' : 'Start listening'}
                >
                    <div className="mic-icon">
                        {isListening ? '🎤' : '🎤'}
                    </div>
                    {isListening && (
                        <div className="waveform">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="wave-bar"
                                    style={{
                                        height: `${(audioLevel * (0.5 + i * 0.1)) * 100}%`,
                                        animationDelay: `${i * 0.1}s`
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </button>

                {isSpeaking && (
                    <button
                        className="stop-btn"
                        onClick={stopSpeaking}
                        aria-label="Stop speaking"
                    >
                        ⏹️
                    </button>
                )}
            </div>

            {transcript && (
                <div className="transcript">
                    <h4>You said:</h4>
                    <p>{transcript}</p>
                </div>
            )}

            {aiResponse && (
                <div className="ai-response">
                    <h4>Assistant:</h4>
                    <p>{aiResponse}</p>
                </div>
            )}

            <div className="audio-status">
                {isListening && <span className="status listening">Listening...</span>}
                {isSpeaking && <span className="status speaking">Speaking...</span>}
                {!isListening && !isSpeaking && <span className="status idle">Ready to listen</span>}
            </div>
        </div>
    );
} 
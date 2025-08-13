import React, { useState, useEffect, useRef } from 'react';
import { AudioService } from '../services/audioService';
import { AIService } from '../services/aiService';
import type { RecipeContext } from '../services/aiService';

interface AudioAssistantProps {
    onStepChange?: (stepChange: number) => void;
    recipeContext?: RecipeContext;
}

export default function AudioAssistant({ onStepChange, recipeContext }: AudioAssistantProps) {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);

    const audioServiceRef = useRef<AudioService | null>(null);
    const aiServiceRef = useRef<AIService | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const handleTranscript = async (text: string) => {
        // Process with AI silently
        if (aiServiceRef.current) {
            try {
                const aiResponse = await aiServiceRef.current.processQuestion(text, recipeContext);

                // Handle step changes first
                if (aiResponse.stepChange !== undefined && onStepChange) {
                    onStepChange(aiResponse.stepChange);
                    // For step changes, don't show response or speak - just execute silently
                    return;
                }

                // Speak the response silently (no UI display)
                if (audioServiceRef.current) {
                    audioServiceRef.current.speak(aiResponse.response);
                }
            } catch (error) {
                console.error('AI processing error:', error);
                // Don't show error in UI, just log it
            }
        }
    };



    const handleStateChange = (state: 'idle' | 'listening' | 'processing' | 'speaking') => {
        setIsListening(state === 'listening');
        setIsSpeaking(state === 'speaking');
    };

    useEffect(() => {
        // Initialize services synchronously for instant availability
        try {
            audioServiceRef.current = new AudioService({
                onTranscript: handleTranscript,
                onStateChange: handleStateChange
            });

            aiServiceRef.current = new AIService();
        } catch (error) {
            console.error('Failed to initialize audio services:', error);
        }

        return () => {
            if (audioServiceRef.current) {
                audioServiceRef.current.stopSpeaking();
                audioServiceRef.current.stopListening();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [handleTranscript, handleStateChange]);

    const toggleListening = async () => {
        if (!audioServiceRef.current) {
            console.error('Audio service not initialized');
            return;
        }

        if (isListening) {
            audioServiceRef.current.stopListening();
        } else {
            try {
                const success = await audioServiceRef.current.startListening();
                if (!success) {
                    console.warn('Failed to start listening');
                }
            } catch (error) {
                console.error('Listening error:', error);
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

    // Always show the audio interface - let errors be handled gracefully
    // Only show unsupported message if we're absolutely certain it won't work
    if (audioServiceRef.current && !audioServiceRef.current.isSupported() && typeof window !== 'undefined') {
        // Check if we're in a browser environment that definitely doesn't support audio
        const isDefinitelyUnsupported = !('mediaDevices' in navigator) && !('speechSynthesis' in window);

        if (isDefinitelyUnsupported) {
            return (
                <div className="audio-assistant unsupported">
                    <p>Audio features are not supported in this browser.</p>
                    <p className="fallback-text">You can still use the cooking interface without voice commands.</p>
                </div>
            );
        }
    }

    return (
        <div className="audio-assistant minimal">
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
        </div>
    );
} 
"use client";

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function VoiceInput({ onTranscript, className }) {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Check browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setIsSupported(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setErrorMsg(null);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) {
                onTranscript(transcript);
            }
            setErrorMsg(null);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);

            if (event.error === 'not-allowed') {
                setErrorMsg("Microphone access denied.");
            } else if (event.error === 'no-speech') {
                // Ignore no-speech, just stop listening
                setErrorMsg(null);
            } else {
                setErrorMsg("Voice error. Try again.");
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [onTranscript]);

    const toggleListening = () => {
        if (!isSupported) return;
        setErrorMsg(null);

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
            } catch (err) {
                console.error("Failed to start recognition:", err);
            }
        }
    };

    if (!isSupported) return null;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={toggleListening}
                className={cn(
                    "relative p-3 rounded-xl transition-all duration-300 flex items-center justify-center group",
                    isListening
                        ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 ring-2 ring-red-500/50"
                        : "bg-white/5 text-blue-200 hover:bg-white/10 hover:text-white border border-white/10",
                    errorMsg ? "border-red-500/50 text-red-400" : "",
                    className
                )}
                title={errorMsg || (isListening ? "Stop Listening" : "Voice Input")}
            >
                <AnimatePresence mode="wait">
                    {isListening ? (
                        <motion.div
                            key="listening"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="relative"
                        >
                            <MicOff size={20} />
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                        >
                            <Mic size={20} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tooltip-ish hint */}
                <span className={cn(
                    "absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap px-2 py-1 rounded backdrop-blur-sm",
                    errorMsg ? "bg-red-500/90 text-white" : "bg-black/50 text-white/50"
                )}>
                    {errorMsg || (isListening ? "Listening..." : "Speak")}
                </span>
            </button>
        </div>
    );
}

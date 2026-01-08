"use client";

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function VoiceInput({ onTranscript, className }) {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Check browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setIsSupported(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US'; // Default to English, could be made dynamic

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) {
                onTranscript(transcript);
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
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

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    };

    if (!isSupported) return null;

    return (
        <button
            type="button"
            onClick={toggleListening}
            className={cn(
                "relative p-3 rounded-xl transition-all duration-300 flex items-center justify-center group",
                isListening
                    ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 ring-2 ring-red-500/50"
                    : "bg-white/5 text-blue-200 hover:bg-white/10 hover:text-white border border-white/10",
                className
            )}
            title={isListening ? "Stop Listening" : "Voice Input"}
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
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-medium text-white/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                {isListening ? "Listening..." : "Speak"}
            </span>
        </button>
    );
}

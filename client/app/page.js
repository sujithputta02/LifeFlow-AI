"use client";

import { useWorkflowStore } from '../store/workflowStore';
import Workflow from '../components/Workflow';
import HistoryDashboard from '../components/HistoryDashboard';
import BadgePopup from '../components/BadgePopup';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Activity, Zap, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import VoiceInput from '../components/VoiceInput';
import LanguageSelector from '../components/LanguageSelector';

export default function Home() {
    const { workflow, isLoading, generateWorkflow, error, fetchHistory, fetchProfile } = useWorkflowStore();
    const [inputGoal, setInputGoal] = useState("");
    const [language, setLanguage] = useState("English");
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    useEffect(() => {
        // Initialize gamification profile
        fetchProfile();
    }, [fetchProfile]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputGoal.trim()) {
            generateWorkflow(inputGoal, language);
        }
    };

    return (
        <main className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4">
            {/* Animated Background */}
            <div className="absolute inset-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <AnimatePresence mode="wait">
                {!workflow && !isLoading && (
                    <motion.div
                        key="landing"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full max-w-2xl text-center z-10"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex mb-8 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl"
                        >
                            <div className="bg-gradient-to-tr from-blue-500 to-purple-500 p-3 rounded-xl shadow-lg shadow-blue-500/30">
                                <Zap className="text-white w-8 h-8" />
                            </div>
                        </motion.div>

                        <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                            LifeFlow
                        </h1>
                        <p className="text-xl text-blue-200/80 mb-6 max-w-lg mx-auto leading-relaxed font-light">
                            Turn complex bureaucratic nightmares into simple, AI-guided checklists.
                        </p>

                        <div className="flex justify-center mb-8 relative z-20">
                            <LanguageSelector language={language} setLanguage={setLanguage} />
                        </div>

                        <form onSubmit={handleSubmit} className="w-full relative group max-w-lg mx-auto">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative flex items-center">
                                <div className="absolute left-6 text-blue-400/70">
                                    <Sparkles size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={inputGoal}
                                    onChange={(e) => setInputGoal(e.target.value)}
                                    placeholder="e.g., Hospital admission for surgery..."
                                    className="w-full pl-14 pr-44 py-5 text-lg rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 backdrop-blur-xl shadow-2xl transition-all"
                                />

                                <div className="absolute right-2 flex items-center gap-2">
                                    <VoiceInput
                                        onTranscript={(text) => setInputGoal(text)}
                                        className="h-10 w-10 p-2 text-white/50 hover:text-white"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!inputGoal.trim()}
                                        className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-6 py-2.5 font-medium transition-all disabled:opacity-0 disabled:translate-x-4 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                                    >
                                        Start <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </form>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-sm backdrop-blur-md"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="mt-16 flex flex-wrap justify-center gap-6 text-sm font-medium text-white/30 uppercase tracking-widest">
                            <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-500"></div> Verified Sources</span>
                            <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-purple-500"></div> Step-by-Step</span>
                            <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-indigo-500"></div> Secure</span>
                        </div>
                    </motion.div>
                )}

                {isLoading && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center min-h-screen z-10"
                    >
                        <div className="relative w-24 h-24 mb-8">
                            <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-2 border-r-4 border-purple-500 rounded-full animate-spin animation-delay-2000"></div>
                            <div className="absolute inset-4 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Architecting Flow</h2>
                        <p className="text-blue-200/60 animate-pulse">Analyzing requirements for "{inputGoal}"</p>
                    </motion.div>
                )}

                {workflow && !isLoading && <Workflow />}
            </AnimatePresence>

            {/* History Dashboard */}
            <AnimatePresence>
                <HistoryDashboard isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
            </AnimatePresence>

            {/* History Toggle Button */}
            {!isHistoryOpen && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed bottom-6 right-6 z-40 bg-white/10 hover:bg-white/20 border border-white/10 p-3 rounded-full text-blue-200 backdrop-blur-md shadow-lg transition-all"
                    onClick={() => {
                        setIsHistoryOpen(true);
                        fetchHistory();
                    }}
                    title="View History"
                >
                    <Clock size={24} />
                </motion.button>
            )}

            <BadgePopup />
        </main >
    );
}

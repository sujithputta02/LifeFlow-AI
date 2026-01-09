"use client";

import { useWorkflowStore } from '../store/workflowStore';
import Workflow from '../components/Workflow';
import HistoryDashboard from '../components/HistoryDashboard';
import BadgePopup from '../components/BadgePopup';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import { Sparkles, ArrowRight, Activity, Zap, Clock, Shield, CheckCircle, Smartphone } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import VoiceInput from '../components/VoiceInput';
import LanguageSelector from '../components/LanguageSelector';
import Badge3D from '../components/Badge3D';

export default function Home() {
    const { workflow, isLoading, generateWorkflow, error, fetchHistory, fetchProfile } = useWorkflowStore();
    const [inputGoal, setInputGoal] = useState("");
    const [language, setLanguage] = useState("English");
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // Mouse Parallax State
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth background blob movement based on mouse
    const blob1X = useSpring(useTransform(mouseX, [0, 1], [0, 50]), { stiffness: 50, damping: 20 });
    const blob1Y = useSpring(useTransform(mouseY, [0, 1], [0, 50]), { stiffness: 50, damping: 20 });
    const blob2X = useSpring(useTransform(mouseX, [0, 1], [0, -50]), { stiffness: 50, damping: 20 });
    const blob2Y = useSpring(useTransform(mouseY, [0, 1], [0, -50]), { stiffness: 50, damping: 20 });

    useEffect(() => {
        fetchProfile();

        const handleMouseMove = (e) => {
            const { innerWidth, innerHeight } = window;
            mouseX.set(e.clientX / innerWidth);
            mouseY.set(e.clientY / innerHeight);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [fetchProfile, mouseX, mouseY]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputGoal.trim()) {
            generateWorkflow(inputGoal, language);
        }
    };

    const features = [
        {
            icon: <Zap className="w-8 h-8 text-yellow-400" />,
            title: "Instant AI Plans",
            description: "Get comprehensive, step-by-step checklists for any complex task in seconds.",
            bg: "hover:shadow-yellow-500/20"
        },
        {
            // Special 3D Feature Card
            is3D: true,
            title: "Gamified Progress",
            description: "Earn 3D badges and track your achievements as you complete real-world tasks.",
            bg: "hover:shadow-green-500/20"
        },
        {
            icon: <Smartphone className="w-8 h-8 text-blue-400" />,
            title: "Voice Powered",
            description: "Just speak your goal. Our advanced voice recognition handles the rest.",
            bg: "hover:shadow-blue-500/20"
        }
    ];

    return (
        <main className="min-h-screen relative overflow-x-hidden bg-[#0f172a] text-white selection:bg-blue-500/30">
            {/* Ambient Animated Background with Parallax */}
            <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <motion.div
                    style={{ x: blob1X, y: blob1Y }}
                    className="absolute top-[-10%] left-[-10%] w-[45rem] h-[45rem] bg-purple-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob"
                />
                <motion.div
                    style={{ x: blob2X, y: blob2Y }}
                    className="absolute top-[20%] right-[-10%] w-[40rem] h-[40rem] bg-blue-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"
                />
                <div className="absolute bottom-[-10%] left-[20%] w-[50rem] h-[50rem] bg-indigo-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
                {/* Grain Texture */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 px-6 py-4 glass-panel border-b-0 border-white/5 bg-opacity-30 backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/10">
                            <Zap className="w-5 h-5 text-white" fill="white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">LifeFlow</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <LanguageSelector language={language} setLanguage={setLanguage} />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setIsHistoryOpen(true);
                                fetchHistory();
                            }}
                            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all relative group shadow-inner"
                            title="History"
                        >
                            <Clock className="w-5 h-5 text-blue-200" />
                        </motion.button>
                    </div>
                </div>
            </nav>

            <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center">

                <AnimatePresence mode="wait">
                    {!workflow && !isLoading && (
                        <motion.div
                            key="landing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                            transition={{ duration: 0.6 }}
                            className="w-full flex flex-col items-center"
                        >
                            {/* Hero Section Split Layout */}
                            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24 min-h-[60vh]">
                                {/* Left Content */}
                                <div className="flex flex-col items-start text-left z-20">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-blue-500/30 text-blue-300 text-sm font-medium shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                                    >
                                        <Sparkles className="w-4 h-4 text-blue-400" />
                                        <span>AI-Powered Life Architect</span>
                                    </motion.div>

                                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
                                        Master Your <br />
                                        <span className="inline-block py-1 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-shimmer bg-[length:200%_auto]">Real World</span> <br />
                                        Quests.
                                    </h1>

                                    <p className="text-lg md:text-xl text-blue-200/70 mb-10 max-w-xl leading-relaxed">
                                        LifeFlow turns bureaucratic nightmares and complex projects into simple, level-by-level game plans. Ready to play?
                                    </p>

                                    {/* Input Area */}
                                    <div className="w-full max-w-xl relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500 animate-pulse"></div>
                                        <form onSubmit={handleSubmit} className="relative flex items-center bg-[#0f172a]/90 backdrop-blur-2xl rounded-xl border border-white/10 p-2 shadow-2xl transition-transform group-hover:scale-[1.01]">
                                            <input
                                                type="text"
                                                value={inputGoal}
                                                onChange={(e) => setInputGoal(e.target.value)}
                                                placeholder="Enter your mission... (e.g., 'Plan a Japan Trip')"
                                                className="w-full pl-6 pr-32 py-4 bg-transparent text-lg text-white placeholder:text-white/20 focus:outline-none font-medium"
                                            />
                                            <div className="flex items-center gap-2 pr-2">
                                                <VoiceInput onTranscript={setInputGoal} />
                                                <button
                                                    type="submit"
                                                    disabled={!inputGoal.trim()}
                                                    className="bg-blue-600 hover:bg-blue-500 text-white p-3.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 active:scale-95"
                                                >
                                                    <ArrowRight size={20} />
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>

                                {/* Right 3D Content */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 1, type: "spring" }}
                                    className="relative w-full h-[500px] hidden lg:block"
                                >
                                    <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-[100px]"></div>
                                    <div className="w-full h-full cursor-grab active:cursor-grabbing">
                                        <Badge3D id="lifeflow_hero" color="#3b82f6" isLocked={false} />
                                    </div>
                                    {/* Floating Stats Card Decoration */}
                                    <motion.div
                                        animate={{ y: [-10, 10, -10] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute top-20 right-10 glass-card p-4 rounded-xl border-l-4 border-l-green-400 z-10"
                                    >
                                        <div className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-1">Status</div>
                                        <div className="flex items-center gap-2 text-green-300 font-bold">
                                            <Activity className="w-4 h-4" /> System Online
                                        </div>
                                    </motion.div>
                                </motion.div>
                            </div>

                            {/* Features Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 w-full px-4">
                                {features.map((feature, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        whileHover={{ y: -10 }}
                                        transition={{ delay: idx * 0.1, type: "spring", stiffness: 300 }}
                                        className={`glass-card p-8 rounded-3xl flex flex-col items-center text-center group relative overflow-hidden ${feature.bg}`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                        <div className="mb-6 relative z-10 h-32 w-full flex items-center justify-center">
                                            {feature.is3D ? (
                                                <div className="w-32 h-32">
                                                    <Badge3D id="paperwork_master" color="#a855f7" isLocked={false} />
                                                </div>
                                            ) : (
                                                <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-500 shadow-2xl">
                                                    {feature.icon}
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-2xl font-bold mb-3 text-white relative z-10">{feature.title}</h3>
                                        <p className="text-blue-200/60 leading-relaxed relative z-10">{feature.description}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* How It Works Section */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="mt-40 w-full max-w-6xl mb-20"
                            >
                                <div className="text-center mb-20">
                                    <h2 className="text-4xl md:text-6xl font-bold mb-6">
                                        From Chaos to <span className="text-gradient">Clarity</span>
                                    </h2>
                                    <p className="text-blue-200/50 max-w-2xl mx-auto text-lg">Three simple steps to regain control of your life.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative px-4">
                                    {/* Connecting Line (Desktop) */}
                                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0 z-0"></div>

                                    {[
                                        { step: "01", title: "Input Goal", desc: "Type or speak your objective naturally.", icon: <Sparkles className="w-6 h-6 text-blue-400" /> },
                                        { step: "02", title: "AI Analysis", desc: "Our engine structures the chaos into logic.", icon: <Zap className="w-6 h-6 text-purple-400" /> },
                                        { step: "03", title: "Execute", desc: "Follow the game plan & verify progress.", icon: <CheckCircle className="w-6 h-6 text-green-400" /> }
                                    ].map((item, i) => (
                                        <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                                            <div className="w-24 h-24 rounded-full glass-panel border border-white/10 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(59,130,246,0.1)] bg-[#0f172a] group-hover:scale-110 transition-transform duration-300 relative">
                                                <div className="absolute inset-0 rounded-full border border-blue-500/30 scale-110 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500"></div>
                                                {item.icon}
                                                <span className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-blue-600 rounded-full text-xs font-bold border-4 border-[#0f172a]">{item.step}</span>
                                            </div>
                                            <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                            <p className="text-blue-200/50 max-w-[240px] leading-relaxed">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Trust Badge */}
                            <div className="mt-20 border-t border-white/5 w-full pt-12 pb-12">
                                <p className="text-sm text-white/30 uppercase tracking-widest mb-8 text-center font-medium">Trusted by innovative planners worldwide</p>
                                <div className="flex flex-wrap justify-center gap-12 opacity-40">
                                    <div className="flex items-center gap-2 hover:opacity-100 transition-opacity cursor-pointer"><Shield className="w-5 h-5" /> Enterprise Security</div>
                                    <div className="flex items-center gap-2 hover:opacity-100 transition-opacity cursor-pointer"><Activity className="w-5 h-5" /> 99.9% Uptime</div>
                                    <div className="flex items-center gap-2 hover:opacity-100 transition-opacity cursor-pointer"><Smartphone className="w-5 h-5" /> iOS & Android</div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {isLoading && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center min-h-[60vh] z-10"
                        >
                            <div className="relative w-full h-[400px] flex items-center justify-center mb-8">
                                {/* 3D Badge - Centered & Large - Z-Index Higher */}
                                <div className="absolute w-48 h-48 flex items-center justify-center z-20 overflow-visible">
                                    <Badge3D id="level_5" color="#f59e0b" isLocked={false} cameraPosition={[0, 0, 5]} />
                                </div>

                                {/* Spinners - Centered & Smaller - Z-Index Lower */}
                                <div className="relative w-32 h-32 flex items-center justify-center z-10 opacity-70">
                                    <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
                                    <div className="absolute inset-3 border-r-4 border-purple-500 rounded-full animate-spin animation-delay-2000"></div>
                                    <div className="absolute inset-6 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-4 z-20 relative">
                                Architecting Your Flow
                            </h2>
                            <p className="text-blue-200/60 animate-pulse text-lg z-20 relative">Analyzing requirements for "{inputGoal}"</p>
                        </motion.div>
                    )}

                    {workflow && !isLoading && (
                        <div className="w-full">
                            <Workflow />
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* History Dashboard */}
            <AnimatePresence>
                <HistoryDashboard isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
            </AnimatePresence>

            <BadgePopup />
        </main>
    );
}

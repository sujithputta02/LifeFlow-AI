"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { X } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import Badge3D from './Badge3D';

const BADGE_INFO = {
    'first_step': { name: 'First Steps', description: 'You took action! The first step is always the hardest.', icon: '⚡', color: '#10b981' },
    'verified_pro': { name: 'Verified Pro', description: 'You used AI to verify your progress. Smart move!', icon: '✓', color: '#3b82f6' },
    'level_5': { name: 'Rising Star', description: 'You reached Level 5. You are becoming a master of bureaucracy.', icon: '★', color: '#f59e0b' },
    'paperwork_master': { name: 'Paperwork Master', description: 'Legendary status achieved.', icon: '♛', color: '#8b5cf6' },
};

export default function BadgePopup() {
    const { newBadge, clearNewBadge } = useWorkflowStore();
    const [info, setInfo] = useState(null);

    useEffect(() => {
        if (newBadge && BADGE_INFO[newBadge]) {
            setInfo(BADGE_INFO[newBadge]);

            // Fire Confetti!
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: [BADGE_INFO[newBadge].color, '#ffffff']
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: [BADGE_INFO[newBadge].color, '#ffffff']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        }
    }, [newBadge]);

    return (
        <AnimatePresence>
            {newBadge && info && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    onClick={clearNewBadge}
                >
                    <motion.div
                        initial={{ scale: 0.5, y: 100, rotateX: 20 }}
                        animate={{ scale: 1, y: 0, rotateX: 0 }}
                        exit={{ scale: 0.5, y: 100, opacity: 0 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="bg-gray-900/50 border border-white/10 rounded-3xl p-12 max-w-4xl w-full text-center relative overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Background Glow */}
                        <div
                            className="absolute inset-0 opacity-30 blur-3xl"
                            style={{ background: `radial-gradient(circle at center, ${info.color}, transparent 70%)` }}
                        ></div>

                        <button
                            onClick={clearNewBadge}
                            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors z-20"
                        >
                            <X size={32} />
                        </button>

                        <div className="relative z-10">
                            <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-2">
                                New Badge Unlocked!
                            </h2>
                            <p className="text-white/60 text-lg mb-12 uppercase tracking-widest">Congratulations</p>

                            <div className="w-[32rem] h-[32rem] mx-auto cursor-grab active:cursor-grabbing mb-8">
                                <Badge3D
                                    id={newBadge}
                                    color={info.color}
                                    icon={info.icon}
                                    isLocked={false}
                                />
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <h3 className="text-4xl font-bold text-white mb-4" style={{ color: info.color }}>
                                    {info.name}
                                </h3>
                                <p className="text-blue-100/80 leading-relaxed text-xl max-w-2xl mx-auto">
                                    {info.description}
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="mt-8 text-sm text-white/30"
                            >
                                (Interacting with the badge is highly encouraged)
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

import { motion } from 'framer-motion';
import { Clock, ChevronRight, Calculator, Trash2, Award } from 'lucide-react';
import Badge3D from './Badge3D';
import { useWorkflowStore } from '../store/workflowStore';
import { cn } from '../lib/utils';

export default function HistoryDashboard({ isOpen, onClose }) {
    const { history, loadWorkflow, deleteWorkflow, userLevel, userPoints, badges } = useWorkflowStore();

    const BADGE_DEFINITIONS = [
        { id: 'first_step', name: 'First Steps', description: 'Taking action is the first step to success.', icon: '⚡', color: '#10b981' }, // Green
        { id: 'verified_pro', name: 'Verified', description: 'Used AI Verification to confirm a step.', icon: '✓', color: '#3b82f6' },   // Blue
        { id: 'level_5', name: 'Rising Star', description: 'Reached Level 5. You are climbing high!', icon: '★', color: '#f59e0b' },     // Gold
        { id: 'paperwork_master', name: 'Master', description: 'Legendary status. Nothing stops you.', icon: '♛', color: '#8b5cf6' }, // Purple
    ];

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-black/80 backdrop-blur-xl border-l border-white/10 z-50 shadow-2xl overflow-hidden flex flex-col"
        >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Clock className="text-blue-400" /> Recent Flows
                </h2>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
                >
                    <ChevronRight />
                </button>
            </div>

            {/* Gamification Stats */}
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-orange-500/20">
                        {userLevel}
                    </div>
                    <div>
                        <div className="text-xs text-blue-200 uppercase tracking-wider font-semibold">Current Rank</div>
                        <div className="text-xl font-bold text-white">
                            {userLevel < 5 ? "Novice Navigator" : userLevel < 10 ? "Bureaucracy Buster" : "Master of Paperwork"}
                        </div>
                        <div className="text-xs text-white/50">{userPoints} Total XP</div>
                    </div>
                </div>

                <div className="relative h-2 bg-black/40 rounded-full overflow-hidden">
                    <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-1000"
                        style={{ width: `${(userPoints % 100)}%` }}
                    ></div>
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-white/40 uppercase font-medium">
                    <span>{userPoints % 100} / 100 XP to Level {userLevel + 1}</span>
                </div>
            </div>

            {/* Badge Collection 3D */}
            <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Award size={16} className="text-yellow-400" /> Badge Collection
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {BADGE_DEFINITIONS.map((badgeDef) => {
                        const userBadge = badges.find(b => b.id === badgeDef.id);
                        const isUnlocked = !!userBadge;

                        return (
                            <div
                                key={badgeDef.id}
                                className={cn(
                                    "flex flex-col items-center p-3 rounded-2xl border transition-all duration-300 group relative overflow-visible",
                                    isUnlocked
                                        ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-500/30"
                                        : "bg-black/20 border-white/5 opacity-60"
                                )}
                            >
                                {/* Glow Effect for Unlocked */}
                                {isUnlocked && (
                                    <div className="absolute inset-0 bg-blue-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}

                                <div className="w-28 h-28 relative z-10 -my-2 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
                                    <Badge3D
                                        id={badgeDef.id}
                                        color={badgeDef.color}
                                        icon={badgeDef.icon}
                                        isLocked={!isUnlocked}
                                        unlockedDate={userBadge?.date} // Passing the date!
                                    />
                                </div>

                                <span className={cn(
                                    "text-xs font-bold mt-1 text-center bg-clip-text text-transparent bg-gradient-to-r",
                                    isUnlocked ? "from-white to-white/70" : "from-white/30 to-white/10"
                                )}>
                                    {badgeDef.name}
                                </span>

                                {/* Premium Tooltip */}
                                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 bg-[#0a0a0a] border border-white/10 p-3 rounded-xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-50 shadow-2xl shadow-black/50 backdrop-blur-md">
                                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                                    <div className="text-xs font-bold mb-1" style={{ color: isUnlocked ? badgeDef.color : '#666' }}>
                                        {badgeDef.name}
                                    </div>
                                    <div className="text-[10px] text-gray-400 leading-relaxed font-medium">
                                        {badgeDef.description}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {history.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10">
                        No history yet. Start a new workflow!
                    </div>
                ) : (
                    history.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => {
                                loadWorkflow(item);
                                onClose();
                            }}
                            className="bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/10 hover:border-blue-500/30 cursor-pointer transition-all group relative"
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors line-clamp-1 pr-8">
                                    {item.goal}
                                </h3>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteWorkflow(item._id);
                                    }}
                                    className="absolute top-4 right-4 p-1.5 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                                    title="Delete workflow"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full border",
                                    item.confidenceScore > 80 ? "text-green-400 border-green-500/20 bg-green-500/10" : "text-yellow-400 border-yellow-500/20 bg-yellow-500/10"
                                )}>
                                    {item.confidenceScore}% Score
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
}

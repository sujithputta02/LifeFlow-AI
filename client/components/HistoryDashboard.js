import { motion } from 'framer-motion';
import { Clock, ChevronRight, Calculator, Trash2 } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import { cn } from '../lib/utils';

export default function HistoryDashboard({ isOpen, onClose }) {
    const { history, loadWorkflow, deleteWorkflow } = useWorkflowStore();

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

"use client";

import { useWorkflowStore } from '../store/workflowStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, FileText, ExternalLink, Download, Share2, ArrowLeft, ChevronDown, ChevronUp, Loader2, Wand2, Volume2, StopCircle, BadgeCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import { useState, useEffect } from 'react';
import MapComponent from './MapComponent';

function VerificationInput({ step, onVerify }) {
    const [proof, setProof] = useState("");
    const [status, setStatus] = useState("idle"); // idle, verifying, success, error
    const [feedback, setFeedback] = useState("");

    const handleVerify = async () => {
        if (!proof.trim()) return;
        setStatus("verifying");
        setFeedback("");

        const result = await onVerify(proof);

        if (result.isComplete) {
            setStatus("success");
            setFeedback(result.feedback);
        } else {
            setStatus("error");
            setFeedback(result.feedback);
        }
    };

    return (
        <div className="space-y-3">
            <textarea
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                placeholder="Describe what you've done (e.g., 'I visited the Main Street office and submitted form 12B')..."
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-blue-100 placeholder:text-blue-300/30 focus:ring-1 focus:ring-blue-500/50 outline-none resize-none h-20"
                disabled={status === "verifying" || status === "success"}
            />

            <div className="flex items-center justify-between">
                <AnimatePresence mode="wait">
                    {feedback && (
                        <motion.span
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "text-xs font-medium px-2 py-1 rounded",
                                status === "success" ? "text-green-400 bg-green-900/20" : "text-amber-400 bg-amber-900/20"
                            )}
                        >
                            {feedback}
                        </motion.span>
                    )}
                </AnimatePresence>

                <button
                    onClick={handleVerify}
                    disabled={!proof.trim() || status === "verifying" || status === "success"}
                    className="ml-auto bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-500/10"
                >
                    {status === "verifying" ? (
                        <>
                            <Loader2 size={12} className="animate-spin" /> Verifying...
                        </>
                    ) : status === "success" ? (
                        <>
                            <CheckCircle2 size={12} /> Verified
                        </>
                    ) : (
                        <>
                            <Wand2 size={12} /> Verify with AI
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

const isOfficialSource = (url) => {
    try {
        const hostname = new URL(url).hostname;
        return hostname.endsWith('.gov') || hostname.endsWith('.edu') || hostname.endsWith('.org') || hostname.includes('who.int');
    } catch (e) {
        return false;
    }
};

export default function Workflow() {
    const { workflow, completedSteps, toggleStep, verifyStep, reset } = useWorkflowStore();
    const [expandedStep, setExpandedStep] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        return () => window.speechSynthesis.cancel();
    }, []);

    if (!workflow) return null;

    const progress = Math.round((completedSteps.length / workflow.steps.length) * 100);

    const handleSpeak = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const text = `Goal: ${workflow.goal}. ${workflow.steps.map(s => `Step ${s.stepId}: ${s.title}. ${s.description}`).join(' ')}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let yPos = 20;

        // --- Styles & Helpers ---
        const colors = {
            primary: [37, 99, 235], // Blue 600
            secondary: [79, 70, 229], // Indigo 600
            text: [15, 23, 42],     // Slate 900
            textLight: [100, 116, 139], // Slate 500
            bg: [248, 250, 252]     // Slate 50
        };

        const checkPageBreak = (heightNeeded) => {
            if (yPos + heightNeeded > pageHeight - margin) {
                doc.addPage();
                yPos = 20;
                return true;
            }
            return false;
        };

        // --- Header (Branding) ---
        // Blue Gradient Bar
        doc.setFillColor(...colors.primary);
        doc.rect(0, 0, pageWidth, 4, 'F');

        // Logo / Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.setTextColor(...colors.text);
        doc.text("LifeFlow", margin, yPos + 10);

        doc.setFontSize(10);
        doc.setTextColor(...colors.textLight);
        doc.text("AI-Powered Action Plan", margin, yPos + 18);

        // Date
        const dateStr = new Date().toLocaleDateString();
        doc.text(`Generated: ${dateStr}`, pageWidth - margin - 35, yPos + 18);

        yPos += 35;

        // --- Document Title ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(...colors.secondary);

        const titleLines = doc.splitTextToSize(workflow.goal, pageWidth - (margin * 2));
        doc.text(titleLines, margin, yPos);
        yPos += (titleLines.length * 8) + 5;

        // Confidence Badge mimic
        doc.setFillColor(240, 253, 244); // light green bg
        doc.setDrawColor(22, 163, 74);   // green border
        doc.setTextColor(22, 163, 74);   // green text
        doc.roundedRect(margin, yPos, 45, 8, 2, 2, 'FD');
        doc.setFontSize(9);
        doc.text(`${workflow.confidenceScore}% Confidence`, margin + 6, yPos + 5.5);
        yPos += 20;

        // --- Divider ---
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 15;

        // --- Steps Loop ---
        workflow.steps.forEach((step, index) => {
            const isCompleted = completedSteps.includes(step.stepId);

            // Check usage for Title + Desc + spacing
            // Approx height calculation
            const titleHeight = 8;
            const descLines = doc.splitTextToSize(step.description, pageWidth - margin - 40); // 40 for indent
            const descHeight = descLines.length * 6;
            const cardPadding = 10;
            const totalStepHeight = titleHeight + descHeight + cardPadding + 10;

            checkPageBreak(totalStepHeight);

            // Step Number Circle
            if (isCompleted) {
                doc.setFillColor(...colors.primary);
            } else {
                doc.setFillColor(226, 232, 240);
            }
            doc.circle(margin + 4, yPos + 4, 4, 'F');
            doc.setTextColor(isCompleted ? 255 : 100);
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text(`${index + 1}`, margin + 3, yPos + 5);

            // Title
            doc.setFontSize(12);
            doc.setTextColor(...colors.text);
            doc.text(step.title, margin + 15, yPos + 5);

            // Checkbox Visual
            if (isCompleted) {
                doc.setTextColor(...colors.primary);
                doc.setFontSize(10);
                doc.text("[ Completed ]", pageWidth - margin - 25, yPos + 5);
            }

            yPos += 8;

            // Description
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(...colors.textLight);
            doc.text(descLines, margin + 15, yPos);

            yPos += descHeight + 10;
        });

        // --- Footer ---
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.text("www.lifeflow.ai", pageWidth - margin - 20, pageHeight - 10);
        }

        doc.save(`LifeFlow - ${workflow.goal.substring(0, 30)}.pdf`);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `LifeFlow: ${workflow.goal}`,
                text: `Check out my workflow for ${workflow.goal}`,
                url: window.location.href,
            });
        } else {
            alert("Link copied to clipboard!");
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-8 pb-32 z-10 relative">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8 glass-panel rounded-2xl p-4"
            >
                <button
                    onClick={reset}
                    className="text-sm text-blue-200 hover:text-white flex items-center gap-2 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
                >
                    <ArrowLeft size={16} /> <span className="hidden sm:inline">Back to Search</span>
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={handleSpeak}
                        className={cn(
                            "p-2.5 rounded-xl transition-all",
                            isSpeaking ? "bg-red-500/20 text-red-300 hover:bg-red-500/30" : "text-blue-200 hover:text-white hover:bg-white/10"
                        )}
                        title={isSpeaking ? "Stop Reading" : "Read Aloud"}
                    >
                        {isSpeaking ? <StopCircle size={18} /> : <Volume2 size={18} />}
                    </button>
                    <button onClick={handleShare} className="p-2.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-all" title="Share">
                        <Share2 size={18} />
                    </button>
                    <button onClick={handleExportPDF} className="p-2.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-all" title="Export PDF">
                        <Download size={18} />
                    </button>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 text-center"
            >
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">{workflow.goal}</h1>
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
                    <p className="text-blue-200/80 text-lg">Follow these {workflow.steps.length} steps to complete your goal.</p>
                    {workflow.confidenceScore !== undefined && (
                        <div className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md",
                            workflow.confidenceScore > 80 ? "bg-green-500/20 text-green-300 border-green-500/30" :
                                workflow.confidenceScore > 50 ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
                                    "bg-red-500/20 text-red-300 border-red-500/30"
                        )}>
                            {workflow.confidenceScore}% Confidence
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Map Integration */}
            <MapComponent locationContext={workflow.locationContext} defaultQuery={workflow.goal} />

            {/* Liquid Progress Bar */}
            <div className="sticky top-4 z-50 glass-panel backdrop-blur-xl py-4 px-6 mb-10 rounded-2xl shadow-2xl ring-1 ring-white/10">
                <div className="flex justify-between text-sm font-medium mb-3">
                    <span className="text-blue-200">Progress</span>
                    <span className="text-blue-400 font-bold">{progress}%</span>
                </div>
                <div className="h-3 bg-gray-900/50 rounded-full overflow-hidden ring-1 ring-white/5">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 relative"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
                    >
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                        <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/50 blur-[4px]"></div>
                    </motion.div>
                </div>
            </div>

            {/* Steps List */}
            <div className="space-y-4">
                {workflow.steps && workflow.steps.length > 0 ? (
                    workflow.steps.map((step, index) => {
                        const isCompleted = completedSteps.includes(step.stepId);
                        const isExpanded = expandedStep === step.stepId;

                        return (
                            <motion.div
                                key={step.stepId}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                layout
                                className={cn(
                                    "group relative overflow-hidden rounded-2xl border transition-all duration-300",
                                    isCompleted
                                        ? "bg-blue-900/20 border-blue-500/30"
                                        : "bg-white/5 border-white/10 hover:border-blue-400/30 hover:bg-white/10"
                                )}
                            >
                                <div
                                    className="p-6 cursor-pointer flex items-start gap-4"
                                    onClick={() => setExpandedStep(isExpanded ? null : step.stepId)}
                                >
                                    {/* Checkbox */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleStep(step.stepId);
                                        }}
                                        className={cn(
                                            "flex-shrink-0 mt-1 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ring-2 ring-offset-2 ring-offset-transparent",
                                            isCompleted
                                                ? "bg-blue-500 text-white ring-blue-500 scale-105 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                                : "bg-transparent text-white/20 ring-white/20 hover:text-blue-400 hover:ring-blue-400"
                                        )}
                                    >
                                        <AnimatePresence mode="wait">
                                            {isCompleted ? (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    exit={{ scale: 0 }}
                                                >
                                                    <CheckCircle2 className="w-7 h-7 fill-current" />
                                                </motion.div>
                                            ) : (
                                                <Circle className="w-7 h-7" />
                                            )}
                                        </AnimatePresence>
                                    </button>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className={cn("text-lg font-semibold mb-1 transition-colors", isCompleted ? "text-blue-300/60 line-through" : "text-white")}>
                                                {step.title}
                                            </h3>
                                            {isExpanded ? <ChevronUp className="text-white/40" size={20} /> : <ChevronDown className="text-white/40" size={20} />}
                                        </div>
                                        <AnimatePresence>
                                            {(isExpanded || !isCompleted) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                >
                                                    <p className="text-blue-100/70 mt-2 leading-relaxed text-sm">{step.description}</p>

                                                    {/* Sub-steps */}
                                                    {step.subSteps && step.subSteps.length > 0 && (
                                                        <div className="mt-4 space-y-2">
                                                            {step.subSteps.map((subStep, idx) => (
                                                                <div key={idx} className="flex items-start gap-2.5 text-sm text-blue-200/90 bg-white/5 p-2 rounded-lg border border-white/5 relative group/sub hover:bg-white/10 transition-colors">
                                                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 group-hover/sub:bg-blue-300 transition-colors shrink-0"></div>
                                                                    <span className="leading-relaxed">{subStep}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Documents & Link */}
                                                    <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/5">
                                                        {step.documents && step.documents.length > 0 && step.documents.map((doc, i) => (
                                                            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-blue-200 text-xs font-medium border border-white/10">
                                                                <FileText size={10} />
                                                                {doc}
                                                            </span>
                                                        ))}
                                                        {step.source && (
                                                            <a
                                                                href={step.source}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="ml-auto inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                Verify Source <ExternalLink size={10} />
                                                                {isOfficialSource(step.source) && (
                                                                    <span className="ml-1 inline-flex items-center gap-0.5 text-green-400 font-bold" title="Official Government/Education Source">
                                                                        <BadgeCheck size={12} fill="currentColor" className="text-green-400 bg-white rounded-full" />
                                                                    </span>
                                                                )}
                                                            </a>
                                                        )}
                                                    </div>

                                                    {/* AI Verification Section */}
                                                    {!isCompleted && (
                                                        <div className="mt-6 bg-blue-900/20 rounded-xl p-4 border border-blue-500/20" onClick={(e) => e.stopPropagation()}>
                                                            <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                                                                AI Progress Verification
                                                            </h4>
                                                            <VerificationInput
                                                                step={step}
                                                                onVerify={async (proof) => {
                                                                    const result = await verifyStep(step.stepId, step.title, step.description, proof);
                                                                    return result;
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Card Glow Effect */}
                                <div className={cn(
                                    "absolute inset-0 pointer-events-none transition-opacity duration-500",
                                    isCompleted ? "opacity-20 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-transparent" : "opacity-0 group-hover:opacity-10"
                                )}></div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="text-center text-gray-400 py-10">
                        <p>No steps generated. Please try again.</p>
                    </div>
                )}
            </div>

            {/* Completion Modal */}
            <AnimatePresence>
                {progress === 100 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-gray-900 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-gradient-to-tr from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(52,211,153,0.4)]">
                                    <CheckCircle2 className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2">Wonderful!</h2>
                                <p className="text-gray-400 mb-8">You've successfully navigated this bureaucracy.</p>
                                <button
                                    onClick={reset}
                                    className="w-full py-4 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-lg"
                                >
                                    Start New Flow
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}

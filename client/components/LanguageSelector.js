import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Check } from 'lucide-react';

const languages = [
    { code: 'English', label: 'English', native: 'English' },
    { code: 'Hindi', label: 'Hindi', native: 'हिंदी' },
    { code: 'Spanish', label: 'Spanish', native: 'Español' },
    { code: 'French', label: 'French', native: 'Français' },
    { code: 'German', label: 'German', native: 'Deutsch' },
    { code: 'Telugu', label: 'Telugu', native: 'తెలుగు' }
];

export default function LanguageSelector({ language, setLanguage }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedLang = languages.find(l => l.code === language) || languages[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative z-50" ref={dropdownRef}>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-blue-100 text-sm rounded-full px-4 py-2 backdrop-blur-md transition-all shadow-lg shadow-black/5"
            >
                <Globe size={16} className="text-blue-400" />
                <span className="font-medium">{selectedLang.label}</span>
                <ChevronDown
                    size={16}
                    className={`text-blue-400/70 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full mt-2 right-0 w-48 bg-[#0f172a]/90 border border-white/10 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-1 space-y-0.5 max-h-64 overflow-y-auto custom-scrollbar">
                            {languages.map((lang) => (
                                <motion.button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${language === lang.code
                                            ? 'bg-blue-600/20 text-blue-200'
                                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">{lang.label}</span>
                                        <span className="text-xs opacity-50">{lang.native}</span>
                                    </div>
                                    {language === lang.code && (
                                        <Check size={14} className="text-blue-400" />
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

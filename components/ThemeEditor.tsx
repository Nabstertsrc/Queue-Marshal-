import React from 'react';
import { useTheme, Theme } from '../contexts/ThemeContext';

interface ThemeEditorProps {
    onClose: () => void;
}

const themeOptions: { id: Theme; name: string; desc: string; colors: string[] }[] = [
    { id: 'default', name: 'Queue Marshal', desc: 'The classic vibrant look', colors: ['bg-[#00D26A]', 'bg-[#1A1A1A]'] },
    { id: 'cyberpunk', name: 'Neon Cyberpunk', desc: 'High contrast futuristic', colors: ['bg-[#FF0066]', 'bg-[#0F0F1E]'] },
    { id: 'luxury', name: 'Prestige Gold', desc: 'Elegant & sophisticated', colors: ['bg-[#D4AF37]', 'bg-[#14120F]'] },
    { id: 'ocean', name: 'Deep Ocean', desc: 'Calming dark blue depths', colors: ['bg-[#00BFFF]', 'bg-[#051428]'] },
    { id: 'minimal', name: 'Polar Minimal', desc: 'Clean, simple, pure', colors: ['bg-[#FFFFFF]', 'bg-[#1E1E1E]'] },
];

const ThemeEditor: React.FC<ThemeEditorProps> = ({ onClose }) => {
    const { theme: activeTheme, setTheme } = useTheme();

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] animate-fade-in" onClick={onClose}>
            <div
                className="bg-dark-800 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-dark-600/50 p-6 w-full sm:max-w-md relative animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="sm:hidden flex justify-center mb-4">
                    <div className="w-10 h-1 bg-dark-500 rounded-full"></div>
                </div>

                <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-dark-600 hover:bg-dark-500 text-dark-300 hover:text-white transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Theme Details</h2>
                    <p className="text-sm text-dark-300 mt-1">Customize your app experience</p>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {themeOptions.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={`w-full flex items-center p-4 rounded-xl border transition-all duration-300 group ${activeTheme === t.id
                                    ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--color-primary-500),0.15)] relative overflow-hidden'
                                    : 'bg-dark-700 border-dark-500 hover:border-dark-400 hover:bg-dark-600'
                                }`}
                        >
                            {activeTheme === t.id && (
                                <div className="absolute inset-0 bg-app-gradient opacity-20 pointers-events-none"></div>
                            )}

                            <div className="relative flex-1 flex items-center justify-between">
                                <div className="text-left">
                                    <span className={`block font-bold text-base ${activeTheme === t.id ? 'text-primary' : 'text-white group-hover:text-primary-400 transition-colors'}`}>
                                        {t.name}
                                    </span>
                                    <span className="block text-xs text-dark-300 mt-1">{t.desc}</span>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <div className={`w-5 h-5 rounded-full ${t.colors[0]} shadow-md border border-dark-600`}></div>
                                    <div className={`w-5 h-5 rounded-full ${t.colors[1]} shadow-md border border-dark-600`}></div>
                                    {activeTheme === t.id && (
                                        <div className="ml-3 text-primary animate-scale-in">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ThemeEditor;

import React from 'react';
import { UserRole } from '../types';

interface HowItWorksModalProps {
    onClose: () => void;
    userRole?: UserRole;
}

const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ onClose, userRole }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
            <div
                className="bg-dark-800 border border-dark-600/50 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-dark-800/80 backdrop-blur-md p-6 border-b border-dark-600/50 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">How it Works</h2>
                        <p className="text-dark-300 text-sm">Master the Queue-Marshal platform in minutes.</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-dark-700 hover:bg-dark-600 text-dark-200 transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-8 space-y-12">
                    {/* Section: Requesters */}
                    <section>
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">For Requesters</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { step: '01', title: 'Post Task', desc: 'Describe your queue and location. Use our AI to polish your request.' },
                                { step: '02', title: 'Pick Marshal', desc: 'Wait for a verified local Marshal to accept your request in real-time.' },
                                { step: '03', title: 'Swap & Relax', desc: 'Coordinate via chat, arrive when they reach the front, and take your spot!' }
                            ].map((item, i) => (
                                <div key={i} className="relative p-5 bg-dark-700/30 rounded-2xl border border-dark-600/30">
                                    <span className="absolute -top-3 -left-2 text-4xl font-black text-primary/10 tracking-tighter select-none">{item.step}</span>
                                    <h4 className="text-white font-bold mb-2 relative">{item.title}</h4>
                                    <p className="text-dark-300 text-xs leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section: Marshals */}
                    <section>
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">For Marshals</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { step: '01', title: 'Get Vetted', desc: 'Upload your ID and bank details to become a verified Queue-Marshal.' },
                                { step: '02', title: 'Accept Tasks', desc: 'Browse the live map and accept nearby wait-requests.' },
                                { step: '03', title: 'Earn Money', desc: 'Stand in line and get paid directly to your wallet or in cash.' }
                            ].map((item, i) => (
                                <div key={i} className="relative p-5 bg-dark-700/30 rounded-2xl border border-dark-600/30">
                                    <span className="absolute -top-3 -left-2 text-4xl font-black text-purple-500/10 tracking-tighter select-none">{item.step}</span>
                                    <h4 className="text-white font-bold mb-2 relative">{item.title}</h4>
                                    <p className="text-dark-300 text-xs leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Features Highlight */}
                    <section className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.047a1 1 0 01.8 1.45l-3.002 5.492a1 1 0 00.1.9c.2.2.4.3.7.3H15a1 1 0 01.8 1.45l-5 9.166a1 1 0 01-1.8-1.55l3.003-5.492a1 1 0 00-.1-.9 1 1 0 00-.7-.3H5a1 1 0 01-.8-1.45l5-9.166a1 1 0 011.8.197z" clipRule="evenodd" /></svg>
                            Power Features
                        </h3>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <li className="flex items-start space-x-2">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                                <p className="text-xs text-dark-200"><span className="text-white font-semibold">Gemini AI:</span> Auto-generates task titles and improves descriptions.</p>
                            </li>
                            <li className="flex items-start space-x-2">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                                <p className="text-xs text-dark-200"><span className="text-white font-semibold">Live Map:</span> Accurate GPS tracking of task locations.</p>
                            </li>
                            <li className="flex items-start space-x-2">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                                <p className="text-xs text-dark-200"><span className="text-white font-semibold">Yoco Secure:</span> South Africa\'s most trusted card payment gateway.</p>
                            </li>
                            <li className="flex items-start space-x-2">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                                <p className="text-xs text-dark-200"><span className="text-white font-semibold">Instant Chat:</span> Coordinate hand-offs with real-time messaging.</p>
                            </li>
                        </ul>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 bg-dark-900/50 border-t border-dark-600/50 flex justify-center">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-primary text-dark-900 font-bold rounded-xl hover:bg-primary-400 transition-all shadow-lg shadow-primary/20"
                    >
                        Got it, thanks!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HowItWorksModal;

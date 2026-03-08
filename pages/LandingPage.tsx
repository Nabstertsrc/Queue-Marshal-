import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogoIcon } from '../components/icons/LogoIcon';
import AnimatedBackground from '../components/AnimatedBackground';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const siteUrl = "https://profilegenius.fun";
    const shareMessage = "Reclaim your time with Queue Marshal! The premiere marketplace for time.";

    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(siteUrl)}`;
    const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage + " " + siteUrl)}`;
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`;

    return (
        <div className="min-h-screen bg-dark-900 text-white selection:bg-primary/30 scroll-smooth overflow-x-hidden">
            <AnimatedBackground />

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-dark-900/80 backdrop-blur-xl border-b border-dark-600/50 px-6 py-4 flex justify-between items-center transition-all duration-300">
                <div className="flex items-center space-x-2 group cursor-pointer" onClick={() => navigate('/')}>
                    <LogoIcon className="h-8 w-8 sm:h-9 sm:w-9 transition-transform group-hover:scale-110" />
                    <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">Queue-Marshal</span>
                </div>
                <div className="flex items-center space-x-4 sm:space-x-6">
                    <Link to="/login" className="text-sm font-medium text-dark-200 hover:text-primary transition-colors">Log In</Link>
                    <Link to="/register" className="px-5 py-2.5 bg-primary text-dark-900 text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-400 hover:scale-105 active:scale-95 transition-all">Sign Up</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 overflow-hidden">
                <div className="flex-1 space-y-8 animate-slide-up">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase">
                        The Premiere Marketplace for Time
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black leading-tight tracking-tighter">
                        The <span className="text-primary italic">100-Hour</span> Thief: <br />
                        <span className="text-dark-200">The Hidden Cost of Waiting</span>
                    </h1>
                    <p className="text-xl text-dark-200 max-w-xl leading-relaxed">
                        The average person spends over 100 hours per year standing in lines. Reclaim your day with Queue Marshal—the definitive solution for on-demand queuing services.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Link to="/register" className="px-8 py-4 bg-primary text-dark-900 text-lg font-black rounded-2xl shadow-[0_0_30px_rgba(var(--color-primary-500),0.3)] hover:bg-primary-400 hover:-translate-y-1 transition-all text-center">
                            Start Saving Time
                        </Link>
                        <a href="#solution" className="px-8 py-4 glass border border-dark-600 text-lg font-bold rounded-2xl hover:bg-dark-800 transition-all text-center">
                            Explore solution
                        </a>
                    </div>

                    {/* Share Buttons */}
                    <div className="pt-8 flex items-center space-x-6 border-t border-dark-700/50">
                        <span className="text-sm font-medium text-dark-300">Share:</span>
                        <div className="flex space-x-4">
                            <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer" className="text-dark-300 hover:text-[#1DA1F2] transition-colors"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg></a>
                            <a href={whatsappShareUrl} target="_blank" rel="noopener noreferrer" className="text-dark-300 hover:text-[#25D366] transition-colors"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg></a>
                            <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer" className="text-dark-300 hover:text-[#1877F2] transition-colors"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg></a>
                        </div>
                    </div>
                </div>
                <div className="flex-1 relative animate-scale-in">
                    <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full animate-pulse-slow"></div>
                    <div className="relative glass p-4 rounded-[3rem] border border-white/10 shadow-2xl skew-y-3 hover:skew-y-0 transition-all duration-700">
                        <img
                            src="/images/hero.png"
                            alt="People in line"
                            className="rounded-[2.5rem] object-cover h-[500px] w-full"
                        />
                        <div className="absolute -bottom-6 -left-6 glass p-6 rounded-2xl border border-white/20 shadow-xl animate-bounce-slow">
                            <div className="text-3xl font-black text-primary">100+</div>
                            <div className="text-xs font-bold text-dark-200 uppercase tracking-widest">Hours Wasted Annually</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Problem Section */}
            <section id="solution" className="py-24 px-6 bg-dark-800/50">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6">
                        <h2 className="text-4xl font-extrabold tracking-tight">
                            The Challenge of <span className="text-primary">Time Poverty</span>
                        </h2>
                        <ul className="space-y-4">
                            {[
                                "Queuing is a significant opportunity cost for busy professionals and business owners.",
                                "Current solutions are fragmented, informal, or non-existent for everyday essential tasks.",
                                "Growing 'time-poverty' creates an urgent demand for on-demand queuing services.",
                                "Queue-Marshal is the definitive solution to reclaim this lost time."
                            ].map((text, i) => (
                                <li key={i} className="flex items-start space-x-3 group">
                                    <span className="mt-1.5 w-5 h-0.5 bg-primary group-hover:w-8 transition-all"></span>
                                    <p className="text-dark-200 group-hover:text-white transition-colors">{text}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="glass rounded-[2rem] p-10 border border-white/5 space-y-8 shadow-2xl">
                        <div className="space-y-2">
                            <div className="text-primary font-bold uppercase tracking-widest text-xs">The Solution</div>
                            <h3 className="text-3xl font-bold">A Unified Platform</h3>
                        </div>
                        <div className="grid gap-6">
                            {[
                                { title: "Trust \u0026 Safety", desc: "Built on a foundation of Trust and Safety with manual verification of all service providers.", icon: "🛡\ufe0f" },
                                { title: "Seamless Experience", desc: "Seamless, tech-driven experience including AI-assisted task posting and real-time tracking.", icon: "⚡" },
                                { title: "Secure Escrow", desc: "Secure escrow payment system to protect both parties and ensure service delivery.", icon: "🔒" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-start space-x-4">
                                    <div className="w-12 h-12 rounded-xl bg-dark-700 flex items-center justify-center text-xl">{item.icon}</div>
                                    <div>
                                        <h4 className="font-bold">{item.title}</h4>
                                        <p className="text-sm text-dark-300">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Requesters Section */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row gap-16 items-center">
                    <div className="flex-1 order-2 md:order-1 relative">
                        <div className="glass overflow-hidden rounded-[2.5rem] border border-white/10">
                            <img
                                src="/images/requester.png"
                                alt="Requester"
                                className="w-full h-[400px] object-cover hover:scale-105 transition-transform duration-1000"
                            />
                        </div>
                    </div>
                    <div className="flex-1 order-1 md:order-2 space-y-8">
                        <h2 className="text-5xl font-black tracking-tight">For Requesters:<br /><span className="text-primary underline decoration-2 underline-offset-8">Buying Back Your Freedom</span></h2>
                        <div className="grid gap-8">
                            {[
                                { title: "AI Suggest", desc: "Leverage Gemini AI to write professional task descriptions.", icon: "✏\ufe0f" },
                                { title: "Live Map Interface", desc: "Pinpoint exact locations via integrated Google Maps.", icon: "📍" },
                                { title: "Flexible Payments", desc: "Secure options including Yoco, PayPal, and Cash.", icon: "💳" }
                            ].map((feat, i) => (
                                <div key={i} className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                                    <div className="w-10 h-10 text-primary flex items-center justify-center text-2xl">{feat.icon}</div>
                                    <div>
                                        <div className="font-black tracking-tight">{feat.title}</div>
                                        <div className="text-sm text-dark-300">{feat.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Marshals Section */}
            <section className="py-24 px-6 bg-primary text-black">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
                    <div className="flex-1 space-y-8">
                        <div className="inline-block px-3 py-1 bg-black/10 rounded-full text-xs font-bold uppercase tracking-widest border border-black/10">The Opportunity</div>
                        <h2 className="text-6xl font-black tracking-tighter leading-none text-black">For Marshals:<br />Turning Patience into Profit</h2>
                        <div className="grid gap-4">
                            {[
                                "Live Map: See top-paying requests nearby at a glance.",
                                "Professional Autonomy: Inspect distance, fees, and ratings.",
                                "Live Wallet: Monitor earnings and withdraw to verified accounts.",
                                "Vetted Community: Join a trusted network with human-led onboarding."
                            ].map((text, i) => (
                                <div key={i} className="flex items-center space-x-3 font-bold text-black/90">
                                    <span className="w-2 h-2 bg-black rounded-full"></span>
                                    <span>{text}</span>
                                </div>
                            ))}
                        </div>
                        <Link to="/register" className="inline-block px-10 py-5 bg-black text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl">
                            Join the Network
                        </Link>
                    </div>
                    <div className="flex-1">
                        <div className="rounded-[3rem] overflow-hidden border-8 border-black/10 shadow-2xl">
                            <img
                                src="/images/marshal.png"
                                alt="Marshal"
                                className="w-full h-[500px] object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-6 border-t border-dark-600/30">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center space-x-3">
                        <LogoIcon className="h-8 w-auto" />
                        <span className="font-bold tracking-tight">Queue Marshal</span>
                    </div>
                    <div className="flex space-x-8 text-sm font-medium text-dark-300">
                        <Link to="/login" className="hover:text-primary transition-colors">Login</Link>
                        <Link to="/register" className="hover:text-primary transition-colors">Signup</Link>
                        <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                    </div>
                    <div className="text-xs text-dark-400">
                        © 2026 Queue Marshal. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

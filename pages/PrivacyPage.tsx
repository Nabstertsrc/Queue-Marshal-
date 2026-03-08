import React from 'react';
import { Link } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';

const PrivacyPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-dark-900 text-white selection:bg-primary/30">
            <AnimatedBackground />

            <nav className="fixed top-0 w-full z-50 bg-dark-900/80 backdrop-blur-xl border-b border-dark-600/50 px-6 py-4 flex justify-between items-center">
                <Link to="/" className="flex items-center space-x-2 group">
                    <span className="text-xl font-bold tracking-tight text-white hover:text-primary transition-colors">← Back to Home</span>
                </Link>
            </nav>

            <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <div className="glass p-8 sm:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8">
                    <section className="space-y-4">
                        <h1 className="text-4xl font-black tracking-tight text-primary">Privacy Policy</h1>
                        <p className="text-dark-300">Last Updated: March 8, 2026</p>
                        <p className="text-dark-200 leading-relaxed">
                            At Queue Marshal, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information when you use our on-demand queuing platform.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">1. Information We Collect</h2>
                        <ul className="list-disc list-inside text-dark-200 space-y-2 ml-4">
                            <li><strong>Account Information:</strong> Name, email address, phone number, and profile picture.</li>
                            <li><strong>Location Data:</strong> Real-time GPS location (required for matching Requesters with nearby Marshals).</li>
                            <li><strong>Payment Information:</strong> Handled securely via third-party processors (Yoco, PayPal). We do not store full credit card details on our servers.</li>
                            <li><strong>Task History:</strong> Details of tasks posted or accepted, including descriptions and locations.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">2. How We Use Your Information</h2>
                        <ul className="list-disc list-inside text-dark-200 space-y-2 ml-4">
                            <li>To facilitate task matching between Requesters and Marshals.</li>
                            <li>To process payments and payouts.</li>
                            <li>To send critical notifications regarding task status and account security.</li>
                            <li>To verify the identity of Marshals for community safety.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">3. Data Sharing</h2>
                        <p className="text-dark-200 leading-relaxed">
                            We share necessary information between a Requester and a Marshal only when a task is accepted (e.g., location coordinates and contact details). We never sell your personal data to third-party advertisers.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">4. Security</h2>
                        <p className="text-dark-200 leading-relaxed">
                            We use industry-standard encryption and Firebase Authentication to protect your data. However, no method of transmission over the internet is 100% secure.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">5. Your Rights</h2>
                        <p className="text-dark-200 leading-relaxed">
                            You may request a copy of your data or ask for the deletion of your account at any time by contacting us at support@profilegenius.fun.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPage;

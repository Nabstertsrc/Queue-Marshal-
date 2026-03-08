import React from 'react';
import { Link } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';

const TermsPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-dark-900 text-white selection:bg-primary/30">
            <AnimatedBackground />

            <nav className="fixed top-0 w-full z-50 bg-dark-900/80 backdrop-blur-xl border-b border-dark-600/50 px-6 py-4 flex justify-between items-center transition-all">
                <Link to="/" className="flex items-center space-x-2 group">
                    <span className="text-xl font-bold tracking-tight text-white hover:text-primary transition-colors">← Back to Home</span>
                </Link>
            </nav>

            <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <div className="glass p-8 sm:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8">
                    <section className="space-y-4">
                        <h1 className="text-4xl font-black tracking-tight text-primary">Terms of Service</h1>
                        <p className="text-dark-300">Last Updated: March 8, 2026</p>
                        <p className="text-dark-200 leading-relaxed">
                            Welcome to Queue Marshal, the on-demand queuing service platform. By using our website and mobile application, you agree to comply with the following terms.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">1. Eligibility</h2>
                        <ul className="list-disc list-inside text-dark-200 space-y-2 ml-4">
                            <li>You must be at least 18 years old to use the platform.</li>
                            <li>Marshals must undergo manual identity verification before they can accept tasks.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">2. Task Terms</h2>
                        <ul className="list-disc list-inside text-dark-200 space-y-2 ml-4">
                            <li><strong>Requesters:</strong> You are responsible for accurately describing the task and being reachable at the task location.</li>
                            <li><strong>Marshals:</strong> You must represent yourself professionally and complete the task in the requested timeframe.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">3. Payments & Fees</h2>
                        <ul className="list-disc list-inside text-dark-200 space-y-2 ml-4">
                            <li><strong>Commission:</strong> Queue Marshal deducts a small platform fee (5%) and VAT from each paid task.</li>
                            <li><strong>Pre-Paid Tasks:</strong> Paid via card and held in escrow until the task is marked as complete.</li>
                            <li><strong>On the Spot:</strong> Handled directly in cash between the Requester and Marshal. Platform fees are still calculated and may be deducted from the Marshal's virtual wallet.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">4. Cancellations & Refunds</h2>
                        <p className="text-dark-200 leading-relaxed">
                            Tasks can be canceled by either party before work begins. Once a task is "In Progress," cancellations may incur fees or penalties at the discretion of the administrator.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">5. Liability Disclaimer</h2>
                        <p className="text-dark-200 leading-relaxed">
                            Queue Marshal provides a marketplace to connect users. We are not responsible for the actions or behavior of individual users, nor for any loss or injury that occurs during a task.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">6. Account Termination</h2>
                        <p className="text-dark-200 leading-relaxed">
                            Any account that violates these terms, including fraudulent behaviors or harassment, will be terminated immediately.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default TermsPage;

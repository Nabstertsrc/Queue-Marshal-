import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-white/10 py-6 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left hover:text-primary transition-colors gap-4"
            >
                <span className="text-lg font-bold text-white">{question}</span>
                <span className={`text-2xl transition-transform duration-300 ${isOpen ? 'rotate-45 text-primary' : 'text-dark-400'}`}>+</span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="text-dark-200 leading-relaxed">{answer}</p>
            </div>
        </div>
    );
};

const FAQPage: React.FC = () => {
    const faqs = [
        {
            question: "What exactly is Queue Marshal?",
            answer: "Queue Marshal is an on-demand marketplace where you can hire someone (a 'Marshal') to stand in a queue on your behalf at banks, government offices, or any service line. It's designed to help busy professionals reclaim their time."
        },
        {
            question: "How do I become a Marshal?",
            answer: "Simply register on our platform as a Marshal, complete your profile, and then wait for an administrator to verify your account. Once verified, you can see all open tasks on the live map and start accepting them."
        },
        {
            question: "Is my payment secure?",
            answer: "Yes. For Pre-Paid tasks, we use secure payment gateways (Yoco and PayPal) and hold the funds in escrow. The Marshal is only paid once the task is marked as completed by both parties."
        },
        {
            question: "What if a Marshal doesn't show up?",
            answer: "If a Marshal accepts a task but fails to arrive at the location, you can cancel the request and receive a full refund if it was pre-paid. Please report such incidents to support for investigation."
        },
        {
            question: "How do I know where my Marshal is?",
            answer: "Our platform provides real-time location tracking. Once a Marshal is 'In Progress' with your task, you can see their exact position on the map in your dashboard."
        },
        {
            question: "What are the fees for using Queue Marshal?",
            answer: "Requesters pay the fee set for the task plus a small platform commission and VAT. Requesters can also choose 'On the Spot' payment (cash directly to the Marshal) for flexibility."
        },
        {
            question: "Can I cancel a request after posting it?",
            answer: "Yes, you can cancel an 'Open' request at any time for a full refund. Once a Marshal has accepted and started traveling, cancellation might incur a small convenience fee."
        }
    ];

    return (
        <div className="min-h-screen bg-dark-900 text-white selection:bg-primary/30">
            <AnimatedBackground />

            <nav className="fixed top-0 w-full z-50 bg-dark-900/80 backdrop-blur-xl border-b border-dark-600/50 px-6 py-4 flex justify-between items-center transition-all">
                <Link to="/" className="flex items-center space-x-2 group">
                    <span className="text-xl font-bold tracking-tight text-white hover:text-primary transition-colors">← Back to Home</span>
                </Link>
            </nav>

            <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <div className="glass p-8 sm:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <div className="text-center mb-12 space-y-4">
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-primary uppercase">Frequently Asked Questions</h1>
                        <p className="text-dark-300 text-lg">Everything you need to know about using Queue-Marshal.</p>
                    </div>

                    <div className="divide-y divide-white/5">
                        {faqs.map((faq, index) => (
                            <FAQItem key={index} question={faq.question} answer={faq.answer} />
                        ))}
                    </div>

                    <div className="mt-16 p-8 bg-primary/5 rounded-3xl border border-primary/20 text-center space-y-4">
                        <h3 className="text-2xl font-bold text-white">Still have questions?</h3>
                        <p className="text-dark-200">We're here to help you get your time back. Contact our support team for any further assistance.</p>
                        <a href="mailto:support@profilegenius.fun" className="inline-block px-8 py-3 bg-primary text-dark-900 font-bold rounded-xl hover:bg-primary-400 transition-colors">
                            Contact Support
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default FAQPage;

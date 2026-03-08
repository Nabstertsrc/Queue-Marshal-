import React from 'react';
import { Link } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';
import { LogoIcon } from '../components/icons/LogoIcon';

const WelcomePage: React.FC = () => {
    const siteUrl = "https://profilegenius.fun";
    const shareMessage = "I just signed up for Queue Marshal! Get your time back by hiring a verified marshal to stand in line for you. Sign up today:";

    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(siteUrl)}`;
    const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage + " " + siteUrl)}`;
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`;

    return (
        <>
            <AnimatedBackground />
            <div className="min-h-screen bg-transparent flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-lg animate-slide-up">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center border-4 border-primary shadow-[0_0_30px_rgba(var(--color-primary-500),0.3)]">
                            <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>

                    <div className="glass rounded-3xl p-8 sm:p-10 shadow-2xl text-center border border-dark-600/50">
                        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Welcome to Queue Marshal!</h2>
                        <p className="text-dark-200 mb-6">
                            Your account has been successfully created. We've sent a <strong>verification link</strong> to your email address.
                            Please verify your account to get full access to all features.
                        </p>

                        <div className="bg-dark-800/80 rounded-2xl p-6 border border-dark-600 mb-8">
                            <h3 className="text-lg font-bold text-white mb-4">Share with friends!</h3>
                            <p className="text-sm text-dark-300 mb-4">
                                Know someone who hates waiting in lines? Let them know about Queue Marshal!
                            </p>
                            <div className="flex justify-center space-x-4">
                                {/* Twitter */}
                                <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#1DA1F2] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                                </a>
                                {/* WhatsApp */}
                                <a href={whatsappShareUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                </a>
                                {/* Facebook */}
                                <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                </a>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col space-y-3">
                            <Link to="/login" className="w-full py-4 text-center bg-primary text-dark-900 font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-400 transition-colors">
                                Go to Dashboard (Requires Login)
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default WelcomePage;

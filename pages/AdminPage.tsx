import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { VerificationStatus } from '../types';
import type { User } from '../types';
import { StarIcon } from '../components/icons/MiscIcons';

declare const firebase: any;

const AdminPage: React.FC = () => {
    const { user } = useAuth();
    const [marshals, setMarshals] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, rejected: 0 });

    useEffect(() => {
        if (!user?.isAdmin) return;

        const unsubscribe = db.collection('users')
            .where('role', '==', 'marshal')
            .onSnapshot(snapshot => {
                const marshalData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as User[];

                setMarshals(marshalData);
                setStats({
                    total: marshalData.length,
                    pending: marshalData.filter(m => m.verificationStatus === VerificationStatus.PENDING || !m.verificationStatus).length,
                    verified: marshalData.filter(m => m.verificationStatus === VerificationStatus.VERIFIED).length,
                    rejected: marshalData.filter(m => m.verificationStatus === VerificationStatus.REJECTED).length,
                });
                setLoading(false);
            }, (error: any) => {
                console.error("Error fetching marshals:", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [user]);

    const handleVerification = async (marshalId: string, status: VerificationStatus) => {
        if (!user?.isAdmin) return;
        setProcessingId(marshalId);
        try {
            const token = await firebase.auth().currentUser.getIdToken();
            const API_URL = (import.meta as any).env?.VITE_API_URL || process.env.REACT_APP_API_URL || 'https://queue-marshal-server-production.up.railway.app';

            // Try server-side first, fall back to direct Firestore
            try {
                const response = await fetch(`${API_URL}/api/admin/verify-marshal`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ marshalId, status }),
                });
                if (!response.ok) throw new Error('Server error');
            } catch {
                // Direct Firestore update as fallback
                await db.collection('users').doc(marshalId).update({
                    verificationStatus: status,
                    verifiedAt: status === VerificationStatus.VERIFIED ? Date.now() : null,
                });
            }
        } catch (error: any) {
            console.error("Error updating verification:", error);
            alert("Failed to update verification status.");
        } finally {
            setProcessingId(null);
        }
    };

    const filteredMarshals = marshals.filter(m => {
        if (filter === 'all') return true;
        const status = m.verificationStatus || 'pending';
        return status === filter;
    });

    if (!user?.isAdmin) {
        return (
            <div className="flex-1 flex items-center justify-center bg-dark-900">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 mb-4">
                        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h2 className="text-white font-bold text-lg">Access Denied</h2>
                    <p className="text-dark-300 text-sm mt-1">Admin privileges required.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-dark-900 overflow-y-auto">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white">Marshal Vetting</h1>
                    <p className="text-dark-300 text-sm mt-1">Review and approve marshal applications</p>
                </div>

                {/* Stats cards - responsive grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: 'Total', value: stats.total, color: 'text-white', bg: 'bg-dark-700' },
                        { label: 'Pending', value: stats.pending, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        { label: 'Verified', value: stats.verified, color: 'text-primary', bg: 'bg-primary/10' },
                        { label: 'Rejected', value: stats.rejected, color: 'text-red-400', bg: 'bg-red-500/10' },
                    ].map(stat => (
                        <div key={stat.label} className={`${stat.bg} border border-dark-600/50 rounded-2xl p-4`}>
                            <p className="text-xs text-dark-400 uppercase tracking-wider">{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filter tabs */}
                <div className="flex bg-dark-800 rounded-xl p-1 border border-dark-600/50 mb-6 overflow-x-auto">
                    {(['pending', 'verified', 'rejected', 'all'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`flex-1 min-w-[80px] py-2 text-xs font-medium rounded-lg transition-all duration-200 capitalize ${filter === f ? 'bg-primary text-dark-900 shadow-lg shadow-primary/25' : 'text-dark-300 hover:text-white'
                                }`}>
                            {f}
                        </button>
                    ))}
                </div>

                {/* Marshal list */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" /></svg>
                    </div>
                ) : filteredMarshals.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-dark-700 mb-4">
                            <svg className="w-8 h-8 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <p className="text-dark-300">No marshals found with this filter.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredMarshals.map(marshal => {
                            const status = marshal.verificationStatus || VerificationStatus.PENDING;
                            const isProcessing = processingId === marshal.id;

                            return (
                                <div key={marshal.id} className="bg-dark-800 border border-dark-600/50 rounded-2xl p-4 sm:p-5 hover:border-dark-400 transition-all">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        {/* Avatar + Info */}
                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                            <div className="relative flex-shrink-0">
                                                <img className="h-12 w-12 rounded-xl object-cover ring-2 ring-dark-500" src={`https://i.pravatar.cc/150?u=${marshal.id}`} alt="" />
                                                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-dark-800 ${status === VerificationStatus.VERIFIED ? 'bg-primary' :
                                                    status === VerificationStatus.REJECTED ? 'bg-red-500' : 'bg-amber-500'
                                                    }`}></span>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center space-x-2">
                                                    <p className="text-white font-semibold text-sm truncate">{marshal.name} {marshal.surname}</p>
                                                    <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${status === VerificationStatus.VERIFIED ? 'bg-primary/15 text-primary' :
                                                        status === VerificationStatus.REJECTED ? 'bg-red-500/15 text-red-400' :
                                                            'bg-amber-500/15 text-amber-400'
                                                        }`}>
                                                        {status}
                                                    </span>
                                                </div>
                                                <p className="text-dark-400 text-xs truncate">{marshal.email}</p>
                                                <div className="flex items-center space-x-3 mt-1 text-xs text-dark-300">
                                                    <span>📱 {marshal.cellphone}</span>
                                                    <span>🪪 {marshal.idNumber}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Rating */}
                                        <div className="hidden md:flex items-center space-x-1 px-3 py-1.5 bg-dark-700 rounded-xl">
                                            <StarIcon className="w-4 h-4 text-amber-400" />
                                            <span className="text-sm text-white font-medium">
                                                {marshal.averageRating ? marshal.averageRating.toFixed(1) : '—'}
                                            </span>
                                            <span className="text-xs text-dark-400">
                                                ({marshal.ratingCount || 0})
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center space-x-2 sm:flex-shrink-0">
                                            {status !== VerificationStatus.VERIFIED && (
                                                <button
                                                    onClick={() => handleVerification(marshal.id, VerificationStatus.VERIFIED)}
                                                    disabled={isProcessing}
                                                    className="flex-1 sm:flex-none px-4 py-2 bg-primary text-dark-900 text-xs font-bold rounded-xl hover:bg-primary-400 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                                                >
                                                    {isProcessing ? (
                                                        <svg className="animate-spin h-3.5 w-3.5 mx-auto" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" /></svg>
                                                    ) : '✓ Approve'}
                                                </button>
                                            )}
                                            {status !== VerificationStatus.REJECTED && (
                                                <button
                                                    onClick={() => handleVerification(marshal.id, VerificationStatus.REJECTED)}
                                                    disabled={isProcessing}
                                                    className="flex-1 sm:flex-none px-4 py-2 bg-red-500/15 text-red-400 text-xs font-medium rounded-xl hover:bg-red-500/25 disabled:opacity-50 transition-all"
                                                >
                                                    {isProcessing ? '...' : '✕ Reject'}
                                                </button>
                                            )}
                                            {status === VerificationStatus.VERIFIED && (
                                                <button
                                                    onClick={() => handleVerification(marshal.id, VerificationStatus.PENDING)}
                                                    disabled={isProcessing}
                                                    className="flex-1 sm:flex-none px-4 py-2 bg-dark-600 text-dark-200 text-xs font-medium rounded-xl hover:bg-dark-500 disabled:opacity-50 transition-all"
                                                >
                                                    Revoke
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Verified timestamp */}
                                    {marshal.verifiedAt && status === VerificationStatus.VERIFIED && (
                                        <p className="text-[10px] text-dark-500 mt-3 pt-2 border-t border-dark-700">
                                            Verified on {new Date(marshal.verifiedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;

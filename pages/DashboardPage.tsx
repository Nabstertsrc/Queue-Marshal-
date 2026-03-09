import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TaskContext';
import { UserIcon, DocumentIcon, BankIcon, TaskIcon } from '../components/icons/DashboardIcons';
import { ChatIcon, StarIcon } from '../components/icons/MiscIcons';
import { MapPinIcon } from '../components/icons/CardIcons';
import RatingModal from '../components/RatingModal';
import LiveTrackModal from '../components/LiveTrackModal';
import type { Task, User } from '../types';
import { TaskStatus, UserRole } from '../types';

type Tab = 'profile' | 'documents' | 'banking' | 'tasks' | 'marketing';

const DashboardPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [ratingTask, setRatingTask] = useState<Task | null>(null);
    const [trackingTask, setTrackingTask] = useState<Task | null>(null);
    const [updating, setUpdating] = useState(false);
    const { user, updateUser } = useAuth();
    const { getTasksByRequester, getTasksByMarshal, completeTask } = useTasks();

    if (!user) return null;

    const myTasks = user.role === 'requester' ? getTasksByRequester(user.id) : getTasksByMarshal(user.id);

    const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const formData = new FormData(e.currentTarget);
            const updatedUser = {
                ...user,
                name: formData.get('name') as string,
                surname: formData.get('surname') as string,
                cellphone: formData.get('cellphone') as string,
            };
            await updateUser(updatedUser);
            alert('Profile updated successfully!');
        } catch (error: any) {
            alert('Error updating profile: ' + error.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleBankingUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const formData = new FormData(e.currentTarget);
            const bankName = formData.get('bankName') as string;
            const accountNumber = formData.get('accountNumber') as string;

            if (!bankName || !accountNumber) {
                alert('Please fill in both bank name and account number.');
                return;
            }

            // In a real app, we might call a server endpoint to encrypt this
            // For now, we update the user object
            const updatedUser = {
                ...user,
                bankName,
                accountNumber,
            } as User;

            await updateUser(updatedUser);
            alert('Banking details saved successfully!');
        } catch (error: any) {
            alert('Error saving banking details: ' + error.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'bank') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUpdating(true);
        try {
            // In a real app, upload to Firebase Storage
            // For now, we'll simulate success and update the status
            // We use a dummy URL to show something was uploaded
            const dummyUrl = `https://storage.googleapis.com/dummy-bucket/${type}-${user.id}.pdf`;

            const updatedUser = {
                ...user,
                [type === 'id' ? 'idDocumentUrl' : 'bankDetailsUrl']: dummyUrl,
            } as User;

            await updateUser(updatedUser);
            alert(`${type === 'id' ? 'ID Document' : 'Bank Proof'} uploaded successfully!`);
        } catch (error: any) {
            alert('Error uploading file: ' + error.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleCompleteTask = async (task: Task) => {
        if (window.confirm(`Mark "${task.title}" as complete? This will release the payment.`)) {
            try {
                await completeTask(task.id);
            } catch (error: any) {
                console.error("Failed to complete task:", error);
                alert(`Error: ${error.message || 'An error occurred.'}`);
            }
        }
    }

    const inputClasses = "w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-xl text-white placeholder-dark-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 text-sm";

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div className="animate-fade-in">
                        <form onSubmit={handleProfileUpdate} className="space-y-5">
                            {/* Profile header */}
                            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 p-6 bg-dark-700/50 rounded-[2.5rem] border border-white/5 shadow-xl group">
                                <div className="relative group/avatar">
                                    <img className="h-24 w-24 sm:h-28 sm:w-28 rounded-[2rem] object-cover ring-4 ring-dark-600 transition-all group-hover/avatar:ring-primary/50" src={`https://i.pravatar.cc/150?u=${user?.id}`} alt="User avatar" />
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-[2rem] opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => alert('Simulation: Profile photo updated!')} />
                                    </label>
                                </div>
                                <div className="flex-1 text-center sm:text-left space-y-2">
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                        <h3 className="text-2xl font-black text-white">{user.name} {user.surname}</h3>
                                        <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${user.role === 'requester' ? 'bg-primary text-dark-900' : 'bg-blue-500 text-white'}`}>
                                            {user.role}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center sm:justify-start text-sm text-dark-300">
                                        <StarIcon className="w-4 h-4 text-amber-400 mr-1.5" />
                                        <span className="font-bold text-white">
                                            {user.averageRating ? user.averageRating.toFixed(1) : '5.0'}
                                        </span>
                                        <span className="mx-2 text-dark-500">|</span>
                                        <span>{user.ratingCount || 0} reviews</span>
                                    </div>
                                    <p className="text-xs text-dark-400 max-w-sm leading-relaxed">
                                        {user.role === 'requester' ?
                                            "Helping you reclaim your time. Stop the 100-hour thief." :
                                            "Professional Queue Marshal. Verified and ready to serve."}
                                    </p>
                                </div>
                            </div>

                            <h3 className="text-sm font-medium text-dark-200 uppercase tracking-wider">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-dark-300 mb-1.5">First Name</label>
                                    <input name="name" defaultValue={user.name} className={inputClasses} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-dark-300 mb-1.5">Last Name</label>
                                    <input name="surname" defaultValue={user.surname} className={inputClasses} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-dark-300 mb-1.5">Email</label>
                                <input type="email" value={user.email} disabled className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-400 text-sm cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-dark-300 mb-1.5">Phone</label>
                                <input name="cellphone" defaultValue={user.cellphone} className={inputClasses} />
                            </div>
                            <div className="pt-2 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-dark-600/30">
                                <button type="submit" disabled={updating} className="w-full sm:w-auto px-8 py-3 bg-primary text-dark-900 font-bold text-sm rounded-xl hover:bg-primary-400 transition-all shadow-xl shadow-primary/20 disabled:opacity-50">
                                    {updating ? 'Saving...' : 'Update Settings'}
                                </button>

                                <div className="flex items-center space-x-4">
                                    <span className="text-xs font-bold text-dark-400 uppercase tracking-widest">Grow the Network:</span>
                                    <div className="flex space-x-3">
                                        <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=I'm saving hours every week with Queue Marshal! Join me at&url=https://profilegenius.fun`)} className="p-2 bg-dark-700 rounded-lg hover:text-primary transition-colors">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                                        </button>
                                        <button onClick={() => window.open(`https://api.whatsapp.com/send?text=I'm saving hours every week with Queue Marshal! Join me at https://profilegenius.fun`)} className="p-2 bg-dark-700 rounded-lg hover:text-[#25D366] transition-colors">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                );
            case 'documents':
                return (
                    <div className="animate-fade-in">
                        <h3 className="text-sm font-medium text-dark-200 uppercase tracking-wider mb-4">Verification Documents</h3>
                        <p className="text-dark-300 text-sm mb-6">Upload your documents for identity verification.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex flex-col items-center justify-center p-8 border border-dashed border-dark-500 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group">
                                <div className="w-12 h-12 rounded-xl bg-dark-600 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                                    <svg className="w-6 h-6 text-dark-300 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                                </div>
                                <span className="text-sm text-dark-200 font-medium">ID Document</span>
                                <span className="text-xs text-dark-400 mt-1">{user.idDocumentUrl ? 'Uploaded ✓' : 'Click to upload'}</span>
                                <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'id')} disabled={updating} />
                            </label>
                            <label className="flex flex-col items-center justify-center p-8 border border-dashed border-dark-500 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group">
                                <div className="w-12 h-12 rounded-xl bg-dark-600 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                                    <svg className="w-6 h-6 text-dark-300 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                </div>
                                <span className="text-sm text-dark-200 font-medium">Bank Details Proof</span>
                                <span className="text-xs text-dark-400 mt-1">{user.bankDetailsUrl ? 'Uploaded ✓' : 'Click to upload'}</span>
                                <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'bank')} disabled={updating} />
                            </label>
                        </div>
                    </div>
                );
            case 'banking':
                return (
                    <div className="animate-fade-in">
                        <h3 className="text-sm font-medium text-dark-200 uppercase tracking-wider mb-4">Earnings & Banking</h3>

                        {/* Balance card */}
                        <div className="p-6 bg-gradient-to-br from-primary/15 to-primary/5 rounded-2xl border border-primary/20 mb-6">
                            <p className="text-dark-200 text-xs uppercase tracking-wider">Available Balance</p>
                            <p className="text-4xl font-bold text-white mt-1">R {user.balance.toFixed(2)}</p>
                            <div className="flex space-x-3 mt-4">
                                <Link to="/payment" className="px-5 py-2 bg-primary text-dark-900 text-sm font-semibold rounded-xl hover:bg-primary-400 transition-all shadow-lg shadow-primary/20">
                                    Top Up Wallet
                                </Link>
                                <button className="px-5 py-2 bg-dark-600 text-white text-sm font-semibold rounded-xl hover:bg-dark-500 transition-all">
                                    Withdraw Funds
                                </button>
                            </div>
                        </div>

                        <h4 className="text-sm font-medium text-dark-200 uppercase tracking-wider mb-3">Bank Account</h4>
                        <form onSubmit={handleBankingUpdate} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-dark-300 mb-1.5">Bank Name</label>
                                <input name="bankName" defaultValue={(user as any).bankName} className={inputClasses} placeholder="e.g., FNB, Standard Bank" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-dark-300 mb-1.5">Account Number</label>
                                <input name="accountNumber" defaultValue={(user as any).accountNumber} className={inputClasses} placeholder="Your account number" />
                            </div>
                            <button type="submit" disabled={updating} className="px-6 py-2.5 bg-dark-600 text-white text-sm font-medium rounded-xl hover:bg-dark-500 transition-all disabled:opacity-50">
                                {updating ? 'Saving...' : 'Save Banking Info'}
                            </button>
                        </form>
                    </div>
                );
            case 'tasks':
                return (
                    <div className="animate-fade-in">
                        <h3 className="text-sm font-medium text-dark-200 uppercase tracking-wider mb-4">
                            {user.role === 'requester' ? 'My Requests' : 'My Jobs'}
                        </h3>
                        <div className="space-y-3">
                            {myTasks.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-dark-700 mb-4">
                                        <TaskIcon className="w-8 h-8 text-dark-400" />
                                    </div>
                                    <p className="text-dark-300">No tasks found.</p>
                                </div>
                            )}
                            {myTasks.map(task => (
                                <div key={task.id} className="p-4 bg-dark-700/50 rounded-2xl border border-dark-600 hover:border-dark-400 transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <p className="font-semibold text-white text-sm truncate">{task.title}</p>
                                                <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${task.status === TaskStatus.OPEN ? 'bg-blue-500/15 text-blue-400' :
                                                    task.status === TaskStatus.IN_PROGRESS ? 'bg-amber-500/15 text-amber-400' :
                                                        'bg-primary/15 text-primary'
                                                    }`}>
                                                    {task.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-dark-400 truncate">{task.location.address}</p>
                                            <p className="text-sm font-bold text-primary mt-1">
                                                R {user.role === UserRole.REQUESTER
                                                    ? (task.totalFee || (task.fee * 1.05 * 1.15)).toFixed(2)
                                                    : task.fee.toFixed(2)}
                                                {user.role === UserRole.REQUESTER && <span className="text-[10px] text-dark-400 ml-1 font-normal">(total)</span>}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end space-y-2">
                                            {task.status === TaskStatus.IN_PROGRESS && (
                                                <Link to={`/chat/${task.id}`} className="flex items-center text-xs text-white bg-dark-500 hover:bg-dark-400 px-3 py-1.5 rounded-lg transition-colors">
                                                    <ChatIcon className="h-3.5 w-3.5 mr-1.5" /> Chat
                                                </Link>
                                            )}
                                            {user.role === UserRole.REQUESTER && task.status === TaskStatus.IN_PROGRESS && task.marshalId && (
                                                <button onClick={() => setTrackingTask(task)} className="flex items-center text-xs text-white bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg transition-colors">
                                                    <MapPinIcon className="h-3.5 w-3.5 mr-1.5" /> Track
                                                </button>
                                            )}
                                            {user.role === UserRole.MARSHAL && task.status === TaskStatus.IN_PROGRESS && (
                                                <button onClick={() => handleCompleteTask(task)} className="text-xs bg-primary text-dark-900 hover:bg-primary-400 px-3 py-1.5 rounded-lg font-semibold transition-colors shadow-lg shadow-primary/20">
                                                    Complete
                                                </button>
                                            )}
                                            {task.status === TaskStatus.COMPLETED && (
                                                (user.role === UserRole.REQUESTER && !task.requesterRated) ||
                                                (user.role === UserRole.MARSHAL && !task.marshalRated)
                                            ) && (
                                                    <button onClick={() => setRatingTask(task)} className="flex items-center text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 px-3 py-1.5 rounded-lg transition-colors">
                                                        <StarIcon className="h-3.5 w-3.5 mr-1.5" /> Rate
                                                    </button>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'marketing':
                return (
                    <div className="animate-fade-in space-y-8">
                        <div>
                            <h3 className="text-sm font-medium text-dark-200 uppercase tracking-wider mb-2">Marketing Assets</h3>
                            <p className="text-dark-300 text-sm">Use these professionally crafted assets to grow your business and find more tasks.</p>
                        </div>
                        <div className="glass p-6 rounded-2xl border border-primary/20 bg-primary/5 shadow-2xl">
                            <h4 className="text-white font-bold mb-3 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                High-Converting Copy
                            </h4>
                            <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-600 font-mono text-xs text-dark-200 relative group">
                                <p className="whitespace-pre-wrap">Is your Saturday worth R150? 🤷‍♂️ \nStop spending it at the back of a line... Join me at: https://profilegenius.fun</p>
                                <button onClick={() => { navigator.clipboard.writeText(`Is your Saturday worth R150? 🤷‍♂️ \nStop spending it at the back of a line... https://profilegenius.fun`); alert('Copied!'); }} className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-dark-700 rounded-md text-primary">Copy</button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    const TabButton: React.FC<{ tab: Tab, label: string, icon: React.ReactNode }> = ({ tab, label, icon }) => (
        <button onClick={() => setActiveTab(tab)}
            className={`flex items-center space-x-3 p-3 rounded-xl w-full text-left transition-all duration-200 ${activeTab === tab
                ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                : 'text-dark-200 hover:bg-dark-700 border border-transparent'
                }`}>
            {icon}
            <span className="text-sm">{label}</span>
        </button>
    );

    return (
        <div className="flex-1 bg-dark-900 overflow-y-auto">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1">
                        <div className="bg-dark-800 rounded-2xl border border-dark-600/50 p-3 space-y-1 sticky top-20">
                            <TabButton tab="profile" label="Profile" icon={<UserIcon className="h-5 w-5" />} />
                            <TabButton tab="documents" label="Documents" icon={<DocumentIcon className="h-5 w-5" />} />
                            <TabButton tab="banking" label="Earnings" icon={<BankIcon className="h-5 w-5" />} />
                            <TabButton tab="tasks" label={user.role === 'requester' ? 'My Requests' : 'My Jobs'} icon={<TaskIcon className="h-5 w-5" />} />
                            <TabButton tab="marketing" label="Marketing" icon={
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            } />
                        </div>
                    </div>
                    <div className="md:col-span-3">
                        <div className="bg-dark-800 rounded-2xl border border-dark-600/50 p-6 min-h-[400px]">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>
            {ratingTask && <RatingModal task={ratingTask} onClose={() => setRatingTask(null)} />}
            {trackingTask && <LiveTrackModal task={trackingTask} onClose={() => setTrackingTask(null)} />}
        </div>
    );
};

export default DashboardPage;

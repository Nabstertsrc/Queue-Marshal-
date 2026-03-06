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

type Tab = 'profile' | 'documents' | 'banking' | 'tasks';

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
                            <div className="flex items-center space-x-4 p-4 bg-dark-700/50 rounded-2xl border border-dark-600">
                                <img className="h-16 w-16 rounded-2xl object-cover ring-2 ring-dark-500" src={`https://i.pravatar.cc/150?u=${user?.id}`} alt="User avatar" />
                                <div>
                                    <h3 className="text-lg font-bold text-white">{user.name} {user.surname}</h3>
                                    <div className="flex items-center text-sm text-dark-300 mt-0.5">
                                        <StarIcon className="w-4 h-4 text-amber-400 mr-1" />
                                        <span>
                                            {user.averageRating ? `${user.averageRating.toFixed(1)} (${user.ratingCount || 0})` : 'No ratings yet'}
                                        </span>
                                    </div>
                                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${user.role === 'requester' ? 'bg-primary/15 text-primary' : 'bg-blue-500/15 text-blue-400'}`}>
                                        {user.role}
                                    </span>
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
                            <div className="pt-2">
                                <button type="submit" disabled={updating} className="px-6 py-2.5 bg-primary text-dark-900 font-semibold text-sm rounded-xl hover:bg-primary-400 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
                                    {updating ? 'Saving...' : 'Save Changes'}
                                </button>
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
                                            <p className="text-sm font-bold text-primary mt-1">R {task.fee.toFixed(2)}</p>
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

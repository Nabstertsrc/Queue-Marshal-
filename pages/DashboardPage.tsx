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
    const { user, updateUser } = useAuth();
    const { getTasksByRequester, getTasksByMarshal, completeTask } = useTasks();

    if (!user) return null;
    
    const myTasks = user.role === 'requester' ? getTasksByRequester(user.id) : getTasksByMarshal(user.id);
    
    const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const updatedUser = {
            ...user,
            name: formData.get('name') as string,
            surname: formData.get('surname') as string,
            cellphone: formData.get('cellphone') as string,
        };
        updateUser(updatedUser);
        alert('Profile updated successfully!');
    };

    const handleCompleteTask = async (task: Task) => {
        if(window.confirm(`Are you sure you want to mark "${task.title}" as complete? This will release the payment.`)){
            try {
                await completeTask(task.id);
            } catch (error: any) {
                console.error("Failed to complete task:", error);
                alert(`Error: ${error.message || 'An error occurred while completing the task.'}`);
            }
        }
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                         <div className="flex items-center space-x-4 mb-4">
                            <img className="h-20 w-20 rounded-full object-cover" src={`https://i.pravatar.cc/150?u=${user?.id}`} alt="User avatar" />
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{user.name} {user.surname}</h3>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <StarIcon className="w-5 h-5 text-yellow-400 mr-1" />
                                    <span>
                                        {user.averageRating ? `${user.averageRating.toFixed(1)} (${user.ratingCount || 0} ratings)` : 'No ratings yet'}
                                    </span>
                                </div>
                            </div>
                        </div>

                         <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input name="name" defaultValue={user.name} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Surname</label>
                                <input name="surname" defaultValue={user.surname} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" value={user.email} disabled className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Cellphone</label>
                            <input name="cellphone" defaultValue={user.cellphone} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                        </div>
                        <div className="pt-2">
                             <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700">Save Changes</button>
                        </div>
                    </form>
                );
            case 'documents':
                 return (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">My Documents</h3>
                        <div className="mt-4 space-y-4">
                            <p className="text-gray-600">Upload and manage your verification documents.</p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">ID Document</label>
                                <input type="file" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary hover:file:bg-primary-100"/>
                            </div>
                        </div>
                    </div>
                );
            case 'banking':
                return (
                    <div>
                         <h3 className="text-lg font-medium text-gray-900">Banking Details & Earnings</h3>
                         <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                            <p className="text-gray-700">Current Balance</p>
                            <p className="text-3xl font-bold text-primary">R {user.balance.toFixed(2)}</p>
                         </div>
                         <div className="mt-6 space-y-4">
                            <p className="text-gray-600">Update your banking details to receive payouts.</p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                                <input className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Account Number</label>
                                <input className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                             <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700">Save Banking Info</button>
                         </div>
                    </div>
                );
            case 'tasks':
                return (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">{user.role === 'requester' ? 'My Created Tasks' : 'My Accepted Jobs'}</h3>
                        <div className="mt-4 space-y-4">
                            {myTasks.length === 0 && <p className="text-gray-500">No tasks found.</p>}
                            {myTasks.map(task => (
                                <div key={task.id} className="p-4 border rounded-lg bg-white shadow-sm flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-800">{task.title}</p>
                                        <p className="text-sm text-gray-500">{task.location.address}</p>
                                        <p className="text-sm text-gray-600">Fee: <span className="font-bold">R {task.fee.toFixed(2)}</span></p>
                                    </div>
                                    <div className="text-right flex flex-col items-end space-y-2">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                                task.status === TaskStatus.OPEN ? 'bg-blue-100 text-blue-800' :
                                                task.status === TaskStatus.IN_PROGRESS ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {task.status}
                                        </span>
                                        {task.status === TaskStatus.IN_PROGRESS && (
                                            <Link to={`/chat/${task.id}`} className="flex items-center text-sm text-white bg-primary hover:bg-primary-700 px-3 py-1 rounded-md">
                                                <ChatIcon className="h-4 w-4 mr-1"/> Chat
                                            </Link>
                                        )}
                                        {user.role === UserRole.REQUESTER && task.status === TaskStatus.IN_PROGRESS && task.marshalId && (
                                            <button onClick={() => setTrackingTask(task)} className="flex items-center text-sm text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-md">
                                                <MapPinIcon className="h-4 w-4 mr-1"/> Track Marshal
                                            </button>
                                        )}
                                        {user.role === UserRole.MARSHAL && task.status === TaskStatus.IN_PROGRESS && (
                                            <button onClick={() => handleCompleteTask(task)} className="text-sm text-white bg-accent hover:bg-green-600 px-3 py-1 rounded-md">
                                                Mark as Complete
                                            </button>
                                        )}
                                        {task.status === TaskStatus.COMPLETED && (
                                            (user.role === UserRole.REQUESTER && !task.requesterRated) ||
                                            (user.role === UserRole.MARSHAL && !task.marshalRated)
                                        ) && (
                                            <button onClick={() => setRatingTask(task)} className="flex items-center text-sm text-white bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded-md">
                                                <StarIcon className="h-4 w-4 mr-1"/> Rate
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
        }
    };
    
    const TabButton: React.FC<{tab: Tab, label: string, icon: React.ReactNode}> = ({tab, label, icon}) => (
        <button onClick={() => setActiveTab(tab)}
                className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-colors ${activeTab === tab ? 'bg-primary-50 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <div className="flex-1 bg-gray-100">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-lg shadow p-4 space-y-2">
                           <TabButton tab="profile" label="Profile" icon={<UserIcon className="h-5 w-5" />} />
                           <TabButton tab="documents" label="Documents" icon={<DocumentIcon className="h-5 w-5" />} />
                           <TabButton tab="banking" label="Banking & Earnings" icon={<BankIcon className="h-5 w-5" />} />
                           <TabButton tab="tasks" label={user.role === 'requester' ? 'My Tasks' : 'My Jobs'} icon={<TaskIcon className="h-5 w-5" />} />
                        </div>
                    </div>
                    <div className="md:col-span-3">
                        <div className="bg-white rounded-lg shadow p-6 min-h-[400px]">
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

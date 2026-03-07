import React from 'react';
import { Link } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { TaskStatus } from '../types';

const MessagesPage: React.FC = () => {
    const { tasks } = useTasks();
    const { user } = useAuth();

    // Filter tasks where the user is involved and a marshal is assigned
    const relevantTasks = tasks.filter(task =>
        (task.requesterId === user?.id || task.marshalId === user?.id) &&
        task.marshalId // Only show tasks with a marshal assigned as those have chats
    ).sort((a, b) => b.createdAt - a.createdAt);

    return (
        <div className="flex-1 bg-dark-900 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="flex flex-col mb-8">
                    <h1 className="text-3xl font-black text-white tracking-tight">Messages</h1>
                    <p className="text-dark-300 mt-2">Manage your active conversations with Marshals and Requesters.</p>
                </div>

                {relevantTasks.length === 0 ? (
                    <div className="bg-dark-800 rounded-3xl border border-dark-600/50 p-12 text-center animate-fade-in">
                        <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No active chats</h3>
                        <p className="text-dark-400 max-w-xs mx-auto mb-6">Chats will appear here once a Marshal accepts a task or when you accept a request.</p>
                        <Link
                            to="/"
                            className="inline-flex items-center px-6 py-3 bg-primary text-dark-900 font-bold rounded-xl hover:bg-primary-400 transition-all shadow-lg shadow-primary/20"
                        >
                            Explore Tasks
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {relevantTasks.map(task => (
                            <Link
                                key={task.id}
                                to={`/chat/${task.id}`}
                                className="block group"
                            >
                                <div className="bg-dark-800 hover:bg-dark-700 border border-dark-600/50 rounded-2xl p-5 transition-all duration-300 transform group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-black/20 relative overflow-hidden">
                                    {/* Status Indicator */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.status === TaskStatus.IN_PROGRESS ? 'bg-amber-500' :
                                            task.status === TaskStatus.COMPLETED ? 'bg-primary' : 'bg-dark-500'
                                        }`} />

                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${task.status === TaskStatus.IN_PROGRESS ? 'bg-amber-500/10 text-amber-500' :
                                                        task.status === TaskStatus.COMPLETED ? 'bg-primary/10 text-primary' : 'bg-dark-600 text-dark-400'
                                                    }`}>
                                                    {task.status}
                                                </span>
                                                <span className="text-[10px] text-dark-400">
                                                    {new Date(task.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white truncate group-hover:text-primary transition-colors">
                                                {task.title}
                                            </h3>
                                            <p className="text-dark-400 text-sm truncate mt-0.5">
                                                {task.location.address}
                                            </p>
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-sm font-bold text-white">R{task.fee}</p>
                                                <p className="text-[10px] text-dark-400 uppercase tracking-widest">{task.paymentMethod}</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center text-dark-200 group-hover:bg-primary group-hover:text-dark-900 transition-all">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesPage;

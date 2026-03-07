import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { ChatMessage, Task } from '../types';

// Declare firebase to access the SDK's auth state directly
declare const firebase: any;

const ChatPage: React.FC = () => {
    const { taskId } = useParams<{ taskId: string }>();
    const { user, loading: authLoading } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [task, setTask] = useState<Task | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (authLoading) {
            return;
        }

        const currentUser = firebase.auth().currentUser;

        if (!user || !currentUser || !taskId) {
            if (!authLoading) {
                setError("You must be logged in to view this chat.");
            }
            setLoading(false);
            return;
        }

        let isMounted = true;
        let unsubscribeFromMessages = () => { };

        const setupChatListener = async () => {
            try {
                await currentUser.getIdToken(true);
                if (!isMounted) return;

                const taskRef = db.collection('tasks').doc(taskId);
                const taskDoc = await taskRef.get();
                if (!isMounted) return;

                if (!taskDoc.exists) {
                    setError('This task could not be found.');
                    setLoading(false);
                    return;
                }

                const taskData = { id: taskDoc.id, ...taskDoc.data() } as Task;

                if (currentUser.uid !== taskData.requesterId && currentUser.uid !== taskData.marshalId) {
                    setError("You are not authorized to view this chat.");
                    setLoading(false);
                    return;
                }

                setTask(taskData);

                const messagesQuery = db.collection('chats').doc(taskId).collection('messages').orderBy('timestamp', 'asc');

                unsubscribeFromMessages = messagesQuery.onSnapshot(
                    (snapshot: any) => {
                        if (isMounted) {
                            const msgs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as ChatMessage));
                            setMessages(msgs);
                            setError('');
                            setLoading(false);
                        }
                    },
                    (err: any) => {
                        console.error("Chat snapshot listener error:", err);
                        if (isMounted) {
                            setError("Connection lost. Please refresh.");
                            setLoading(false);
                        }
                    }
                );

            } catch (err) {
                console.error("Error setting up chat:", err);
                if (isMounted) {
                    setError("Failed to load chat.");
                    setLoading(false);
                }
            }
        };

        setLoading(true);
        setError('');
        setupChatListener();

        return () => {
            isMounted = false;
            unsubscribeFromMessages();
        };

    }, [taskId, user, authLoading]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user || !taskId) return;

        const messageData = {
            taskId,
            senderId: user.id,
            text: newMessage,
            timestamp: Date.now(),
        };

        try {
            await db.collection('chats').doc(taskId).collection('messages').add(messageData);

            // Notify the other party via push notification
            if (task) {
                const recipientId = user.id === task.requesterId ? task.marshalId : task.requesterId;
                if (recipientId) {
                    const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://queue-marshal-server-production.up.railway.app';
                    const token = await firebase.auth().currentUser.getIdToken();

                    fetch(`${API_URL}/api/notifications/chat`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            taskId,
                            recipientId,
                            messageSnippet: newMessage.substring(0, 100)
                        })
                    }).catch(err => console.error("Error triggering push notification:", err));
                }
            }

            setNewMessage('');
        } catch (err) {
            console.error("Error sending message:", err);
            alert("Could not send message.");
        }
    };

    if (loading || authLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-dark-900">
                <div className="flex items-center space-x-3">
                    <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" /></svg>
                    <span className="text-dark-300 text-sm">Loading chat...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center bg-dark-900">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/15 mb-3">
                        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.834-1.964-.834-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                    </div>
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (!task) {
        return <div className="flex-1 flex items-center justify-center bg-dark-900 text-dark-300">Task not found.</div>;
    }

    return (
        <div className="flex-1 flex flex-col bg-dark-900">
            {/* Chat header */}
            <div className="bg-dark-800 border-b border-dark-600/50 px-4 py-3">
                <div className="container mx-auto flex items-center space-x-3">
                    <Link to="/dashboard" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-dark-600 transition-colors">
                        <svg className="w-5 h-5 text-dark-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm font-semibold text-white truncate">{task.title}</h1>
                        <p className="text-xs text-dark-400 truncate">{task.location.address}</p>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-amber-500/15 text-amber-400 uppercase tracking-wider">
                        {task.status}
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 container mx-auto">
                <div className="space-y-3 max-w-2xl mx-auto">
                    {messages.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-dark-400 text-sm">No messages yet. Say hello!</p>
                        </div>
                    )}
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl ${msg.senderId === user?.id
                                ? 'bg-primary text-dark-900 rounded-br-md'
                                : 'bg-dark-700 text-white rounded-bl-md'
                                }`}>
                                <p className="text-sm">{msg.text}</p>
                                <p className={`text-[10px] mt-1 text-right ${msg.senderId === user?.id ? 'text-dark-900/50' : 'text-dark-400'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="bg-dark-800 border-t border-dark-600/50 p-3 sticky bottom-0">
                <div className="container mx-auto max-w-2xl">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-2.5 bg-dark-700 border border-dark-500 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary text-sm transition-all"
                        />
                        <button type="submit" disabled={!newMessage.trim()} className="bg-primary text-dark-900 rounded-xl h-10 w-10 flex items-center justify-center flex-shrink-0 hover:bg-primary-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;

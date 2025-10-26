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
            return; // Wait for auth context to initialize
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
        let unsubscribeFromMessages = () => {};

        const setupChatListener = async () => {
            try {
                // Ensure a fresh auth token is available before making Firestore requests.
                // This is the key fix to prevent the race condition.
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
                    (snapshot) => {
                        if (isMounted) {
                            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
                            setMessages(msgs);
                            setError(''); // Clear previous errors on success
                            setLoading(false);
                        }
                    },
                    (err) => {
                        console.error("Chat snapshot listener error:", err);
                        if (isMounted) {
                            setError("You don't have permission to view this chat or the connection was lost.");
                            setLoading(false);
                        }
                    }
                );

            } catch (err) {
                console.error("Error setting up chat:", err);
                if (isMounted) {
                    setError("Failed to load chat information.");
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
            setNewMessage('');
        } catch (err) {
            console.error("Error sending message:", err);
            alert("Could not send message. Please check your connection.");
        }
    };

    if (loading || authLoading) {
        return <div className="flex-1 flex items-center justify-center">Loading chat...</div>;
    }
    
    if (error) {
        return <div className="flex-1 flex items-center justify-center text-red-500 p-4 text-center">{error}</div>;
    }
    
    if (!task) {
        return <div className="flex-1 flex items-center justify-center">Task not found or access denied.</div>;
    }

    return (
        <div className="flex-1 flex flex-col bg-gray-100">
             <div className="bg-white shadow-sm p-4 border-b">
                <div className="container mx-auto">
                    <Link to="/dashboard" className="text-sm text-primary hover:underline">&larr; Back to Dashboard</Link>
                    <h1 className="text-xl font-bold mt-1">Chat for: {task.title}</h1>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 container mx-auto">
                <div className="space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                msg.senderId === user?.id
                                    ? 'bg-primary text-white rounded-br-none'
                                    : 'bg-white text-gray-800 rounded-bl-none'
                            }`}>
                                <p>{msg.text}</p>
                                <p className="text-xs opacity-75 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div ref={messagesEndRef} />
            </div>
            <div className="bg-white p-4 border-t sticky bottom-0">
                <div className="container mx-auto">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button type="submit" className="bg-primary text-white rounded-full h-10 w-10 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;

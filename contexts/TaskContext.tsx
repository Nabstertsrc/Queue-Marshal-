import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase';
import type { Task, TaskContextType, User } from '../types';
import { TaskStatus, PaymentMethod } from '../types';
import { useAuth } from './AuthContext';

const TaskContext = createContext<TaskContextType | null>(null);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setTasks([]); 
      return;
    }

    const unsubscribe = db.collection('tasks').onSnapshot(snapshot => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(tasksData);
    }, (error: any) => {
      console.error("Error fetching tasks in real-time: ", error);
    });

    return () => unsubscribe();
  }, [user]);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'status' | 'requesterId' | 'paymentMethod'>, paymentMethod: PaymentMethod): Promise<Task> => {
    if (!user || !auth.currentUser) throw new Error("User not authenticated");

    try {
      // Get the Firebase ID token for the current user.
      const token = await auth.currentUser.getIdToken();

      // Send the request to the backend server.
      const response = await fetch('http://localhost:3001/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Send the token for authentication
        },
        body: JSON.stringify({ taskData, paymentMethod }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task on the server.');
      }

      const createdTask = await response.json();
      return createdTask as Task;
    } catch (error) {
      console.error("Error adding task via backend:", error);
      // Re-throw the error to be caught by the calling component (e.g., RequestModal)
      throw error;
    }
  }, [user]);

  const acceptTask = useCallback(async (taskId: string): Promise<void> => {
    if (!user || !auth.currentUser) throw new Error("User not authenticated");
    
    try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`http://localhost:3001/api/tasks/${taskId}/accept`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to accept task.');
        }
        // UI will update automatically via the onSnapshot listener.
    } catch (error) {
        console.error("Error accepting task via backend:", error);
        throw error;
    }
  }, [user]);

  const completeTask = useCallback(async (taskId: string): Promise<void> => {
    if (!user || !auth.currentUser) throw new Error("User not authenticated");

    try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`http://localhost:3001/api/tasks/${taskId}/complete`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to complete task.');
        }
        // UI will update automatically via the onSnapshot listener.
    } catch (error) {
        console.error("Error completing task via backend:", error);
        throw error;
    }
  }, [user]);
  
  const deleteTask = useCallback(async (taskId: string) => {
    // This can remain a client-side action if secured by Firestore rules,
    // or be moved to the backend for consistency. For now, we leave it.
    await db.collection('tasks').doc(taskId).delete();
  }, []);
  
  const addRating = useCallback(async (taskId: string, ratedUserId: string, rating: number, comment?: string) => {
    if (!user) throw new Error("User must be logged in to rate.");

    const ratedUserRef = db.collection('users').doc(ratedUserId);
    const taskRef = db.collection('tasks').doc(taskId);
    const ratingRef = db.collection('ratings').doc();

    await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(ratedUserRef);
        if (!userDoc.exists) {
            throw new Error("User to be rated not found.");
        }
        const userData = userDoc.data() as User;
        
        const oldRatingTotal = (userData.averageRating || 0) * (userData.ratingCount || 0);
        const newRatingCount = (userData.ratingCount || 0) + 1;
        const newAverageRating = (oldRatingTotal + rating) / newRatingCount;

        transaction.update(ratedUserRef, {
            averageRating: newAverageRating,
            ratingCount: newRatingCount,
        });

        transaction.set(ratingRef, {
            taskId,
            ratedUserId,
            ratedByUserId: user.id,
            rating,
            comment,
            createdAt: Date.now()
        });
        
        const fieldToUpdate = user.role === 'requester' ? { requesterRated: true } : { marshalRated: true };
        transaction.update(taskRef, fieldToUpdate);
    });
  }, [user]);


  const getTasksByRequester = useCallback((requesterId: string) => {
    return tasks.filter(task => task.requesterId === requesterId);
  }, [tasks]);

  const getTasksByMarshal = useCallback((marshalId: string) => {
    return tasks.filter(task => task.marshalId === marshalId);
  }, [tasks]);

  const openTasks = tasks.filter(task => task.status === TaskStatus.OPEN);

  const value = {
    tasks,
    openTasks,
    addTask,
    acceptTask,
    completeTask,
    deleteTask,
    addRating,
    getTasksByRequester,
    getTasksByMarshal,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
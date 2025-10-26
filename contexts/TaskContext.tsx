import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { db } from '../firebase';
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
    if (!user) throw new Error("User not authenticated");

    const newTaskPayload = {
      ...taskData,
      requesterId: user.id,
      createdAt: Date.now(),
      status: TaskStatus.OPEN,
      paymentMethod: paymentMethod,
    };

    const docRef = await db.collection('tasks').add(newTaskPayload);
    
    return { ...newTaskPayload, id: docRef.id };
  }, [user]);

  const acceptTask = useCallback(async (taskId: string): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    
    const taskRef = db.collection('tasks').doc(taskId);
    await taskRef.update({
        status: TaskStatus.IN_PROGRESS,
        marshalId: user.id
    });
  }, [user]);

  const completeTask = useCallback(async (taskId: string): Promise<void> => {
     if (!user) throw new Error("User not authenticated");

     const taskRef = db.collection('tasks').doc(taskId);
     await taskRef.update({
         status: TaskStatus.COMPLETED
     });
  }, [user]);
  
  const deleteTask = useCallback(async (taskId: string) => {
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
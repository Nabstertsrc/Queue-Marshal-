import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import type { Task, TaskContextType } from '../types';
import { TaskStatus, PaymentMethod } from '../types';

declare const firebase: any;

const TaskContext = createContext<TaskContextType | null>(null);
const API_URL = (import.meta as any).env?.VITE_API_URL || process.env.REACT_APP_API_URL || '';

const getAuthToken = async (): Promise<string> => {
  const currentUser = firebase.auth().currentUser;
  if (!currentUser) throw new Error('Not authenticated.');
  return currentUser.getIdToken();
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Only subscribe if we have an authenticated user
    const unsubscribeAuth = auth.onAuthStateChanged((user: any) => {
      if (user) {
        const unsubscribeTasks = db.collection('tasks')
          .orderBy('createdAt', 'desc')
          .onSnapshot(
            (snapshot: any) => {
              const taskData = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
              })) as Task[];
              setTasks(taskData);
            },
            (error: any) => {
              console.error('Error subscribing to tasks:', error);
            }
          );
        return () => unsubscribeTasks();
      } else {
        setTasks([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const openTasks = tasks.filter((task) => task.status === TaskStatus.OPEN);

  const addTask = async (
    taskData: Omit<Task, 'id' | 'createdAt' | 'status' | 'requesterId' | 'paymentMethod'>,
    paymentMethod: PaymentMethod
  ): Promise<Task> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ taskData, paymentMethod }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const newTask = await response.json();
      return newTask as Task;
    } catch (error: any) {
      console.error('Error adding task via API:', error);

      // Fallback: create directly in Firestore for development
      const currentUser = firebase.auth().currentUser;
      if (!currentUser) throw new Error('Not authenticated.');

      const newTaskPayload = {
        ...taskData,
        requesterId: currentUser.uid,
        createdAt: Date.now(),
        status: TaskStatus.OPEN,
        paymentMethod: paymentMethod,
        marshalId: null,
        requesterRated: false,
        marshalRated: false,
      };

      const docRef = await db.collection('tasks').add(newTaskPayload);
      return { id: docRef.id, ...newTaskPayload } as Task;
    }
  };

  const acceptTask = async (taskId: string): Promise<void> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/tasks/${taskId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept task.');
      }
    } catch (error: any) {
      // Fallback for development
      if (error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) throw new Error('Not authenticated.');

        const taskRef = db.collection('tasks').doc(taskId);
        const taskDoc = await taskRef.get();
        if (!taskDoc.exists) throw new Error('Task not found.');
        if (taskDoc.data().status !== 'Open') throw new Error('Task no longer available.');

        await taskRef.update({
          status: TaskStatus.IN_PROGRESS,
          marshalId: currentUser.uid,
        });
      } else {
        throw error;
      }
    }
  };

  const completeTask = async (taskId: string): Promise<void> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete task.');
      }
    } catch (error: any) {
      if (error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        await db.collection('tasks').doc(taskId).update({ status: TaskStatus.COMPLETED });
      } else {
        throw error;
      }
    }
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete task.');
      }
    } catch (error: any) {
      if (error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        await db.collection('tasks').doc(taskId).delete();
      } else {
        throw error;
      }
    }
  };

  const addRating = async (taskId: string, ratedUserId: string, rating: number, comment?: string): Promise<void> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/tasks/${taskId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ratedUserId, rating, comment }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add rating.');
      }
    } catch (error: any) {
      // Fallback for development
      if (error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) throw new Error('Not authenticated.');

        await db.collection('ratings').add({
          taskId,
          ratedUserId,
          ratedByUserId: currentUser.uid,
          rating,
          comment: comment || '',
          createdAt: Date.now(),
        });

        // Update task flags
        const taskDoc = await db.collection('tasks').doc(taskId).get();
        if (taskDoc.exists) {
          const taskData = taskDoc.data();
          const isRequester = currentUser.uid === taskData.requesterId;
          await db.collection('tasks').doc(taskId).update({
            [isRequester ? 'requesterRated' : 'marshalRated']: true,
          });
        }

        // Update user's average rating
        const userDoc = await db.collection('users').doc(ratedUserId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          const currentCount = userData.ratingCount || 0;
          const currentAvg = userData.averageRating || 0;
          const newCount = currentCount + 1;
          const newAvg = ((currentAvg * currentCount) + rating) / newCount;

          await db.collection('users').doc(ratedUserId).update({
            averageRating: Math.round(newAvg * 100) / 100,
            ratingCount: newCount,
          });
        }
      } else {
        throw error;
      }
    }
  };

  const getTasksByRequester = (requesterId: string): Task[] =>
    tasks.filter((task) => task.requesterId === requesterId);

  const getTasksByMarshal = (marshalId: string): Task[] =>
    tasks.filter((task) => task.marshalId === marshalId);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        openTasks,
        addTask,
        acceptTask,
        completeTask,
        deleteTask,
        addRating,
        getTasksByRequester,
        getTasksByMarshal,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
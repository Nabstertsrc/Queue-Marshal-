import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase';
import type { User, AuthContextType } from '../types';
import { UserRole } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser: any) => {
      if (authUser) {
        const userDoc = await db.collection('users').doc(authUser.uid).get();
        if (userDoc.exists) {
          setUser({ id: authUser.uid, ...userDoc.data() } as User);
        } else {
          auth.signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string, role: UserRole): Promise<void> => {
    try {
      const { user: authUser } = await auth.signInWithEmailAndPassword(email, password);
      const userDoc = await db.collection('users').doc(authUser.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data() as User;
        if (userData.role === role) {
          // The onAuthStateChanged listener will handle setting the user state.
          return;
        } else {
          await auth.signOut();
          throw new Error('User role does not match.');
        }
      } else {
        await auth.signOut();
        throw new Error('User data not found.');
      }
    } catch (error: any) {
      let message = 'Failed to log in. Please check your credentials.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          message = 'Invalid email or password.';
      } else if (error.message) {
          message = error.message;
      }
      throw new Error(message);
    }
  }, []);

  const register = useCallback(async (userData: Omit<User, 'id' | 'balance'> & { password?: string }): Promise<void> => {
    if (!userData.password) {
        throw new Error("Password is required for registration.");
    }
    try {
      const { user: authUser } = await auth.createUserWithEmailAndPassword(userData.email, userData.password);
      
      const userToStore: Omit<User, 'id' | 'balance'> & { id: string, balance: number } = {
        id: authUser.uid,
        name: userData.name,
        surname: userData.surname,
        cellphone: userData.cellphone,
        email: userData.email,
        idNumber: userData.idNumber,
        role: userData.role,
        location: userData.location,
        balance: 0
      };

      await db.collection('users').doc(authUser.uid).set(userToStore);
      await auth.signOut();
    } catch (error: any) {
      let message = 'Failed to register.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists.';
      } else if (error.message) {
        message = error.message;
      }
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    await auth.signOut();
    setUser(null);
  }, []);

  const updateUser = useCallback(async (updatedUser: User) => {
    if (!user) return;
    try {
        const { id, ...dataToUpdate } = updatedUser;
        const userRef = db.collection('users').doc(id);
        await userRef.update(dataToUpdate);
        setUser(updatedUser);
    } catch (error) {
        console.error("Error updating user: ", error);
        throw new Error("Could not update profile.");
    }
  }, [user]);

  const updateUserLocation = useCallback(async (location: { lat: number; lng: number }) => {
    if (!user) return;
    try {
      const userRef = db.collection('users').doc(user.id);
      await userRef.update({ location });
      // We don't update the local user state here to avoid re-renders on every location change.
      // The component that needs the live location will listen to Firestore directly.
    } catch (error) {
        console.error("Error updating user location: ", error);
        // Fail silently as this is a background task
    }
  }, [user]);
  
  const value = {
    isAuthenticated: !!user,
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    updateUserLocation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

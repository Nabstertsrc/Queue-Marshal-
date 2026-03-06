import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase';
import type { User, AuthContextType } from '../types';
import { UserRole, VerificationStatus } from '../types';

// Admin email - only this email can access admin features
const ADMIN_EMAIL = 'nabstertsr@gmail.com';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser: any) => {
      if (authUser) {
        const idToken = await authUser.getIdToken();
        setToken(idToken);
        const userDoc = await db.collection('users').doc(authUser.uid).get();
        if (userDoc.exists) {
          const userData = { id: authUser.uid, ...userDoc.data() } as User;

          // Auto-set admin flag for the designated admin email
          if (authUser.email === ADMIN_EMAIL && !userData.isAdmin) {
            await db.collection('users').doc(authUser.uid).update({ isAdmin: true });
            userData.isAdmin = true;
          }

          setUser(userData);
        } else {
          auth.signOut();
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
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

        // Admin role: only allowed for the designated admin email
        if (role === UserRole.ADMIN) {
          if (email.toLowerCase() !== ADMIN_EMAIL) {
            await auth.signOut();
            throw new Error('Admin access is restricted.');
          }
          // Mark as admin if not already
          if (!userData.isAdmin) {
            await db.collection('users').doc(authUser.uid).update({ isAdmin: true });
          }
          return; // onAuthStateChanged will set the user
        }

        // For non-admin roles, check role match
        if (userData.role !== role) {
          await auth.signOut();
          throw new Error(`This account is registered as a ${userData.role}, not a ${role}.`);
        }

        // onAuthStateChanged listener handles setting user state
        return;
      } else {
        await auth.signOut();
        throw new Error('User data not found. Please register first.');
      }
    } catch (error: any) {
      let message = 'Failed to log in. Please check your credentials.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
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

      const isAdminEmail = userData.email.toLowerCase() === ADMIN_EMAIL;

      const userToStore: any = {
        id: authUser.uid,
        name: userData.name,
        surname: userData.surname,
        cellphone: userData.cellphone,
        email: userData.email,
        idNumber: userData.idNumber,
        role: userData.role,
        location: userData.location,
        balance: 0,
        verificationStatus: userData.role === UserRole.MARSHAL ? VerificationStatus.PENDING : VerificationStatus.VERIFIED,
        isAdmin: isAdminEmail,
      };

      await db.collection('users').doc(authUser.uid).set(userToStore);
      await auth.signOut();
    } catch (error: any) {
      let message = 'Failed to register.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak. Use at least 6 characters.';
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
    } catch (error) {
      console.error("Error updating user location: ", error);
    }
  }, [user]);

  const value = {
    isAuthenticated: !!user,
    user,
    token,
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

'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncUserSession = async () => {
    if (!isLoaded) return;
    
    if (isSignedIn && clerkUser) {
      try {
        const payload = {
          clerkId: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          name: clerkUser.fullName || 'New User',
        };
        const res = await axios.post('/api/auth/sync', payload);
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to sync user with DB:", err);
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    syncUserSession();
  }, [isLoaded, isSignedIn, clerkUser]);

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Mock login/register to prevent old components from crashing, though they should be deleted
  const login = async () => { return { success: false, error: 'Use Clerk Sign In' }; };
  const register = async () => { return { success: false, error: 'Use Clerk Sign Up' }; };
  const checkUserSession = syncUserSession;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkUserSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

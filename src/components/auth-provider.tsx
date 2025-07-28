"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

// Define the shape of the context data
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true });

// This is our provider component. It will wrap our application.
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged is the core of our authentication listener.
    // It's a Firebase function that listens for any changes to the user's login state.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false); // We're done loading once we have the user status
    });

    // Cleanup function: It's important to unsubscribe from the listener
    // when the component is unmounted to prevent memory leaks.
    return () => unsubscribe();
  }, []); // The empty dependency array ensures this effect runs only once.

  const value = { user, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// This is a custom hook that makes it easy for other components
// to access the authentication state without having to import useContext and AuthContext every time.
export const useAuth = () => {
  return useContext(AuthContext);
};
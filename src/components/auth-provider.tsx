"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut 
} from "firebase/auth";
import { auth } from "@/lib/firebase";

// 1. The Interface (The Menu)
interface AuthContextType {
  user: User | null;
  loading: boolean; // ✅ We stick with 'loading' here
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// 2. The Default Context (The Appetizer)
// ✅ FIX: Changed isLoading to loading here to match the interface
const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  signInWithGoogle: async () => {},
  signOut: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  // ✅ FIX: Changed state name from isLoading to loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  // ✅ FIX: The value object now perfectly matches the interface
  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
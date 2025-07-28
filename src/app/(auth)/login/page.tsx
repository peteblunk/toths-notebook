"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider'; // Import our custom auth hook

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { user } = useAuth(); // Get the current user from our context

  // NEW: This useEffect hook will handle redirecting the user if they are already logged in.
  // This makes our navigation logic robust and centralized.
  useEffect(() => {
    if (user) {
      router.push('/'); // If a user is found, redirect to the main app page.
    }
  }, [user, router]);


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!displayName) {
        setError("Please enter a display name.");
        setIsLoading(false);
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: displayName });

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: displayName,
        createdAt: serverTimestamp(),
        photoURL: '',
      });

      // We no longer redirect here. The useEffect hook will handle it.

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // We no longer redirect here. The useEffect hook will handle it.

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100 font-body">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-lg border border-cyan-500/30">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-cyan-400 font-display tracking-wider">
            Thoth's Notebook
          </h1>
          <p className="text-gray-400">Enter the archives of wisdom</p>
        </div>

        <form className="space-y-6">
          <div>
            <label htmlFor="displayName" className="text-sm font-bold text-gray-400 block">
              Scribe's Name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Sesh of Thoth"
              className="w-full px-4 py-2 mt-2 text-gray-100 bg-gray-700 border border-gray-600 rounded-md focus:border-cyan-400 focus:ring-cyan-400 focus:outline-none focus:ring focus:ring-opacity-40"
            />
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-bold text-gray-400 block">
              Sacred Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="scribe@ancient-archives.com"
              className="w-full px-4 py-2 mt-2 text-gray-100 bg-gray-700 border border-gray-600 rounded-md focus:border-cyan-400 focus:ring-cyan-400 focus:outline-none focus:ring focus:ring-opacity-40"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-bold text-gray-400 block">
              Secret Glyphs (Password)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 mt-2 text-gray-100 bg-gray-700 border border-gray-600 rounded-md focus:border-cyan-400 focus:ring-cyan-400 focus:outline-none focus:ring focus:ring-opacity-40"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center bg-red-900/30 p-2 rounded-md">
              {error}
            </p>
          )}

          <div className="flex flex-col space-y-4">
             <button
              type="submit"
              onClick={handleSignUp}
              disabled={isLoading}
              className="w-full px-4 py-2 text-lg font-bold text-gray-900 bg-cyan-400 rounded-md hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-800 disabled:bg-gray-500"
            >
              {isLoading ? 'Creating Archive...' : 'Become a Scribe (Sign Up)'}
            </button>
             <button
              type="submit"
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full px-4 py-2 text-lg font-bold text-cyan-400 bg-transparent border border-cyan-400 rounded-md hover:bg-cyan-400/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-800 disabled:bg-gray-500"
            >
              {isLoading ? 'Accessing...' : 'Enter the Archive (Sign In)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

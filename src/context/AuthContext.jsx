import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null); // holds the Supabase session
  const [loading, setLoading] = useState(true); // only TRUE during bootstrap
  const [error, setError] = useState(null);
  const [isSigningOut, setIsSigningOut] = useState(false); // Add this new state


  const [chatSessionId, setChatSessionId] = useState(null);

  /* ─────────── bootstrap exactly once ─────────── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      // 1. Bootstrap whatever is in storage right now
      setSession(data.session ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // 2. Listen for every change *after* that
      setSession(newSession); // <‑‑ rely on session, not event string
    });

    return () => subscription.unsubscribe();
  }, []);
  /* ---------- derive chatSessionId from session ---------- */
  useEffect(() => {
    if (session) {
      setChatSessionId(crypto.randomUUID());
    } else {
      setChatSessionId(null);
    }
  }, [session?.user?.id]);

  /* ─────────── helper wrappers ─────────── */
  const signUp = async (email, password) => {
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    return error;
  };

  const signIn = async (email, password) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    return error;
  };

  // const signOut = () => supabase.auth.signOut();

  const signOut = async () => {
    setIsSigningOut(true); // Set state to true when signout starts
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      console.warn('Supabase signOut failed:', err.message);
    } finally {
      setUser(null); // clear auth context
      setSession(null);
      setIsSigningOut(false); // Reset state to false after signout
    }
  };

  console.log(chatSessionId);

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        loading,
        error,
        signUp,
        signIn,
        signOut,
        isSigningOut, 
        chatSessionId, //   ← expose it
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

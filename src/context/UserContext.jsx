import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { deepMerge } from '../utils/deepMerge';

const UserContext = createContext();
export const useUser = () => useContext(UserContext);

const STORAGE_KEY = (uid) => `counselProfile_${uid}`;

export function UserProvider({ children }) {
  const { user: authUser, loading: loadingAuth } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  /* 1️⃣ hydrate when auth user changes */
  useEffect(() => {
    if (loadingAuth || !authUser) {
      setLoadingProfile(false);
      return;
    }

    const fetchProfileData = async () => {
      setLoadingProfile(true);

      // A. Fetch profile from supabase
      const { data: dbRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      // B. Read local storage
      const localStr = localStorage.getItem(STORAGE_KEY(authUser.id));
      const local = localStr ? JSON.parse(localStr) : {}; // Avoid null

      // C. Merge the profile data
      const merged = deepMerge(dbRow?.data ?? {}, local);
      setProfile(merged);
      localStorage.setItem(STORAGE_KEY(authUser.id), JSON.stringify(merged));

      setLoadingProfile(false);
    };

    fetchProfileData();
  }, [authUser?.id, loadingAuth]);

  /* 2️⃣ helper every component uses */
  const patchProfile = (fn) =>
    setProfile((prev) => {
      const next = deepMerge(prev, fn(prev));
      next.dirty = true;
      next.updatedAt = Date.now();
      localStorage.setItem(STORAGE_KEY(authUser.id), JSON.stringify(next));
      return next;
    });

  /* 3️⃣ debounced cloud sync */
  useEffect(() => {
    if (!authUser || !profile?.dirty) return; // do nothing if no changes

    const id = setTimeout(async () => {
      const clean = { ...profile, dirty: false }; // clear flag before upload

      const { error } = await supabase.from('profiles').upsert({
        id: authUser.id,
        data: clean, // whole coaching blob goes here
        updated_at: new Date().toISOString(),
      });

      if (!error) {
        setProfile(clean); // remove dirty flag in state
        localStorage.setItem(STORAGE_KEY(authUser.id), JSON.stringify(clean)); // Sync localStore
      } else {
        console.error('[profile sync]', error.message);
      }
    }, 2000); //  2-second debounce

    return () => clearTimeout(id); //  reset timer if profile mutates again
  }, [profile, authUser]);

  const value = useMemo(
    () => ({ profile, setProfile, patchProfile, loadingProfile }),
    [profile, loadingProfile]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

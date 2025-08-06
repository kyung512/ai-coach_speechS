import { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { useUser } from './context/UserContext';
import { flushMessages } from './utils/messageBatch';
import AuthForm from './components/AuthForm';
import SignupForm from './components/SignupForm';

import Header from './components/Header';
import Chatbot from './components/Chatbot';

import DownloadTranscript from './components/DownloadTranscript';
import ShowGreet from './components/ui/ShowGreet';

const App = () => {
  const { user: authUser, loading: loadingAuth , isSigningOut  } = useAuth();
  const { profile, loadingProfile } = useUser();
  const [showGreet, setShowGreet] = useState(false);
  const prevLoggedIn = useRef(false);   // <–– remember last auth state (for banner)

  /* ---------- flush on tab close  (RUNS EVERY RENDER) -------- */
  useEffect(() => {
    window.addEventListener('beforeunload', flushMessages);
    return () => window.removeEventListener('beforeunload', flushMessages);
  }, []);
  /* ---------- derive “is profile filled in?” FIRST ---------- */
  const complete =
    !!profile &&
    typeof profile.name   === 'string' && profile.name.trim().length > 0 &&
    typeof profile.gender === 'string' && profile.gender.trim().length > 0 &&
    typeof profile.age    === 'number'  && profile.age > 0;
    
  // console.log('complete: showGreet', complete, showGreet);

  /* ---------- banner effect (runs every render) -------------- */
  useEffect(() => {
    const loggedIn =
      !loadingProfile && complete && Boolean(profile?.lastLogin);

    let timeoutId; 
    // user has just signed‑in (prev = false ➔ now = true)
    if (loggedIn && !prevLoggedIn.current && !isSigningOut) {
      setShowGreet(true);
      timeoutId = setTimeout(() => setShowGreet(false), 3_000);
    }

    prevLoggedIn.current = loggedIn;

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    }    
    
  }, [loadingProfile, complete, profile?.lastLogin]);

  /* ---------- early returns --------------------------------- */
  if (loadingAuth || loadingProfile) return <p>Loading…</p>;
  if (!authUser) return <AuthForm />;
  if (!complete) return <SignupForm />;

  console.log('profile: ', profile);

  return (
    <div className='dashboard px-6 py-4 max-w-4xl mx-auto'>
      {showGreet && <ShowGreet />}
      <Header />
      <Chatbot />
      {/* <DownloadTranscript /> */}
    </div>
  );
};

export default App;

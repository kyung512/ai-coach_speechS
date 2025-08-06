import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { flushMessages } from '../utils/messageBatch';

const Header = () => {
  const { user: authUser, signOut, chatSessionId } = useAuth();
  const { patchProfile } = useUser();

  const handleLogout = async () => {
    try {
      patchProfile((p) => ({ ...p, lastLogin: Date.now() })); // 1. mark the end-of-session time
      await flushMessages(); // make sure final rows are in DB
      await signOut(); // then run Supabase sing-out
    } catch (error) {
      console.warn('Sign-out failed or rejected:', error.message);
    } finally {
      window.location.href = '/'; // or navigate('/') if using router
    }
  };

  return (
    <header className='flex justify-between items-center bg-white p-4 rounded-xl shadow-lg'>
      <span className='text-lg text-gray-800'>{authUser.email}</span>
      <button
        onClick={handleLogout}
        className='text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all'
      >
        Log&nbsp;out
      </button>
    </header>
  );
};

export default Header;

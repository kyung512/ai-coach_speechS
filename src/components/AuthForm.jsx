import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthForm = () => {
  const { signUp, signIn, authError, loading } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'singup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // const handleChange = (e) => {
  //   setForm({ ...form, [e.target.name]: e.target.value });
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;          // simple guard
    
    if (mode === 'signin') {
      await signIn(email, password);
    } else {
      await signUp(email, password);
    }

  };

  return (
    <div className='w-full max-w-md mx-auto mt-20 p-8 bg-white shadow-xl rounded-xl'>
      <h2 className='text-2xl font-semibold mb-4 text-center'>
        {mode === 'signin' ? 'Sign In' : 'Create Account'}
      </h2>
      <form onClick={handleSubmit} className='space-y-6'>
        <input
          className='w-full p-4 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none'
          placeholder='Email'
          name='email'
          type='email'
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className='w-full p-4 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none'
          placeholder='Password'
          name='password'
          type='password'
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {/* {error && <p className='text-red-600 text-sm'>{error}</p>} */}
        <button
          type='submit'
          disabled={!email || !password}
          className='w-full py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400'
        >
          {mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>
        {authError && <p className='text-red-300'>{authError}</p>}
      </form>

      <button
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        className='mt-4 text-sm text-center text-blue-600 underline w-full'
      >
        {mode === 'signin'
          ? "Don't have an account? Sign Up"
          : 'Already registered? Sign In'}
      </button>
    </div>
  );
};

export default AuthForm;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';

export default function SignupForm() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth(); // need the UUID
  const { patchProfile } = useUser(); // update context
  const [form, setForm] = useState({ name: '', age: '', gender: '' });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Insert or upsert the profile row
    const { data, error: upsertErr } = await supabase
      .from('profiles')
      .upsert(
        {
          id: authUser.id,
          name: form.name,
          age: Number(form.age),
          gender: form.gender,
        },
        { onConflict: 'id' } // IMPORTANT
      )
      .select()
      .single();

    console.log('UPSERT →', { data, upsertErr }); //  add this line

    if (upsertErr) {
      setError('DB error: ' + upsertErr.message);
      return;
    }

    if (data) {
      patchProfile((p) => ({
        ...p,
        name: form.name,
        age: Number(form.age),
        gender: form.gender,
      }));
    }
    navigate('/');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='grid gap-4 max-w-sm mx-auto p-6 bg-white shadow-md rounded-md'
    >
      <input
        required
        name='name'
        placeholder='Name'
        value={form.name}
        onChange={handleChange}
        className='px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
      />

      <input
        required
        type='number'
        min='0'
        name='age'
        placeholder='Age'
        value={form.age}
        onChange={handleChange}
        className='px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
      />

      <input
        required
        name='gender'
        placeholder='Gender'
        value={form.gender}
        onChange={handleChange}
        className='px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
      />

      <button
        type='submit'
        className='bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors'
      >
        Save&nbsp;Profile
      </button>
      {error && <p className='text-red-500'>{error}</p>}
    </form>
  );
}

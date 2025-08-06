import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { pending, flushMessages } from '../utils/messageBatch';

const ChatForm = ({
  chatHistory,
  setChatHistory,
  generateBotResponse,
  patchProfile,
  pending,
}) => {
  const { user: authUser, chatSessionId } = useAuth();
  const [text, setText] = useState('');

  const handleFormSubmit = (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    /* 1️⃣ local chat UI */
    const userMsg = { role: 'user', text: trimmed, ts: Date.now() };

    // Update chat history immediately with the new user message
    const updatedChatHistory = [...chatHistory, userMsg];
    setChatHistory(updatedChatHistory);
    setText('');

    pending.push({
      user_id: authUser.id,
      session_id: chatSessionId,
      role: 'user',
      text: trimmed,
      ts: new Date().toISOString(),
    });
    if (pending.length >= 4) flushMessages();

    /* 2️⃣ persist in profile (max 100) */
    patchProfile((p) => {
      const safeHistory = p.history ?? [];
      return { ...p, history: [...safeHistory, userMsg].slice(-100) };
    });

    /* 3️⃣ ask the assistant */
    // generateBotResponse([...chatHistory, userMsg]);
    generateBotResponse(updatedChatHistory);
  };

  return (
    <form action='#' className='chat-form' onSubmit={handleFormSubmit}>
      <input
        value={text}
        type='text'
        placeholder='Message...'
        className='message-input'
        required
        onChange={(e) => setText(e.target.value)}
      />
      <button className='material-symbols-rounded'>arrow_upward</button>
    </form>

    // <form
    //   onSubmit={handleFormSubmit}
    //   className='relative flex w-full max-w-md mx-auto mt-4'
    // >
    //   {/* text field */}
    //   <input
    //     value={text}
    //     onChange={(e) => setText(e.target.value)}
    //     type='text'
    //     placeholder='Message…'
    //     required
    //     className='
    //     w-full pr-12                         /* leave room for the icon */
    //     rounded-full border border-indigo-300
    //     bg-white/70 backdrop-blur-sm
    //     px-4 py-2 text-sm outline-none
    //     shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200
    //     placeholder:text-gray-400
    //     disabled:opacity-50 disabled:cursor-not-allowed'
    //   />

    //   {/* send button, absolutely positioned inside the field */}
    //   <button
    //     type='submit'
    //     className='
    //       absolute right-2 top-1/2 -translate-y-1/2
    //       h-8 w-8 grid place-items-center
    //       rounded-full bg-indigo-500 text-white
    //       shadow hover:bg-indigo-600 active:scale-95
    //       focus:outline-none focus:ring-2 focus:ring-indigo-300
    //     '
    //   >
    //     <span className='material-symbols-rounded text-lg leading-none'>
    //       arrow_upward
    //     </span>
    //   </button>
    // </form>

  );
};

export default ChatForm;

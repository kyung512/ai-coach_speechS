import { useRef, useState, useEffect } from 'react';
import ChatbotIcon from './ChatbotIcon';
import ChatForm from './ChatForm';
import DownloadTranscript from './DownloadTranscript';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { pending, flushMessages } from '../utils/messageBatch';

import { processSummarizer } from '../Hooks/summarizer';
import useProfileUpdater from '../Hooks/useProfileUpdater'; // import the custom hook
// import { typeAndSpeakNext } from '../typeAndSpeakNext';
import { typeAndSpeakNext } from '../utils/typeAndSpeakNext';
import { useVoiceInput } from '../Hooks/useVoiceInput';
import { useWhisperVoiceInput } from '../Hooks/useWhisperVoiceInput';

const Chatbot = () => {
  const { profile, patchProfile } = useUser();
  const { user: authUser, chatSessionId } = useAuth();
  const { processAndUpdateProfile } = useProfileUpdater(); // use the custom hook

  const [adminPrompt, setAdminPrompt] = useState('');

  const getLatestMood = (moods) => moods?.at(-1)?.entry ?? 'none logged';

  const getActiveGoals = (goals) =>
    goals
      .filter((goal) => goal.status === 'active')
      .map(
        (goal) =>
          `• ${goal.goal} — ${goal.metric} ${goal.target} by ${
            goal.deadline || 'TBD'
          }`
      )
      .join('\n') || 'none';

  const buildUserProfileBlock = (profile, latestMood, activeGoals) =>
    `
    Name:    ${profile.name ?? 'Unknown'}
    Age:     ${profile.age ?? 'Unknown'}
    Gender:  ${profile.gender ?? 'Unknown'}
    Latest mood:  ${latestMood}
    Active goals:\n${activeGoals}
  `.trim();

  // Safe fallbacks for profile data
  const safeGoals = profile.goals ?? [];
  const safeMoods = profile.moodHistory ?? [];

  const chatBodyRef = useRef();
  const [chatHistory, setChatHistory] = useState(profile.history ?? []);

  const [botSentences, setBotSentences] = useState([]); // split bot response into sentences
  const [currentSentence, setCurrentSentence] = useState(0);
  const [typedSoFar, setTypedSoFar] = useState('');
  const [currentBotMessage, setCurrentBotMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTypingInput, setIsTypingInput] = useState(false);

  const latestMood = getLatestMood(safeMoods);
  const activeGoals = getActiveGoals(safeGoals);
  const userProfileBlock = buildUserProfileBlock(
    profile,
    latestMood,
    activeGoals
  );

  // Function to handle bot responses
  const generateBotResponse = async (history) => {
    const placeholderId = crypto.randomUUID();
    setChatHistory((prev) => [
      ...prev,
      { id: placeholderId, role: 'model', text: 'Thinking...' },
    ]);

    const updateHistory = (text) =>
      setChatHistory((prev) =>
        prev.map((msg) => (msg.id === placeholderId ? { ...msg, text } : msg))
      );

    try {
      const response = await fetchBotResponse(history);
      const answer = processBotResponse(response);

      // Update history and UI
      updateHistory(answer);
      flushPendingMessages(answer);

      // Update profile with new history
      patchProfileHistory(history, answer);
      // speakAndType(answer);
      startBotTyping(answer);

      // Get the fact from the new processSummarizer function
      const fact = await processSummarizer(history);

      // Use the custom hook to process and update the profile
      processAndUpdateProfile(history, fact);
    } catch (error) {
      updateHistory(error.message || 'Error contacting assistant', true);
      console.error('Error fetching bot response:', error);
    }
  };

  // API call to fetch bot response
  const fetchBotResponse = async (history) => {
    const systemInstructionText = getSystemInstructionText(userProfileBlock);
    const chatContents = history.map(({ role, text }) => ({
      role,
      parts: [{ text }],
    }));

    const payload = {
      systemInstruction: { parts: [{ text: systemInstructionText }] },
      contents: chatContents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 512,
      },
    };
    
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`LLM error ${res.status}`);
    return res.json();
  };

  // Function to generate the system instruction for the bot
  const getSystemInstructionText = (userProfileBlock) => {
    /* 1️⃣  User profile stays in every prompt */
    const profileSelection = `### USER PROFILE\n${userProfileBlock}`.trim();

    /* 2️⃣  Default counsellor behaviour */
    const defaultCounsellor = `
      ### COUNSELLOR BEHAVIOUR
      You are an empathetic but non‑diagnostic wellbeing counsellor.
      • Ask one concise question at a time.
      • Acknowledge the user's answer briefly, then follow up.
      • Discourage self‑harm and suggest professional help when appropriate.
      `.trim();

    /* 3️⃣  If adminPrompt exists, prepend it; otherwise use default only */
    const counsellorSection = adminPrompt.trim()
      ? `
      ### SPECIAL INSTRUCTION
      ${adminPrompt.trim()} 

          ${defaultCounsellor}`
      : defaultCounsellor;
    /* 4️⃣  Combine and return */
    return `${profileSelection} 
    
            ${counsellorSection}`;
  };

  // Process the bot response and extract answer
  const processBotResponse = (response) => {
    const { candidates } = response;
    if (!candidates?.length) throw new Error('Empty assistant response');

    let answer = candidates[0].content.parts[0].text.trim();
    const qIdx = answer.indexOf('?');
    if (qIdx !== -1) answer = answer.slice(0, qIdx + 1);

    return answer;
  };

  // Flush pending messages to the backend
  const flushPendingMessages = (answer) => {
    pending.push({
      user_id: authUser.id, // Supabase user UUID
      session_id: chatSessionId, // New
      role: 'model',
      text: answer,
      ts: new Date().toISOString(),
    });

    if (pending.length >= 4) flushMessages();

    // window.addEventListener('beforeunload', flushMessages);
  };

  // Update profile history with the latest chat
  const patchProfileHistory = (history, answer) => {
    const updatedHistory = [
      ...history,
      { role: 'model', text: answer, ts: Date.now() },
    ].slice(-100);

    patchProfile((p) => ({ ...p, history: updatedHistory }));
  };

  const startBotTyping = (botText) => {
    const sentences = botText.match(/[^.!?]+[.!?]*/g) || [botText]; // crude sentence splitter
    setBotSentences(sentences);
    setCurrentSentence(0);
    setTypedSoFar('');
    setCurrentBotMessage('');
    setIsTyping(true);

    typeAndSpeakNext({
      sentences,
      currentSentence: 0,
      setCurrentSentence,
      setCurrentBotMessage,
      setIsTyping,
      typedSoFar: '',
      setTypedSoFar,
    });
  };

  const { startVoiceInput } = useVoiceInput({
    chatHistory,
    setChatHistory,
    setUserInput,
    setIsListening,
    setIsTypingInput,
    generateBotResponse,
    pending,
    patchProfile,
    authUser,
    chatSessionId,
  });

  // const { startVoiceInput } =
  //   useWhisperVoiceInput({
  //     chatHistory,
  //     setChatHistory,
  //     setUserInput,
  //     setIsListening,
  //     setIsTypingInput,
  //     generateBotResponse,
  //     pending,
  //     patchProfile,
  //     authUser,
  //     chatSessionId,
  // });


  useEffect(() => {
    chatBodyRef.current?.scrollTo({
      top: chatBodyRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [chatHistory, currentBotMessage, isTyping, userInput, isTypingInput]);

  return (
    <div className='flex gap-6'>
      <div className='flex-1 relative bg-white p-6 rounded-xl shadow-lg max-w-4xl mx-auto'>
        <div className='flex items-center space-x-4 text-gray-50'>
          <ChatbotIcon />
          <h2 className='text-2xl font-semibold text-gray-700'>AI Assistant</h2>
        </div>

        <div
          ref={chatBodyRef}
          className='space-y-4 mt-6 max-h-96 overflow-y-auto'
        >
          <div className='flex items-start space-x-2'>
            <ChatbotIcon />
            <p className='bg-gray-100 text-gray-700 p-4 rounded-xl'>
              Hi {profile.name}, How can I help you today?
            </p>
          </div>
          {/* Render chat history and typing effect in a single pass */}
          {chatHistory.map((chat, index) => (
            <div
              key={index}
              className={`flex ${
                chat.role === 'model' ? 'space-x-2' : 'space-x-reverse'
              }`}
            >
              {chat.role === 'model' && <ChatbotIcon />}
              <p
                className={`${
                  chat.role === 'model'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-purple-100 text-purple-600'
                } p-4 rounded-xl`}
              >
                {/* If the message is the last bot message and is being typed, show the current typing */}

                {chat.role === 'model' &&
                isTyping &&
                index === chatHistory.length - 1
                  ? currentBotMessage
                  : chat.role === 'user' &&
                    isTypingInput &&
                    index === chatHistory.length - 1
                  ? userInput
                  : chat.text}
              </p>
            </div>
          ))}
        </div>

        <div className='chat-footer mt-10'>
          <ChatForm
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            generateBotResponse={generateBotResponse}
            patchProfile={patchProfile}
            pending={pending}
          />

          <div className='flex gap-2 items-center'>
            <button
              onClick={startVoiceInput}
              className={`px-4 py-2 rounded-xl text-gray-700 mt-6 transition-all duration-200
                      ${
                        isListening
                          ? 'bg-blue-200 scale-110 animate-pulse'
                          : 'bg-purple-100'
                      }`}
            >
              🎤 {isListening ? 'Listening' : 'Speak'}
            </button>
            {/* <button className='px-4 py-2 rounded-xl  text-gray-700 mt-6 bg-purple-100 hover:bg-gray-100'>
              🛑 Stop
            </button> */}
          </div>

          <DownloadTranscript
            chatSessionId={chatSessionId}
            chatHistory={chatHistory}
          />
        </div>
      </div>

      {/* ───────────────────────── Admin‑prompt panel ───────────────────────── */}

      <div className='w-1/2 flex flex-col bg-zinc-900 border-l border-zinc-800 p-4'>
        <div className='flex items-center justify-between mb-2'>
          <h2 className='text-sm font-medium uppercase tracking-wide text-zinc-200'>
            Admin prompt (dev only)
          </h2>

          {adminPrompt.trim() && (
            <span className='text-xs rounded-full bg-emerald-600/20 px-2 py-0.5 text-emerald-400'>
              active
            </span>
          )}
        </div>

        <textarea
          rows={12} /* give it some height */
          className='flex-1 resize-none rounded-lg bg-zinc-800 p-3
                    text-sm text-zinc-200 placeholder:text-zinc-500
                    focus:outline-none focus:ring-2 focus:ring-emerald-500'
          placeholder='Paste or type extra system instructions…'
          value={adminPrompt}
          onChange={(e) => setAdminPrompt(e.target.value)}
        />

        {adminPrompt.trim() && (
          <button
            onClick={() => setAdminPrompt('')}
            className='mt-3 self-end text-xs font-medium text-zinc-400
            transition-colors hover:text-zinc-200'
          >
            clear
          </button>
        )}
      </div>
    </div>
  );
};

export default Chatbot;

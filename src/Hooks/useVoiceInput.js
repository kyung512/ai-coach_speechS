// useVoiceInput.js
import { useRef } from 'react';

export const useVoiceInput = ({
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
}) => {
  const placeholderIndexRef = useRef(null);

  const startVoiceInput = () => {
    if (
      !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
    ) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    let silenceTimeout;
    let finalTranscript = '';

    recognition.onstart = () => {
      setIsListening(true);           // mic is on 
      setUserInput('');
      setIsTypingInput(true);         // start to type the user's narration

      setChatHistory((prev) => {
        const updated = [...prev, { role: 'user', text: '' }];
        placeholderIndexRef.current = updated.length - 1;       // increases 0, 2, 4, ... for user's spot
        return updated;
      });
    };

    recognition.onresult = (event) => {
      clearTimeout(silenceTimeout);

      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const combined = finalTranscript + interimTranscript;
      setUserInput(combined);

      silenceTimeout = setTimeout(() => recognition.stop(), 1500);
    };

    recognition.onerror = (event) => {
      clearTimeout(silenceTimeout);
      setIsListening(false);
      setIsTypingInput(false);
      recognition.stop();
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      clearTimeout(silenceTimeout);
      setIsListening(false);              //  mic is off
      setIsTypingInput(false);            //  stopped typing user's voice input
      recognition.stop();

      const final = finalTranscript.trim();
      if (!final || placeholderIndexRef.current === null) return;

      const userMsg = { role: 'user', text: final, ts: Date.now() };

      const updated = [...chatHistory];
      updated[placeholderIndexRef.current] = userMsg;
      placeholderIndexRef.current = null;

      setUserInput('');
      setChatHistory(updated);

      pending.push({                //   update pending, the pending might be empty
        user_id: authUser.id,
        session_id: chatSessionId,
        role: 'user',
        text: final,
        ts: new Date().toISOString(),
      });
      if (pending.length >= 4) flushMessages();

      patchProfile((p) => {
        const safeHistory = p.history ?? [];
        return { ...p, history: [...safeHistory, userMsg].slice(-100) };
      });

      generateBotResponse(updated);
    };

    recognition.start();
  };

  return { startVoiceInput };
};

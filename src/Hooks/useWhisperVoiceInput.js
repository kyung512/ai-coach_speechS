import { useRef, useState } from 'react';
import { transcribeWithWhisperCpp } from '../api/transcribeWithWhisperCpp';

export const useWhisperVoiceInput = ({
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
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const placeholderIndexRef = useRef(null);
  const audioContextRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const audioChunksRef = useRef([]);
  const batchTimerRef = useRef(null);

  const [finalTranscript, setFinalTranscript] = useState('');

  const stopRecording = () => {
    console.log('🛑 stopRecording called');
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (batchTimerRef.current) {
      clearInterval(batchTimerRef.current);
    }
  };

  const resetSilenceTimer = () => {
    console.log('⏱ Resetting silence timer...');
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      console.log('🛑 Silence detected — stopping recorder');
      stopRecording();
    }, 1000); // Stop after 2s of silence
  };

  const startVoiceInput = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = 'audio/webm;codecs=opus';

    if (!MediaRecorder.isTypeSupported(mimeType)) {
      alert('audio/webm not supported in this browser');
      return;
    }

    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;
    recordedChunksRef.current = [];
    audioChunksRef.current = [];
    setFinalTranscript('');
    setUserInput('');

    // Chat placeholder
    setChatHistory((prev) => {
      const updated = [...prev, { role: 'user', text: '' }];
      placeholderIndexRef.current = updated.length - 1;
      return updated;
    });

    // Silence detection via analyser
    audioContextRef.current = new AudioContext();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    const analyser = audioContextRef.current.createAnalyser();
    source.connect(analyser);

    const data = new Uint8Array(analyser.fftSize);
    const detectSilence = () => {
      analyser.getByteTimeDomainData(data);
      const avg = data.reduce((a, b) => a + Math.abs(b - 128), 0) / data.length;
      if (avg > 5) resetSilenceTimer();
      requestAnimationFrame(detectSilence);
    };
    detectSilence();

    setIsListening(true);
    setIsTypingInput(true);

    // Handle audio chunks
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
        audioChunksRef.current.push(e.data);
        console.log('🎙 Got chunk:', e.data.size);
      }
    };

    // Transcribe every 3s
    // batchTimerRef.current = setInterval(async () => {
    //   if (audioChunksRef.current.length === 0) return;

    //   const blob = new Blob(audioChunksRef.current, { type: mimeType });
    //   audioChunksRef.current = [];

    //   try {
    //     const transcript = await transcribeWithWhisperCpp(blob);
    //     if (transcript) {
    //       setFinalTranscript((prev) => {
    //         const updated = prev + transcript;
    //         setUserInput(updated); // 👈 Sync to UI
    //         return updated;
    //       });
    //     }
    //   } catch (err) {
    //     console.error('🛑 Batch transcription failed:', err);
    //   }
    // }, 3000);

    mediaRecorder.onstop = async () => {
      console.log('✅ recorder.onstop triggered');
      setIsListening(false);
      setIsTypingInput(false);

      const finalBlob = new Blob(recordedChunksRef.current, { type: mimeType });
      console.log('📦 Final blob size:', finalBlob.size);

      try {
        const transcript = await transcribeWithWhisperCpp(finalBlob);
        console.log('📝 Final transcript:', transcript);

        const final = transcript.trim();
        setFinalTranscript(final);
        setUserInput('');

        if (!final || placeholderIndexRef.current === null) return;

        const userMsg = { role: 'user', text: final, ts: Date.now() };
        const updated = [...chatHistory];
        updated[placeholderIndexRef.current] = userMsg;
        placeholderIndexRef.current = null;

        setChatHistory(updated);

        pending.push({
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
      } catch (err) {
        console.error('❌ Final transcription failed:', err);
      }
    };

    // mediaRecorder.start(1000); // 1s chunks
    mediaRecorder.start(); // 👈 just start recording, don't chunk

    console.log('🎤 Recorder started');
    resetSilenceTimer();
  };

  return { startVoiceInput };
};

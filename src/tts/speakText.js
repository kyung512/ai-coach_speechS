// Accessing environment variables from Vite's import.meta.env
// const VITE_ELEVENLABS_PROXY_ENDPOINT = import.meta.env.VITE_ELEVENLABS_PROXY_ENDPOINT; // New proxy endpoint
// const VITE_GCLOUD_PROXY_ENDPOINT = import.meta.env.VITE_GCLOUD_PROXY_ENDPOINT; // Updated name


export const speakText = async (text) => {
  const engine = import.meta.env.VITE_TTS_ENGINE || 'local';
  // const engine = 'elevenlabs';
  // const engine = 'gcloud';
  // const engine = 'local';

  const SHORT_SENTENCE_THRESHOLD = 4; // words
  const QUICK_DURATION = 800; // ms

  const wordCount = text.trim().split(/\s+/).length;
  const skipSync = wordCount <= SHORT_SENTENCE_THRESHOLD;

  const startAudio = (audioUrl) => {
    return new Promise((resolve) => {
      const audio = new Audio(audioUrl);

      if (skipSync) {
        audio.play();
        resolve(QUICK_DURATION); // just a small duration
        return;
      }

      audio.onloadedmetadata = () => {
        const duration = audio.duration * 1000; // ms
        audio.play();
        resolve(duration);
      };

      audio.onerror = () => {
        audio.play();
        resolve(2000); // fallback duration
      };
    });
  };

  if (engine === 'local') {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
    return text.length * 70; // fallback estimate (ms)
  }
  if (engine === 'elevenlabs') {
    // Now calling your own server proxy, which will handle the Eleven Labs API key securely
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/elevenlabs-tts-proxy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          // You can also pass voiceId or other settings if you want the frontend to control them
          // voiceId: 'some_other_voice_id',
        }),
      }
    );

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    return startAudio(audioUrl);
  }

  if (engine === 'gcloud') {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/gcloud-tts-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    return startAudio(audioUrl);
  }

  return text.length * 70; // fallback
};

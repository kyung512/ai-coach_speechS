export const transcribeWithWhisperCpp = async (blob) => {
  const formData = new FormData();
  formData.append('audio', blob, 'voice.webm');

  try {
    const res = await fetch('http://localhost:3001/api/whisper-cpp', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error('Whisper.cpp transcription failed');

    const data = await res.json();
    return data.transcript;
  } catch (err) {
    console.error('🛑 Whisper.cpp error:', err);
    return '';
  }
};

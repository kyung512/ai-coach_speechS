// transcribeAudioChunk.js
export const transcribeAudioChunk = async (blob) => {
  const file = new File([blob], 'audio.webm', { type: 'audio/webm' });
  // console.log('📦📦 Final blob size:', blob.size);

  const formData = new FormData();
  formData.append('file', file);           // 👈 Correct File instance with type
  // formData.append('file', blob, 'audio.webm');  // ✅ Pass blob + filename
  formData.append('model', 'whisper-1');

  
  // 🔍 Debug: list all entries
  // for (let pair of formData.entries()) {
  //   console.log(`${pair[0]}:`, pair[1]);
  // }

  //   console.log('🧪 FormData file type:', file.type);
  // console.log('🧪 FormData file name:', file.name);

  try {
    const res = await fetch('http://localhost:3001/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      // Handle HTTP errors (e.g., 400, 500)
      const errorData = await res.json();
      console.error('API Error:', errorData);
      throw new Error(
        `Server responded with status ${res.status}: ${
          errorData.message || 'Unknown error'
        }`
      );
    }

    const data = await res.json();
    return data.text || '';
  } catch (error) {
    console.error('Error transcribing audio chunk:', error);
    // You might want to return an empty string, null, or re-throw
    // depending on how you want the calling hook to handle it.
    return '';
  }
};

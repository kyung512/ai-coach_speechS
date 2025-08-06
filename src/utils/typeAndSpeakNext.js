import { speakText } from '../tts/speakText';
import { stripMarkdown } from './stripMarkdown';

export const typeAndSpeakNext = async ({
  sentences,
  currentSentence,
  setCurrentSentence,
  setCurrentBotMessage,
  setIsTyping,
  typedSoFar,
  setTypedSoFar
}) => {
  if (currentSentence >= sentences.length) {
    setIsTyping(false);
    return;
  }

  const sentence = sentences[currentSentence].trim();
  if (!sentence || typeof sentence !== 'string') {
    setCurrentSentence((prev) => prev + 1);
    typeAndSpeakNext({
      sentences,
      currentSentence: currentSentence + 1,
      setCurrentSentence,
      setCurrentBotMessage,
      setIsTyping,
      typedSoFar,
      setTypedSoFar
    });
    return;
  }

  const cleanSentence = stripMarkdown(sentence);

  // 🔊 Get actual or estimated audio duration
  const speechDuration = await speakText(cleanSentence); // in ms
  const typingIntervalMs = Math.max(speechDuration / sentence.length, 20); // minimum delay for fast speakers

  // 📝 Start typing
  let i = 0;
  let typedSentence = '';

  const typingInterval = setInterval(() => {
    if (i < sentence.length) {
      typedSentence += sentence[i];
      setCurrentBotMessage(typedSoFar + typedSentence);
      i++;
    } else {
      clearInterval(typingInterval);
      const updatedTyped = typedSoFar + typedSentence + ' ';
      setTypedSoFar(updatedTyped);
      setCurrentSentence((prev) => prev + 1);

      setTimeout(() => {
        typeAndSpeakNext({
          sentences,
          currentSentence: currentSentence + 1,
          setCurrentSentence,
          setCurrentBotMessage,
          setIsTyping,
          typedSoFar: updatedTyped,
          setTypedSoFar
        });
      }, 400);
    }
  }, typingIntervalMs);
};

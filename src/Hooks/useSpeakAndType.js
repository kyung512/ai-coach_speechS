import { speakText } from '../tts/speakText';
import { stripMarkdown } from '../utils/stripMarkdown';

export const useSpeakAndType = ({ setIsTyping, setCurrentBotMessage }) => {
  return (message) => {
    const sentences = message.match(/[^.!?]+[.!?]*/g) || [message];
    let currentSentence = 0;
    let typedSoFar = '';

    setCurrentBotMessage('');
    setIsTyping(true);

    const typeAndSpeakNext = () => {
      if (currentSentence >= sentences.length) {
        setIsTyping(false);
        return;
      }

      const sentence = sentences[currentSentence].trim();
      if (!sentence || typeof sentence !== 'string') {
        currentSentence++;
        typeAndSpeakNext();
        return;
      }

      const cleanSentence = stripMarkdown(sentence);
      speakText(cleanSentence); // no await — for true sync typing

      // Start typing in parallel
      let i = 0;
      let typedSentence = '';

      const typingInterval = setInterval(() => {
        if (i < sentence.length) {
          typedSentence += sentence[i];
          setCurrentBotMessage(typedSoFar + typedSentence);
          i++;
        } else {
          clearInterval(typingInterval);
          typedSoFar += typedSentence + ' ';
          currentSentence++;

          setTimeout(() => {
            typeAndSpeakNext();
          }, 400);
        }
      }, 70);
    };

    typeAndSpeakNext();
  };
};

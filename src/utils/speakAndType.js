export function speakAndType({
  message,
  setCurrentBotMessage,
  setIsTyping,
  speak = true,
}) {
  const stripMarkdown = (text) => text.replace(/\*\*/g, '').replace(/\*/g, ''); // Utility to remove Markdown formatting from spoken text

  setCurrentBotMessage('');
  setIsTyping(true);

  const sentences = message.match(/[^.!?]+[.!?]*/g) || [message];
  let currentSentence = 0;
  let typedSoFar = ''; // holds everything typed so far

  const typeAndSpeakNext = () => {
    if (currentSentence >= sentences.length) {
      setIsTyping(false);
      return;
    }

    const sentence = sentences[currentSentence].trim();
    if (!sentence || typeof sentence !== 'string') {
      // recursive calling
      currentSentence++;
      typeAndSpeakNext();
      return;
    }

    // Optional speech
    if (speak) {
      const utterance = new SpeechSynthesisUtterance(stripMarkdown(sentence));
      speechSynthesis.cancel();
      setTimeout(() => {
        speechSynthesis.speak(utterance);
      }, 100); // give it 100ms to initialize
    }

    // Typing effect
    let i = 0;
    let typedSentence = '';
    const interval = setInterval(() => {
      if (i < sentence.length) {
        typedSentence += sentence[i];
        setCurrentBotMessage(typedSoFar + typedSentence);
        i++;
      } else {
        clearInterval(interval);
        typedSoFar += typedSentence + ' ';
        currentSentence++;
        setTimeout(() => typeAndSpeakNext(), 300); // pause between sentences
      }
    }, 30);
  };

  typeAndSpeakNext();
}

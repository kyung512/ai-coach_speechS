import { useState, useEffect } from 'react';

// Custom hook to simulate typing effect
const useTypingEffect = (message, typingSpeed = 100) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!message) return;

    let index = 0;
    setCurrentMessage('');
    setIsTyping(true);

    const typingInterval = setInterval(() => {
      setCurrentMessage((prev) => prev + message[index]);
      index += 1;

      if (index === message.length) {
        clearInterval(typingInterval);
        setIsTyping(false); // Stop typing once the message is fully typed
      }
    }, typingSpeed);

    return () => clearInterval(typingInterval); // Cleanup interval when the component unmounts or message changes
  }, [message, typingSpeed]);

  return { currentMessage, isTyping };
};

export default useTypingEffect;

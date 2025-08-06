import { useEffect } from 'react';
import ChatbotIcon from './ChatbotIcon';
import { useUser } from '../context/UserContext';

const ChatMessage = ({ chat }) => {
  const { setUser } = useUser();

  // when a new bot message mounts, check for SMART Goal tag
  // useEffect(() => {
  //   if (chat.role !== 'model') return;
  //   // const m = chat.text.match(/\*\*SMART Goal:\*\*\s*(.+)/i);
  //   // const m = chat.text.match(/\*\*?\s*SMART\s+Goal\s*:?\s*\*?\*\s*(.+)/i);
  //   // const m = chat.text.match(/[*_~]*\s*SMART\s+Goal\s*:\s*[*_~]*\s*(.+)/i);
  //   const m = chat.text.match(/^SMART Goal:\s*(.+)$/i);

  //   if (!m) return;

  //   console.log('SMART goal detected:', m[1]);   // <— SEE THIS IN CONSOLE

  //   const goalText = m[1].trim();
  //   const id = Date.now();

  //   setUser((u) => ({
  //     ...u,
  //     goals: [...(u.goals || []),{ id, text: goalText, created: id, status: 'active' },],
  //   }));
  // }, [chat, setUser]);

  // const quickLog = () => {
  //   if (!points) return;
  //   setUser((u) => {
  //     const p = points;
  //     let dayLeft = u.dailyPointsLeft - p;
  //     let week = u.weeklyPoints;
  //     if (dayLeft < 0) {
  //       week += dayLeft;
  //       dayLeft = 0;
  //     }
  //     return { ...u, dailyPointsLeft: dayLeft, weeklyPoints: week };
  //   });
  // };

  // const match = chat.role === 'model' && chat.text.match(/(\d+)\s*Points?\b/i);
  // const points = match ? parseInt(match[1], 10) : null;
  return (
    !chat.hideInChat && (
      <div
        className={`message ${
          chat.role === 'model' ? 'bot' : 'user'
        }-message }`}
      >
        {chat.role === 'model' && <ChatbotIcon />}{' '}
        <p className='message-text'>{chat.text}</p>
      </div>
    )
  );
};

export default ChatMessage;

import { saveAs } from 'file-saver';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { flushMessages } from '../utils/messageBatch';

export default function DownloadTranscript({ chatSessionId, chatHistory }) {
  const { user: authUser } = useAuth();

  const handleDownload = async () => {
    console.log('inside handleDownload');
    console.log(chatSessionId);

    // 1. flush any unsent rows first
    await flushMessages();

    // 2. fetch everything for *this* session
    const { data, error } = await supabase
      .from('messages')
      .select('role, text, ts')
      .eq('user_id', authUser.id)
      .eq('session_id', chatSessionId)
      .order('ts')
    
    if (error) return alert('Download failed ' + error.message);
    console.log('selected rows', data);

    // 3. build Markdown
    const md = data
      .map(r => `**${r.role.toUpperCase()}**  ${new Date(r.ts).toLocaleString()}\n${r.text}`)
      .join('\n\n---\n\n');

    // 4. trigger file download
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, `chat-${chatSessionId}.md`);

  };

  return (
    <button
      onClick={handleDownload}
      className='mt-7 ml-30 text-lg text-blue-600 hover:underline'
    >
      Save&nbsp;conversation
    </button>
  );
}

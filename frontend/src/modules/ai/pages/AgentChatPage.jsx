import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAI } from '../../../hooks/useAI';
import { useProject } from '../../../hooks/useProject';
import ChatMessage from '../components/ChatMessage';
import VoiceRecorderButton from '../components/VoiceRecorderButton';
import ImageUploadButton from '../components/ImageUploadButton';

export default function AgentChatPage() {
  const { projectId } = useParams();
  const { currentProject, selectProject } = useProject();
  
  // Added addAssistantTurn
  const { messages, loading, sending, error, fetchConversation, sendMessage, clearChat, addAssistantTurn } = useAI();
  
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    selectProject(projectId);
    fetchConversation(projectId);
  }, [projectId, selectProject, fetchConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    await sendMessage(projectId, text);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex flex-col flex-1">
        <Link to={`/projects/${projectId}`} className="text-sm text-primary font-medium mb-4">
          &larr; Back to project
        </Link>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">🤖 Agent — {currentProject?.name}</h1>
            <p className="text-sm text-gray-500">Ask questions or give commands in plain language</p>
          </div>
          <button onClick={() => clearChat(projectId)} className="text-xs text-gray-400 hover:text-red-500">
            Clear chat
          </button>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-y-auto mb-3 min-h-[400px] max-h-[60vh]">
          {loading && <p className="text-xs text-gray-400">Loading conversation...</p>}
          {!loading && messages.length === 0 && (
            <p className="text-sm text-gray-400 text-center mt-10">
              Try: "Create a task called Fix login bug and assign to Aftab"
            </p>
          )}
          {messages.map((m, i) => (
            // Updated ChatMessage to include sources
            <ChatMessage key={i} role={m.role} text={m.text} sources={m.sources} />
          ))}
          {sending && <p className="text-xs text-gray-400">Thinking...</p>}
          <div ref={bottomRef} />
        </div>

        {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

        <form onSubmit={handleSend} className="flex gap-2">
          {/* Added Voice and Image Upload Buttons */}
          <VoiceRecorderButton  
            projectId={projectId}  
            onResult={(data) => addAssistantTurn(data.transcript, data.result)}
          />
          <ImageUploadButton  
            projectId={projectId}  
            onExtracted={(text) => setInput(text)}
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a command or question..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="bg-primary hover:bg-primary-dark text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

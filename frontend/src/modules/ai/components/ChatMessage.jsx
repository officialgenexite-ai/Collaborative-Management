export default function ChatMessage({ role, text }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
          isUser ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'
        }`}
      >
        {text}
      </div>
    </div>
  );
}

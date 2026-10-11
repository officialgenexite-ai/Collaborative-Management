import { useState } from 'react';

export default function CommentComposer({ onSubmit, placeholder, small, autoFocus }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`flex-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
          small ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'
        }`}
      />
      <button
        type="submit"
        disabled={submitting || !text.trim()}
        className={`bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold disabled:opacity-50 ${
          small ? 'px-2 text-xs' : 'px-4 text-sm'
        }`}
      >
        Send
      </button>
    </form>
  );
}

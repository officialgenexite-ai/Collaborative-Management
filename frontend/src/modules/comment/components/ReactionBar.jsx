import { useState, useRef, useEffect } from 'react';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉'];

export default function ReactionBar({ reactions, currentUserId, onToggle }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const containerRef = useRef(null);

  // Click-based toggle: popover gap/hover loose hone ka issue solve karta hai
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const grouped = (reactions || []).reduce((acc, r) => {
    acc[r.emoji] = acc[r.emoji] || [];
    acc[r.emoji].push(r.userId);
    return acc;
  }, {});

  const handlePick = (emoji) => {
    onToggle(emoji);
    setPickerOpen(false);
  };

  return (
    <div className="flex items-center gap-1" ref={containerRef}>
      {Object.entries(grouped).map(([emoji, userIds]) => {
        const mine = userIds.some((id) => (id._id || id) === currentUserId);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onToggle(emoji)}
            className={`text-xs px-1.5 py-0.5 rounded-full border ${
              mine ? 'bg-primary/10 border-primary text-primary' : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}
          >
            {emoji} {userIds.length}
          </button>
        );
      })}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen((p) => !p)}
          className="text-xs text-gray-400 hover:text-gray-600 px-1"
        >
          +
        </button>
        
        {pickerOpen && (
          <div className="flex absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-md p-1 gap-1 z-10">
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => handlePick(e)}
                className="text-sm hover:scale-125 transition"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

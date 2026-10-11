import { useState, useRef, useEffect } from 'react';
import { useNav } from '../../../hooks/useNav';

export default function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, setActiveWorkspace } = useNav();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-900 px-2 py-1.5 rounded-lg hover:bg-gray-100"
      >
        {activeWorkspace?.name || 'Select workspace'} <span className="text-gray-400 text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 mt-1 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
          {workspaces.map((w) => (
            <button
              key={w._id}
              onClick={() => {
                setActiveWorkspace(w._id);
                setOpen(false);
              }}
              className={`w-full text-left text-sm px-3 py-2 hover:bg-gray-50 ${
                w._id === activeWorkspace?._id ? 'text-primary font-medium' : 'text-gray-700'
              }`}
            >
              {w.name}
            </button>
          ))}
          {workspaces.length === 0 && <p className="text-xs text-gray-400 px-3 py-2">No workspaces yet</p>}
        </div>
      )}
    </div>
  );
}

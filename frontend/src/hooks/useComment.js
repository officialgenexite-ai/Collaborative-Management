import { useContext } from 'react';
import { CommentContext } from '../context/CommentContext';

export function useComment() {
  const context = useContext(CommentContext);
  if (!context) {
    throw new Error('useComment must be used within a CommentProvider');
  }
  return context;
}

import { useContext } from 'react';
import { AttachmentContext } from '../context/AttachmentContext';

export function useAttachment() {
  const context = useContext(AttachmentContext);
  if (!context) {
    throw new Error('useAttachment must be used within an AttachmentProvider');
  }
  return context;
}

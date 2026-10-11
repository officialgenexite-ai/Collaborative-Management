import { useContext } from 'react';
import { TimeTrackingContext } from '../context/TimeTrackingContext';

export function useTimeTracking() {
  const context = useContext(TimeTrackingContext);
  if (!context) {
    throw new Error('useTimeTracking must be used within a TimeTrackingProvider');
  }
  return context;
}

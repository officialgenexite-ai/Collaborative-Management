import { useContext } from 'react';
import { NavContext } from '../context/Navcontext';

export function useNav() {
  const context = useContext(NavContext);
  if (!context) {
    throw new Error('useNav must be used within a NavProvider');
  }
  return context;
}

export default useNav;
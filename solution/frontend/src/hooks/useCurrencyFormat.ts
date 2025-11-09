/**
 * Hook for managing currency format state
 */

import { useState, useEffect } from 'react';

export const useCurrencyFormat = () => {
  const [showFull, setShowFull] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('currency-show-full');
    const isFull = savedState === 'true';
    setShowFull(isFull);
  }, []);

  const toggleFormat = () => {
    const newState = !showFull;
    setShowFull(newState);
    localStorage.setItem('currency-show-full', newState.toString());
  };

  return {
    showFull,
    toggleFormat,
  };
};

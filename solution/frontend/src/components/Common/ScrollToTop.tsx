/**
 * ScrollToTop component and utility
 * Automatically scrolls to top when route changes
 * Also exports utility function for use in other components
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls the scrollable container to top
 * Finds the scrollable container in AppLayout and scrolls it to top
 */
export const scrollToTop = (): void => {
  // Small delay to ensure DOM is updated
  setTimeout(() => {
    // Find the scrollable container in AppLayout using data attribute
    const scrollableContainer = document.querySelector('[data-scrollable-container="true"]') as HTMLElement;
    
    if (scrollableContainer) {
      // Scroll the container to top
      scrollableContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Fallback: try to scroll window if no container found
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, 100);
};

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    scrollToTop();
  }, [pathname]);

  return null;
};

export default ScrollToTop;


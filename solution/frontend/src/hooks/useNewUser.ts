import { useState, useEffect } from 'react';

interface NewUserState {
  isNewUser: boolean;
  hasSeenGuide: boolean;
  markGuideAsSeen: () => void;
}

export const useNewUser = (guideKey: string): NewUserState => {
  const [isNewUser, setIsNewUser] = useState(false);
  const [hasSeenGuide, setHasSeenGuide] = useState(false);

  useEffect(() => {
    // Check if user is new (first time visiting this page)
    const isFirstVisit = !localStorage.getItem(`visited_${guideKey}`);
    const hasSeenThisGuide = localStorage.getItem(`seen_guide_${guideKey}`) === 'true';
    
    setIsNewUser(isFirstVisit);
    setHasSeenGuide(hasSeenThisGuide);

    // Mark page as visited
    if (isFirstVisit) {
      localStorage.setItem(`visited_${guideKey}`, 'true');
    }
  }, [guideKey]);

  const markGuideAsSeen = () => {
    localStorage.setItem(`seen_guide_${guideKey}`, 'true');
    setHasSeenGuide(true);
  };

  return {
    isNewUser,
    hasSeenGuide,
    markGuideAsSeen
  };
};

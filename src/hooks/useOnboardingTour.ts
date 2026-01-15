import { useState, useEffect, useCallback } from 'react';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: string;
}

const TOUR_STORAGE_KEY = 'onboarding_tour_completed';

export const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to The Football Scout! ⚽',
    description: 'Let\'s take a quick tour to help you get started with your scouting journey. This will only take a minute!',
    position: 'center',
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    description: 'This is your command center. View your stats, recent players, and reports at a glance. Click on any stat card to navigate to that section.',
    targetSelector: '[data-tour="stats-grid"]',
    position: 'bottom',
  },
  {
    id: 'add-player',
    title: 'Add Players',
    description: 'Start building your database by adding players you\'re scouting. Track their details, performance, and potential.',
    targetSelector: '[data-tour="add-player"]',
    position: 'bottom',
  },
  {
    id: 'create-report',
    title: 'Create Scouting Reports',
    description: 'Document your observations with detailed scouting reports. Rate players on technical, tactical, physical, and mental attributes.',
    targetSelector: '[data-tour="new-report"]',
    position: 'bottom',
  },
  {
    id: 'navigation',
    title: 'Navigate the App',
    description: 'Use the sidebar (or bottom nav on mobile) to access Players, Reports, Watchlists, and more. Your subscription tier unlocks additional features.',
    targetSelector: '[data-tour="navigation"]',
    position: 'right',
  },
  {
    id: 'subscription',
    title: 'Your Subscription',
    description: 'Track your usage and upgrade your plan for unlimited players, reports, team collaboration, and advanced analytics.',
    targetSelector: '[data-tour="subscription"]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    description: 'Start adding players and creating reports to build your scouting database. You can restart this tour anytime from Settings.',
    position: 'center',
  },
];

export function useOnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(true);

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      setHasCompleted(false);
      // Auto-start tour for new users after a brief delay
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    completeTour();
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsOpen(false);
    setHasCompleted(true);
    setCurrentStep(0);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setHasCompleted(false);
  }, []);

  return {
    isOpen,
    currentStep,
    totalSteps: tourSteps.length,
    currentTourStep: tourSteps[currentStep],
    hasCompleted,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    resetTour,
  };
}

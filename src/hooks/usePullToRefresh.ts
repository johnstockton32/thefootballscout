import { useState, useCallback, useRef, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
}: UsePullToRefreshOptions) {
  const isMobile = useIsMobile();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only activate if at top of scroll
    if (window.scrollY > 0) return;
    
    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = (currentY.current - startY.current) / resistance;
    
    if (diff > 0) {
      setPullDistance(Math.min(diff, threshold * 1.5));
      
      // Prevent default to stop browser's native pull-to-refresh
      if (diff > 5) {
        e.preventDefault();
      }
    }
  }, [isRefreshing, threshold, resistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    
    isPulling.current = false;
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    if (!isMobile) return;
    
    const options: AddEventListenerOptions = { passive: false };
    
    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;

  return {
    isRefreshing,
    pullDistance,
    progress,
    shouldTrigger,
  };
}

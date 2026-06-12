'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface PullToRefreshProps {
  children: React.ReactNode;
}

export default function PullToRefresh({ children }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startY = useRef(0);
  const startX = useRef(0);
  const isPulling = useRef(false);
  const canPull = useRef(false);

  // Keep references to current state to prevent re-binding touch listeners on every touchmove frame
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  useEffect(() => {
    const scrollParent = containerRef.current?.parentElement;
    if (!scrollParent) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshingRef.current) return;

      // Only pull if we are at the very top of the scroll container
      if (scrollParent.scrollTop <= 0) {
        canPull.current = true;
        startY.current = e.touches[0].clientY;
        startX.current = e.touches[0].clientX;
      } else {
        canPull.current = false;
      }
      isPulling.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canPull.current || isRefreshingRef.current) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - startY.current;
      const deltaX = currentX - startX.current;

      if (!isPulling.current) {
        // Only start pulling if dragging downward and gesture is mostly vertical
        if (deltaY > 8 && Math.abs(deltaY) > Math.abs(deltaX)) {
          isPulling.current = true;
        } else if (deltaY < -8 || Math.abs(deltaX) > Math.abs(deltaY)) {
          // Swipe up or horizontal swipe: disable pulling for this touch session
          canPull.current = false;
          return;
        }
      }

      if (isPulling.current && deltaY > 0) {
        // Prevent default browser scrolling when pulling down at top
        if (e.cancelable) {
          e.preventDefault();
        }

        // Resistance math: makes pulling harder the further down it goes
        // Max pull distance capped at 85px
        const newDist = Math.min(85, deltaY * 0.4);
        pullDistanceRef.current = newDist;
        setPullDistance(newDist);
      }
    };

    const handleTouchEnd = () => {
      if (
        isPulling.current &&
        pullDistanceRef.current >= 50 &&
        !isRefreshingRef.current
      ) {
        triggerRefresh();
      } else {
        // Reset drag distance smoothly
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
      isPulling.current = false;
      canPull.current = false;
    };

    scrollParent.addEventListener('touchstart', handleTouchStart, {
      passive: true
    });
    scrollParent.addEventListener('touchmove', handleTouchMove, {
      passive: false
    });
    scrollParent.addEventListener('touchend', handleTouchEnd, {
      passive: true
    });

    return () => {
      scrollParent.removeEventListener('touchstart', handleTouchStart);
      scrollParent.removeEventListener('touchmove', handleTouchMove);
      scrollParent.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const triggerRefresh = async () => {
    setIsRefreshing(true);
    pullDistanceRef.current = 60;
    setPullDistance(60); // Lock visual position at 60px while spinning

    // Fire the custom event to notify active views to reload data
    window.dispatchEvent(new CustomEvent('users-portal-refresh'));

    // Give it a natural spin duration of at least 1.2 seconds
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setIsRefreshing(false);
    pullDistanceRef.current = 0;
    setPullDistance(0);
  };

  // Pull percentage for rotation and opacity
  const pullPercent = Math.min(1, pullDistance / 50);

  return (
    <div ref={containerRef} className='relative min-h-full w-full'>
      {/* Floating Pull Indicator */}
      <motion.div
        style={{
          y: pullDistance - 45, // Starts hidden above top bounds
          opacity: pullPercent,
          scale: pullPercent
        }}
        animate={{
          y: isRefreshing ? 20 : pullDistance - 45,
          opacity: isRefreshing ? 1 : pullPercent,
          scale: isRefreshing ? 1 : pullPercent
        }}
        transition={
          isPulling.current
            ? { type: 'just' }
            : { type: 'spring', stiffness: 300, damping: 25 }
        }
        className='absolute left-1/2 z-50 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-slate-100 bg-white shadow-lg'
      >
        <RefreshCw
          className={`h-5 w-5 text-red-600 ${isRefreshing ? 'animate-spin' : ''}`}
          style={{
            transform: isRefreshing
              ? undefined
              : `rotate(${pullDistance * 4}deg)`
          }}
        />
      </motion.div>

      {/* Main Content children wrapper */}
      <motion.div
        animate={{
          y: isRefreshing ? 12 : pullDistance * 0.25 // Subtle downward nudge on main page content
        }}
        transition={
          isPulling.current
            ? { type: 'just' }
            : { type: 'spring', stiffness: 300, damping: 25 }
        }
        className='min-h-full w-full'
      >
        {children}
      </motion.div>
    </div>
  );
}

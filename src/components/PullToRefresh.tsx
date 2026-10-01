import React, { useState, useRef, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<unknown> | void;
  children: ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    } else {
      startY.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0 && window.scrollY === 0) {
      // Dampened pull
      setPullY(Math.min(diff * 0.45, 80));
    }
  };

  const handleTouchEnd = async () => {
    if (pullY >= 50 && !isRefreshing) {
      setIsRefreshing(true);
      setPullY(50);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullY(0);
        }, 300);
      }
    } else {
      setPullY(0);
    }
    startY.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull Indicator */}
      <div
        style={{ height: `${pullY}px`, opacity: pullY > 10 ? 1 : 0 }}
        className="overflow-hidden flex items-center justify-center transition-[height] duration-75 text-accent"
      >
        <RefreshCw
          className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
          style={{ transform: `rotate(${pullY * 4}deg)` }}
        />
      </div>

      {children}
    </div>
  );
}

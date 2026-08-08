import React, { useEffect, useState, useRef } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import styles from './FastScroll.module.css';

export const FastScroll = () => {
  const [isActive, setIsActive] = useState(false);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!('ontouchstart' in window)) return;

    let startY = 0;
    let startX = 0;
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;
    let isMonitoring = false;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (window.innerWidth - touch.clientX < 40) {
        isMonitoring = true;
        startY = touch.clientY;
        startX = touch.clientX;
        
        longPressTimer = setTimeout(() => {
          if (isMonitoring) {
            activeRef.current = true;
            setIsActive(true);
            triggerScroll(startY);
            if (navigator.vibrate) navigator.vibrate(50);
          }
        }, 200); // reduced to 200ms to feel more responsive
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (activeRef.current) {
        if (e.cancelable) e.preventDefault();
        triggerScroll(e.touches[0].clientY);
      } else if (isMonitoring) {
        const touch = e.touches[0];
        const dy = Math.abs(touch.clientY - startY);
        const dx = Math.abs(touch.clientX - startX);
        if (dx > 15 || dy > 15) {
           isMonitoring = false;
           if (longPressTimer) clearTimeout(longPressTimer);
        }
      }
    };

    const handleTouchEnd = () => {
      isMonitoring = false;
      if (longPressTimer) clearTimeout(longPressTimer);
      
      if (activeRef.current) {
        activeRef.current = false;
        setIsActive(false);
      }
    };

    const triggerScroll = (y: number) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      
      rafRef.current = requestAnimationFrame(() => {
        const margin = 40; 
        const usableHeight = window.innerHeight - margin * 2;
        const clampedY = Math.max(0, Math.min(y - margin, usableHeight));
        const percentage = clampedY / usableHeight;
        
        // Update DOM directly for max performance (no React render)
        if (indicatorRef.current) {
          const pixelY = margin + (percentage * usableHeight);
          // center the thumb vertically by subtracting 22px (half of 44px)
          indicatorRef.current.style.transform = `translateY(${pixelY - 22}px)`;
        }
        
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, percentage * scrollHeight);
      });
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    // Use { passive: false } to allow preventDefault which stops native scrolling
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!isActive) return null;

  return (
    <div ref={indicatorRef} className={styles.indicator}>
      <div className={styles.thumb}>
        <ChevronsUpDown size={20} color="#ffffff" />
      </div>
    </div>
  );
};

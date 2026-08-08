import React, { useEffect, useState, useRef } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import styles from './FastScroll.module.css';

export const FastScroll = () => {
  const [isActive, setIsActive] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const activeRef = useRef(false);

  useEffect(() => {
    // Only apply on touch devices
    if (!('ontouchstart' in window)) return;

    let startY = 0;
    let startX = 0;
    let longPressTimer: NodeJS.Timeout | null = null;
    let isMonitoring = false;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      // Check if touch is near the right edge (within 40px)
      if (window.innerWidth - touch.clientX < 40) {
        isMonitoring = true;
        startY = touch.clientY;
        startX = touch.clientX;
        
        longPressTimer = setTimeout(() => {
          if (isMonitoring) {
            activeRef.current = true;
            setIsActive(true);
            updateScroll(startY);
            if (navigator.vibrate) navigator.vibrate(50);
          }
        }, 300); // 300ms long press
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (activeRef.current) {
        e.preventDefault(); 
        updateScroll(e.touches[0].clientY);
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

    const updateScroll = (y: number) => {
      const margin = 50; 
      const usableHeight = window.innerHeight - margin * 2;
      const clampedY = Math.max(0, Math.min(y - margin, usableHeight));
      const percentage = clampedY / usableHeight;
      setScrollProgress(percentage);
      
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({
        top: percentage * scrollHeight,
        behavior: 'auto'
      });
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  if (!isActive) return null;

  return (
    <div className={styles.indicator} style={{ top: `calc(50px + ${scrollProgress * (window.innerHeight - 100)}px)` }}>
      <div className={styles.thumb}>
        <ChevronsUpDown size={20} color="#ffffff" />
      </div>
    </div>
  );
};

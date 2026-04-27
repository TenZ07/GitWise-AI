import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CustomCursor = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Use motion values for smooth cursor following
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Spring physics for delayed outer ring
  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Check if device is touch/mobile
    const checkMobile = () => {
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      const isSmall = window.innerWidth < 768;
      setIsMobile(isTouch || isSmall);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Only enable on desktop with fine pointer
    if (isMobile) {
      document.body.style.cursor = 'auto';
      return;
    }

    // Hide default cursor
    document.body.style.cursor = 'none';

    const updateCursor = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      setIsVisible(true);
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      const isInteractive = 
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.cursor-pointer') ||
        target.closest('[role="button"]') ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('input') ||
        target.closest('textarea');
      
      setIsHovering(isInteractive);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', updateCursor);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.body.style.cursor = 'auto';
      window.removeEventListener('mousemove', updateCursor);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('resize', checkMobile);
    };
  }, [isMobile, cursorX, cursorY]);

  // Don't render on mobile/touch devices
  if (isMobile) {
    return null;
  }

  return (
    <>
      {/* Outer cursor ring - follows with spring delay */}
      <motion.div
        className="fixed pointer-events-none z-[9999]"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isHovering ? 1.5 : 1,
          width: isClicking ? 30 : 40,
          height: isClicking ? 30 : 40,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          scale: { duration: 0.2 },
          width: { duration: 0.1 },
          height: { duration: 0.1 },
          opacity: { duration: 0.2 }
        }}
      >
        <div 
          className="w-full h-full rounded-full border-2"
          style={{
            // 🔥 ELECTRIC ORANGE COLORS
            backgroundColor: isHovering 
              ? 'rgba(255, 107, 0, 0.2)' 
              : 'rgba(255, 107, 0, 0.05)',
            borderColor: isHovering 
              ? 'rgba(255, 107, 0, 0.9)' 
              : 'rgba(255, 107, 0, 0.5)',
            boxShadow: isHovering 
              ? '0 0 20px rgba(255, 107, 0, 0.7), 0 0 40px rgba(255, 107, 0, 0.4)' 
              : '0 0 10px rgba(255, 107, 0, 0.4)'
          }}
        />
      </motion.div>

      {/* Inner cursor dot - follows instantly */}
      <motion.div
        className="fixed pointer-events-none z-[9999]"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isClicking ? 0.8 : 1,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          scale: { duration: 0.1 },
          opacity: { duration: 0.2 }
        }}
      >
        <div 
          className="w-2 h-2 rounded-full"
          style={{
            // 🔥 ELECTRIC ORANGE DOT
            backgroundColor: '#FF6B00',
            boxShadow: '0 0 10px rgba(255, 107, 0, 0.9)'
          }}
        />
      </motion.div>

      {/* Click ripple effect */}
      {isClicking && isVisible && (
        <motion.div
          className="fixed pointer-events-none z-[9998]"
          style={{
            x: cursorX,
            y: cursorY,
            translateX: '-50%',
            translateY: '-50%',
          }}
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div 
            className="w-16 h-16 rounded-full"
            style={{
              // 🔥 ELECTRIC ORANGE RIPPLE
              background: 'radial-gradient(circle, rgba(255, 107, 0, 0.5) 0%, transparent 70%)'
            }}
          />
        </motion.div>
      )}
    </>
  );
};

export default CustomCursor;
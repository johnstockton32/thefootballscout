import { motion, Transition } from 'framer-motion';
import { ReactNode, forwardRef } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

const transition: Transition = {
  duration: 0.3,
  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
};

export const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
  ({ children }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={transition}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    );
  }
);

PageTransition.displayName = 'PageTransition';

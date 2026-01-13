import { motion } from 'framer-motion';

export function FootballBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Large football - bottom right */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease: 'easeOut' }}
        className="absolute -bottom-24 -right-24 w-[450px] h-[450px] opacity-[0.025] dark:opacity-[0.02]"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" className="text-foreground" />
          <path
            d="M50 10 L70 30 L62 55 L38 55 L30 30 Z"
            stroke="currentColor"
            strokeWidth="1"
            fill="currentColor"
            className="text-foreground"
          />
          <path
            d="M10 42 L30 30 L38 55 L25 72 L8 58 Z"
            stroke="currentColor"
            strokeWidth="1"
            className="text-foreground"
          />
          <path
            d="M90 42 L70 30 L62 55 L75 72 L92 58 Z"
            stroke="currentColor"
            strokeWidth="1"
            className="text-foreground"
          />
          <path
            d="M25 72 L38 55 L62 55 L75 72 L62 90 L38 90 Z"
            stroke="currentColor"
            strokeWidth="1"
            className="text-foreground"
          />
          <line x1="50" y1="10" x2="50" y2="2" stroke="currentColor" strokeWidth="1" className="text-foreground" />
          <line x1="30" y1="30" x2="22" y2="22" stroke="currentColor" strokeWidth="1" className="text-foreground" />
          <line x1="70" y1="30" x2="78" y2="22" stroke="currentColor" strokeWidth="1" className="text-foreground" />
        </svg>
      </motion.div>

      {/* Medium football - top left */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.3, ease: 'easeOut' }}
        className="absolute -top-16 -left-16 w-[280px] h-[280px] opacity-[0.02] dark:opacity-[0.015]"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1.5" className="text-foreground" />
          <path
            d="M50 10 L70 30 L62 55 L38 55 L30 30 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="currentColor"
            className="text-foreground"
          />
          <path
            d="M10 42 L30 30 L38 55 L25 72 L8 58 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-foreground"
          />
          <path
            d="M90 42 L70 30 L62 55 L75 72 L92 58 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-foreground"
          />
        </svg>
      </motion.div>
    </div>
  );
}
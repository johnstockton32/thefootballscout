import { motion } from 'framer-motion';

export function FootballBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Large football - bottom right */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute -bottom-24 -right-24 w-[450px] h-[450px] opacity-[0.06] dark:opacity-[0.04]"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer circle */}
          <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" className="text-foreground" />
          
          {/* Pentagon patterns */}
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
          
          {/* Connecting lines */}
          <line x1="50" y1="10" x2="50" y2="2" stroke="currentColor" strokeWidth="1" className="text-foreground" />
          <line x1="30" y1="30" x2="22" y2="22" stroke="currentColor" strokeWidth="1" className="text-foreground" />
          <line x1="70" y1="30" x2="78" y2="22" stroke="currentColor" strokeWidth="1" className="text-foreground" />
          <line x1="8" y1="58" x2="2" y2="55" stroke="currentColor" strokeWidth="1" className="text-foreground" />
          <line x1="92" y1="58" x2="98" y2="55" stroke="currentColor" strokeWidth="1" className="text-foreground" />
          <line x1="38" y1="90" x2="35" y2="97" stroke="currentColor" strokeWidth="1" className="text-foreground" />
          <line x1="62" y1="90" x2="65" y2="97" stroke="currentColor" strokeWidth="1" className="text-foreground" />
        </svg>
      </motion.div>

      {/* Medium football - top left */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
        className="absolute -top-16 -left-16 w-[280px] h-[280px] opacity-[0.05] dark:opacity-[0.03]"
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
          <path
            d="M25 72 L38 55 L62 55 L75 72 L62 90 L38 90 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-foreground"
          />
        </svg>
      </motion.div>

      {/* Small football - center right */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
        className="absolute top-1/3 -right-10 w-[180px] h-[180px] opacity-[0.04] dark:opacity-[0.025]"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="2" className="text-foreground" />
          <path
            d="M50 10 L70 30 L62 55 L38 55 L30 30 Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="currentColor"
            className="text-foreground"
          />
        </svg>
      </motion.div>

      {/* Decorative circles - pitch lines */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.6, ease: 'easeOut' }}
        className="absolute bottom-20 left-10 w-[120px] h-[120px] opacity-[0.03] dark:opacity-[0.02]"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
          <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="50" cy="50" r="8" fill="currentColor" />
        </svg>
      </motion.div>

      {/* Small accent dot - top right */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }}
        className="absolute top-32 right-20 w-[60px] h-[60px] opacity-[0.04] dark:opacity-[0.03]"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="20 10" />
        </svg>
      </motion.div>

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-accent/[0.01]" />
    </div>
  );
}
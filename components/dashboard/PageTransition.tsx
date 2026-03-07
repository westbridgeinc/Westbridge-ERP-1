"use client";

import { motion } from "framer-motion";

const transition = { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const };

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

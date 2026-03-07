"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextGenerateEffectProps {
  words: string;
  className?: string;
  duration?: number;
}

export function TextGenerateEffect({ words, className, duration = 0.5 }: TextGenerateEffectProps) {
  const wordList = words.split(" ");

  return (
    <span className={cn("inline", className)}>
      {wordList.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: duration / wordList.length, delay: i * (duration / wordList.length) }}
          className="inline"
        >
          {word}{" "}
        </motion.span>
      ))}
    </span>
  );
}

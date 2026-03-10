"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-foreground/[0.03] blur-3xl" />
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-[1px] w-full"
          style={{
            top: `${15 + i * 14}%`,
            background: `linear-gradient(to right, transparent, oklch(from var(--foreground) l c h / ${0.06 + i * 0.02}), transparent)`,
          }}
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            duration: 10 + i * 3,
            repeat: Infinity,
            repeatDelay: 1 + i * 0.5,
            ease: "linear",
          }}
        />
      ))}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(to right, var(--foreground) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />
    </div>
  );
}

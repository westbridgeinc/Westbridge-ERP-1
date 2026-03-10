"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface MovingCard {
  quote: string;
  name: string;
  company: string;
  role?: string;
}

interface InfiniteMovingCardsProps {
  cards: MovingCard[];
  className?: string;
}

const CARD_WIDTH = 300;
const GAP = 24;
const CARD_TOTAL = CARD_WIDTH + GAP;

export function InfiniteMovingCards({ cards, className }: InfiniteMovingCardsProps) {
  const duplicated = [...cards, ...cards];
  const segmentWidth = cards.length * CARD_TOTAL;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <motion.div
        className="flex gap-6"
        animate={{ x: [0, -segmentWidth] }}
        transition={{
          x: { repeat: Infinity, repeatType: "loop", duration: 30, ease: "linear" },
        }}
      >
        {duplicated.map((card, i) => (
          <div
            key={i}
            className="flex h-[180px] w-[300px] shrink-0 flex-col justify-between rounded-xl border border-border bg-card p-6"
          >
            <p className="font-sans text-base italic leading-relaxed text-foreground">
              &ldquo;{card.quote}&rdquo;
            </p>
            <div>
              <p className="font-medium text-foreground">{card.name}</p>
              <p className="text-sm text-muted-foreground">
                {card.role ? `${card.role}, ` : ""}{card.company}
              </p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

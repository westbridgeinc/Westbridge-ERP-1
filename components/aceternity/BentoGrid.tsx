"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface BentoCard {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
  span?: "default" | "wide" | "tall";
}

interface BentoGridProps {
  cards: BentoCard[];
  className?: string;
}

export function BentoGrid({ cards, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          className={cn(
            "group rounded-xl border border-border bg-card p-6 transition-colors hover:bg-muted/30",
            card.span === "wide" && "md:col-span-2",
            card.span === "tall" && "md:row-span-2",
            card.className
          )}
        >
          {card.icon && (
            <div className="mb-3 text-muted-foreground transition-colors group-hover:text-foreground">
              {card.icon}
            </div>
          )}
          <h3 className="font-serif text-lg font-semibold tracking-tight text-foreground">
            {card.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {card.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

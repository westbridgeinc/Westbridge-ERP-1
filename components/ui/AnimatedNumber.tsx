"use client";

import { useRef, useState, useEffect } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { parseValue } from "@/lib/utils/animated-number";

export interface AnimatedNumberProps {
  /** Value to animate to. Can be a number or string like "38+", "14%". */
  value: number | string;
  /** Duration in ms. */
  duration?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration: _duration = 800,
  className = "",
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const { num, suffix } = parseValue(value);
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    stiffness: 80,
    damping: 30,
    restDelta: 0.001,
  });
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState("0" + suffix);

  useEffect(() => {
    if (isInView) motionValue.set(num);
  }, [isInView, num, motionValue]);

  useEffect(() => {
    return spring.on("change", (v) => {
      setDisplay(String(Math.round(v)) + suffix);
    });
  }, [spring, suffix]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

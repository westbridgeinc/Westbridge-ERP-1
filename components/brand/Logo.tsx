import Link from "next/link";

interface LogoProps {
  variant?: "full" | "mark" | "text";
  className?: string;
  size?: "sm" | "md" | "lg";
}

const badgeSizes = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
};

const wordmarkSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function Logo({ variant = "full", className = "", size = "md" }: LogoProps) {
  if (variant === "mark") {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground ${badgeSizes[size]} ${className}`}
      >
        W
      </div>
    );
  }

  if (variant === "text") {
    return (
      <span className={`font-semibold tracking-wide font-display uppercase ${wordmarkSizes[size]} ${className}`}>
        WESTBRIDGE
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground ${badgeSizes[size]}`}
      >
        W
      </div>
      <div className="flex flex-col">
        <span className={`font-semibold tracking-wide font-display uppercase leading-none ${wordmarkSizes[size]}`}>
          WESTBRIDGE
        </span>
        <span className="mt-0.5 text-[9px] font-light uppercase tracking-widest text-muted-foreground">
          Inc.
        </span>
      </div>
    </div>
  );
}

export function LogoLink({ variant = "full", size = "md", className = "" }: LogoProps) {
  return (
    <Link href="/" className={`inline-flex ${className}`}>
      <Logo variant={variant} size={size} />
    </Link>
  );
}

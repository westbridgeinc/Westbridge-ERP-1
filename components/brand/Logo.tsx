import Link from "next/link";

interface LogoProps {
  variant?: "full" | "mark" | "text";
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { mark: "text-xl", text: "text-[8px]", sub: "text-[6px]", gap: "tracking-[0.15em]" },
  md: { mark: "text-3xl", text: "text-[10px]", sub: "text-[7px]", gap: "tracking-[0.2em]" },
  lg: { mark: "text-5xl", text: "text-xs", sub: "text-[8px]", gap: "tracking-[0.25em]" },
};

export function Logo({ variant = "full", className = "", size = "md" }: LogoProps) {
  const s = sizes[size];

  if (variant === "mark") {
    return (
      <span className={`font-serif font-bold ${s.mark} ${className}`}>
        WB
      </span>
    );
  }

  if (variant === "text") {
    return (
      <span className={`font-sans font-medium ${s.gap} uppercase ${s.text} ${className}`}>
        Westbridge
      </span>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span className={`font-serif font-bold leading-none ${s.mark}`}>WB</span>
      <span className={`font-sans font-medium ${s.gap} uppercase ${s.text} mt-1`}>
        Westbridge
      </span>
      <span className={`font-sans font-light ${s.gap} uppercase ${s.sub} mt-0.5 text-muted-foreground`}>
        Inc.
      </span>
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

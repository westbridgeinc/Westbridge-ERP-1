"use client";

import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "fr", label: "FR" },
];

/**
 * Language switcher. Rewrites the path with the selected locale prefix.
 * Works with next-intl routing.
 */
export function LanguageSwitcher({ currentLocale = "en" }: { currentLocale?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(locale: string) {
    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0];
    const hasLocalePrefix = LOCALES.some((l) => l.code === firstSegment);
    const basePath = hasLocalePrefix ? `/${segments.slice(1).join("/")}` : pathname;
    const newPath = locale === "en" ? basePath || "/" : `/${locale}${basePath || "/"}`;
    router.push(newPath);
  }

  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Globe className="h-3.5 w-3.5" />
      <select
        value={currentLocale}
        onChange={(e) => switchLocale(e.target.value)}
        className="bg-transparent text-xs font-medium uppercase cursor-pointer border-none outline-none hover:text-foreground transition-colors"
        aria-label="Select language"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </div>
  );
}

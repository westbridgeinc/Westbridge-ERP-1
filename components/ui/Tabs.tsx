"use client";

import { useState, useCallback, useRef, type KeyboardEvent } from "react";

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  activeId?: string;
  defaultId?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export function Tabs({ items, activeId, defaultId, onChange, className = "" }: TabsProps) {
  const [internalId, setInternalId] = useState(defaultId ?? items[0]?.id ?? "");
  const currentId = activeId ?? internalId;
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleSelect = useCallback(
    (id: string) => {
      if (!activeId) setInternalId(id);
      onChange?.(id);
    },
    [activeId, onChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
      let nextIndex = index;
      if (e.key === "ArrowRight") nextIndex = (index + 1) % items.length;
      else if (e.key === "ArrowLeft") nextIndex = (index - 1 + items.length) % items.length;
      else if (e.key === "Home") nextIndex = 0;
      else if (e.key === "End") nextIndex = items.length - 1;
      else return;

      e.preventDefault();
      tabsRef.current[nextIndex]?.focus();
      handleSelect(items[nextIndex].id);
    },
    [items, handleSelect]
  );

  return (
    <div
      role="tablist"
      className={`inline-flex h-9 items-center rounded-lg bg-muted p-1 ${className}`}
    >
      {items.map((tab, i) => {
        const isActive = tab.id === currentId;
        return (
          <button
            key={tab.id}
            ref={(el) => { tabsRef.current[i] = el; }}
            role="tab"
            type="button"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => handleSelect(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

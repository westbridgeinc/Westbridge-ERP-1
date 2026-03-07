"use client";

import { Modal } from "@/components/ui/Modal";

const ROWS: { keys: string; label: string }[] = [
  { keys: "Ctrl+K", label: "Command palette" },
  { keys: "?", label: "Keyboard shortcuts (this help)" },
  { keys: "G then D", label: "Dashboard" },
  { keys: "G then I", label: "Invoices" },
  { keys: "G then A", label: "Accounting" },
  { keys: "G then E", label: "Expenses" },
  { keys: "G then C", label: "CRM" },
  { keys: "G then Q", label: "Quotations" },
  { keys: "G then N", label: "Inventory" },
  { keys: "G then P", label: "Procurement" },
  { keys: "G then H", label: "HR" },
  { keys: "G then R", label: "Payroll" },
  { keys: "G then Y", label: "Analytics" },
  { keys: "G then S", label: "Settings" },
  { keys: "N", label: "Notifications" },
];

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts">
      <div className="space-y-1">
        {ROWS.map((row) => (
          <div
            key={row.keys}
            className="flex items-center justify-between gap-4 border-b border-border py-2"
          >
            <span className="text-base text-muted-foreground">
              {row.label}
            </span>
            <kbd
              className="rounded border border-border px-2 py-1 text-[0.8125rem] font-medium text-muted-foreground/60"
            >
              {row.keys}
            </kbd>
          </div>
        ))}
      </div>
    </Modal>
  );
}

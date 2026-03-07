"use client";

import { Suspense } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ErpConnectionBanner } from "@/components/dashboard/ErpConnectionBanner";
import { ErpConnectionProvider } from "@/components/dashboard/ErpConnectionContext";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { ShortcutsProvider } from "@/components/dashboard/ShortcutsContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ShortcutsProvider>
        <ErpConnectionProvider>
          <div className="flex h-screen w-full">
            {/* Suspense required because AppSidebar uses useSearchParams() */}
            <Suspense fallback={<div className="w-[260px] min-w-[260px] border-r border-border bg-sidebar" />}>
              <AppSidebar />
            </Suspense>
            <SidebarInset>
              <DashboardHeader />
              <ErpConnectionBanner />
              <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
                <PageTransition>{children}</PageTransition>
              </main>
            </SidebarInset>
          </div>
        </ErpConnectionProvider>
      </ShortcutsProvider>
    </SidebarProvider>
  );
}

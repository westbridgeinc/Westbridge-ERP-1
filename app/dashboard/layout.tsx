"use client";

import dynamic from "next/dynamic";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ErpConnectionBanner } from "@/components/dashboard/ErpConnectionBanner";
import { ErpConnectionProvider } from "@/components/dashboard/ErpConnectionContext";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { ShortcutsProvider } from "@/components/dashboard/ShortcutsContext";
import { QueryProvider } from "@/components/dashboard/QueryProvider";

const AppSidebar = dynamic(() => import("@/components/dashboard/AppSidebar").then((m) => m.AppSidebar), {
  ssr: false,
  loading: () => <div className="w-[260px] min-w-[260px] border-r border-border bg-sidebar" />,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
    <SidebarProvider>
      <ShortcutsProvider>
        <ErpConnectionProvider>
          <div className="flex h-screen w-full">
            <AppSidebar />
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
    </QueryProvider>
  );
}

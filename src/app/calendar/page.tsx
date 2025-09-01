
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yotei - カレンダー",
};

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import dynamic from "next/dynamic";

const BigCalendar = dynamic(() => import("@/components/big-calendar"), {
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  ),
});

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-2 pt-0">
          <BigCalendar />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

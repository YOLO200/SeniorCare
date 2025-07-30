"use client";

import { useState, Suspense } from "react";
import Sidebar from "./Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#D8ECF8] to-[#E8DDFB]">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700"></div>
          </div>
        }>
          {children}
        </Suspense>
      </div>
    </div>
  );
}
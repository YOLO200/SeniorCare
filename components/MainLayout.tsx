"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

// Import all page components
import HomePage from "@/app/page";
import MembersPage from "@/app/members/page";
import CaregiversPage from "@/app/caregivers/page";
import RemindersPage from "@/app/reminders/page";
import SettingsPage from "@/app/settings/page";

interface MainLayoutProps {
  initialPage?: string;
}

export default function MainLayout({ initialPage }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage || "/");
  const pathname = usePathname();

  // Update current page when pathname changes
  useEffect(() => {
    setCurrentPage(pathname);
  }, [pathname]);

  const renderPage = () => {
    switch (currentPage) {
      case "/":
        return <HomePage />;
      case "/members":
        return <MembersPage />;
      case "/caregivers":
        return <CaregiversPage />;
      case "/reminders":
        return <RemindersPage />;
      case "/settings":
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#D8ECF8] to-[#E8DDFB]">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {renderPage()}
      </div>
    </div>
  );
}
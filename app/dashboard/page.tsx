"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import Sidebar from "@/components/Sidebar";

// Import all page components (remove AppLayout wrapper from them)
import HomePage from "@/components/pages/HomePage";
import MembersPage from "@/components/pages/MembersPage"; 
import CaregiversPage from "@/components/pages/CaregiversPage";
import RemindersPage from "@/components/pages/RemindersPage";
import SettingsPage from "@/components/pages/SettingsPage";
import BillingPage from "@/components/pages/BillingPage";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("/");


  // Handle URL-based navigation
  useEffect(() => {
    const urlPath = window.location.pathname;
    if (urlPath !== '/dashboard') {
      // If coming from a specific route, set that as the current page
      setCurrentPage(urlPath);
    }
  }, []);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadUser() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      const supabase = createClient() as SupabaseClient;
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push("/auth/login");
        return;
      }

      setUser(authUser);
      setLoading(false);
    }

    if (mounted) {
      loadUser();
    }
  }, [router, mounted]);

  const renderPage = () => {
    switch (currentPage) {
      case "/":
        return <HomePage setCurrentPage={setCurrentPage} />;
      case "/members":
        return <MembersPage />;
      case "/caregivers":
        return <CaregiversPage />;
      case "/reminders":
        return <RemindersPage />;
      case "/settings":
        return <SettingsPage />;
      case "/billing":
        return <BillingPage />;
      default:
        return <HomePage setCurrentPage={setCurrentPage} />;
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#D8ECF8] to-[#E8DDFB]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-violet-700">CareAI</h2>
          <p className="text-slate-600 text-lg max-w-xs mb-4">
            Supabase is not configured. Please set up your environment variables.
          </p>
        </div>
      </div>
    );
  }

  if (loading || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#D8ECF8] to-[#E8DDFB]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-violet-700">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#D8ECF8] to-[#E8DDFB]">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      
      {/* Main Content - Only this area changes */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-8">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
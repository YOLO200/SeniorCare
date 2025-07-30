"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import Sidebar from "@/components/Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
      
      // Get the user
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
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
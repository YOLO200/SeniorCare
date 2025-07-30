"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if this is a valid password reset session
    const checkSession = async () => {
      const supabase = createClient() as SupabaseClient;
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Invalid Reset Link",
          description: "This password reset link is invalid or has expired. Please request a new one.",
          variant: "destructive",
        });
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      }
    };
    
    checkSession();
  }, [router, toast]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient() as SupabaseClient;
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Password updated successfully!",
      });

      // Redirect to login page after successful password reset
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);

    } catch (error: any) {
      console.error("Password update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#D8ECF8] to-[#E8DDFB]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-violet-700">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      style={{
        background: "linear-gradient(to bottom right, #DBEAFE, #F1F5F9 50%, #E9D5FF)",
      }}
    >
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm px-10 py-12 rounded-2xl shadow-lg space-y-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-violet-500 rounded-lg flex items-center justify-center">
              <Lock className="text-white h-6 w-6" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Reset Password</h1>
          <p className="text-slate-600">Enter your new password below</p>
        </div>

        <form onSubmit={handlePasswordReset} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                New Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                required
                minLength={6}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                Confirm New Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
                minLength={6}
                className="h-12 text-base"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-500 hover:bg-violet-600 text-white py-4 text-base font-medium rounded-lg h-12 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Password...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={() => router.push("/auth/login")}
            className="text-violet-600 hover:text-violet-700 hover:underline font-medium"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
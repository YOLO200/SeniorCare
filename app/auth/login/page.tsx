import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LoginForm from "@/components/login-form";

export default async function LoginPage() {
  // If Supabase is not configured, show setup message directly
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h1 className="text-2xl font-bold mb-4 text-slate-800">
          Connect Supabase to get started
        </h1>
      </div>
    );
  }

  // Check if user is already logged in
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If user is logged in, redirect to home page
  if (session) {
    redirect("/");
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      style={{
        background:
          "linear-gradient(to bottom right, #DBEAFE, #F1F5F9 50%, #E9D5FF)",
      }}
    >
      <LoginForm />
    </div>
  );
}

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, User, ChevronRight } from "lucide-react";
import { signOut } from "@/lib/actions";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

export default async function Home() {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-violet-700">CareAI</h2>
          <p className="text-slate-600 text-lg max-w-xs mb-4">
            Supabase is not configured. Please set up your environment
            variables.
          </p>
        </div>
      </div>
    );
  }

  // Get the user from the server
  const supabase = (await createClient()) as SupabaseClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user, redirect to login
  if (!user) {
    redirect("/auth/login");
  }

  // Get the user's ID from the users table
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("supabase_id", user.id)
    .single();

  // Get all parents (recipients) for this user
  const { data: parents } = await supabase
    .from("parents")
    .select("id, name, phone_number, timezone")
    .eq("user_id", userData?.id)
    .order("name");

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white">
      <div className="w-full flex flex-col items-center justify-center gap-12 px-4 sm:px-6 md:px-12 py-10">
        {/* Branding */}
        <div className="text-center">
          <h2 className="text-5xl font-bold text-violet-700 mb-4">CareAI</h2>
          <p className="text-slate-600 text-lg max-w-xs">
            Empowering families with smart elder care.
          </p>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-2xl bg-white/90 backdrop-blur-sm px-10 py-12 rounded-2xl shadow-lg space-y-8 border border-slate-200">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold text-slate-800">
              Your Care Recipients
            </h1>
          </div>

          <div className="space-y-6">
            {/* Recipients List */}
            <div className="space-y-4 mb-8">
              {parents && parents.length > 0 ? (
                parents.map(
                  (parent: {
                    id: string;
                    name: string;
                    phone_number: string;
                    timezone: string;
                  }) => (
                    <Link
                      key={parent.id}
                      href={`/recipients/${parent.id}`}
                      className="block"
                    >
                      <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-violet-300 hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-violet-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-800 group-hover:text-violet-700">
                                {parent.name}
                              </h3>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-violet-600" />
                        </div>
                      </div>
                    </Link>
                  )
                )
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">
                    No care recipients added yet.
                  </p>
                  <p className="text-sm text-slate-500">
                    Add your first recipient to start managing their care.
                  </p>
                </div>
              )}
            </div>

            {/* Add New Recipient Button */}
            <Link href="/recipients/add">
              <Button className="w-full bg-violet-500 hover:bg-violet-600 text-white py-4 text-base sm:py-3 sm:text-sm font-medium rounded-lg h-12 sm:h-10 transition-colors">
                <Plus className="mr-2 h-4 w-4" />
                Add New Recipient
              </Button>
            </Link>

            {/* Sign Out Button */}
            <form action={signOut}>
              <Button
                type="submit"
                variant="outline"
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 py-4 text-base sm:py-3 sm:text-sm font-medium rounded-lg h-12 sm:h-10 transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

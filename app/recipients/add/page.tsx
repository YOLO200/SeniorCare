// app/recipients/add/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { User } from "lucide-react";
import AddRecipientForm from "@/app/recipients/AddRecipientForm";

export default async function AddRecipientPage() {
  // Get the user from the server
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user, redirect to login
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-violet-100">
      <div className="w-full flex flex-col items-center justify-center gap-12 px-4 sm:px-6 md:px-12 py-10">
        {/* Branding */}
        <div className="text-center">
          <h2 className="text-5xl font-bold text-violet-700 mb-4">CareAI</h2>
          <p className="text-slate-600 text-lg max-w-xs">
            Empowering families with smart elder care.
          </p>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-2xl bg-white/90 backdrop-blur-sm px-10 py-12 rounded-2xl shadow-lg space-y-8">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-6 w-6 text-violet-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">
              Add New Recipient
            </h1>
            <p className="text-slate-600">
              Enter the details for your care recipient
            </p>
          </div>
          <AddRecipientForm />
        </div>
      </div>
    </div>
  );
}

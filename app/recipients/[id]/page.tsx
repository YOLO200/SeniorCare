import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  User,
  LogOut,
  Edit,
  MessageSquare,
  PhoneCall,
} from "lucide-react";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { signOut } from "@/lib/actions";
import RemindersSection from "./RemindersSection";
import SummarySection from "./SummarySection";

interface RecipientInfoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RecipientInfoPage({
  params,
}: RecipientInfoPageProps) {
  const { id } = await params;
  const supabase = (await createClient()) as SupabaseClient;

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get the user's ID from the users table
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("supabase_id", user.id)
    .single();

  // Get the specific recipient/parent information
  const { data: recipient } = await supabase
    .from("parents")
    .select("*")
    .eq("id", id)
    .eq("user_id", userData?.id)
    .single();

  if (!recipient) {
    redirect("/");
  }

  // Get reminders for this recipient
  const { data: reminders } = await supabase
    .from("reminders")
    .select("*")
    .eq("parent_id", id)
    .order("time");

  // Get scheduled calls with AI agent responses for this recipient
  const { data: scheduledCalls } = await supabase
    .from("scheduled_calls")
    .select(
      `
      *,
      reminders (
        name,
        category,
        delivery_method
      )
    `
    )
    .eq("parent_id", id)
    .not("ai_agent_response", "is", null)
    .order("scheduled_time", { ascending: false })
    .limit(10);

  // Get scheduled texts with AI agent responses for this recipient (WITH JOIN)
  const { data: scheduledTexts } = await supabase
    .from("scheduled_texts")
    .select(
      `
      *,
      reminders (
        name,
        category,
        delivery_method
      )
    `
    )
    .eq("parent_id", id)
    .not("ai_agent_response", "is", null)
    .order("scheduled_time", { ascending: false })
    .limit(10);

  // Debug logging
  console.log("Page - scheduledTexts query result:", scheduledTexts);
  console.log("Page - scheduledTexts length:", scheduledTexts?.length);
  console.log("Page - recipient id:", id);
  console.log("Page - recipient id type:", typeof id);

  // Also try a simpler query to see if there are any texts at all
  const { data: allTexts, error: allTextsError } = await supabase
    .from("scheduled_texts")
    .select("*")
    .eq("parent_id", id);

  console.log("Page - allTexts for this recipient:", allTexts);
  console.log("Page - allTexts error:", allTextsError);
  console.log("Page - allTexts length:", allTexts?.length);

  // Check for texts with empty string responses (not null)
  const { data: textsWithEmptyResponse, error: emptyResponseError } =
    await supabase
      .from("scheduled_texts")
      .select("*")
      .eq("parent_id", id)
      .eq("ai_agent_response", "");

  console.log("Page - textsWithEmptyResponse:", textsWithEmptyResponse);
  console.log("Page - emptyResponseError:", emptyResponseError);

  // Try querying with string ID
  const { data: textsWithStringId, error: stringIdError } = await supabase
    .from("scheduled_texts")
    .select("*")
    .eq("parent_id", id.toString());

  console.log("Page - textsWithStringId:", textsWithStringId);
  console.log("Page - stringIdError:", stringIdError);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-violet-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 hover:text-violet-600 hover:bg-violet-50 text-xs sm:text-sm"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Recipients</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-800">
                Care Recipient Details
              </h1>
            </div>
            <form action={signOut}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="border-slate-300 text-slate-500 hover:text-violet-600 hover:bg-violet-50 h-8 px-2 ml-2 flex items-center gap-1"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-xs font-medium">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto mt-4 sm:mt-6 px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
          {/* Recipient Information Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg mb-4 sm:mb-6 overflow-hidden relative">
            <div className="absolute top-4 right-4 z-10">
              <Link href={`/recipients/${id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-slate-500 hover:text-violet-600 hover:bg-violet-50 h-8 px-2 flex items-center gap-1"
                  title="Edit Details"
                >
                  <Edit className="h-4 w-4" />
                  <span className="text-xs font-medium">Edit Details</span>
                </Button>
              </Link>
            </div>
            <div className="bg-violet-500 px-4 sm:px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {recipient.name}
                  </h2>
                  <p className="text-violet-100 text-sm sm:text-base">
                    {recipient.timezone.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reminders Section */}
          <RemindersSection
            reminders={reminders || []}
            recipientId={recipient.id}
          />

          {/* Summary Section */}
          <SummarySection
            scheduledCalls={scheduledCalls || []}
            scheduledTexts={scheduledTexts || []}
          />
        </div>
      </main>
    </div>
  );
}

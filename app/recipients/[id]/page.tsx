import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  User,
  Phone,
  Clock,
  Calendar,
  Plus,
  LogOut,
  Edit,
  MessageSquare,
  PhoneCall,
} from "lucide-react";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import ReminderModal from "./reminder/modal";
import { signOut } from "@/lib/actions";
import RemindersSection from "./RemindersSection";

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

          {/* Call Notes Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-violet-600" />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800">
                    Call Notes
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Summary of AI conversations with care recipients
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {scheduledCalls && scheduledCalls.length > 0 ? (
                <div className="space-y-4">
                  {scheduledCalls.map((call: any) => (
                    <div
                      key={call.id}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <PhoneCall className="h-4 w-4 text-violet-600 flex-shrink-0" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-slate-800 text-sm">
                                {call.reminders?.name || "Reminder"}
                              </p>
                              {call.status && (
                                <span
                                  className={`inline-block px-2 py-1 rounded-lg text-[10px] font-medium ${
                                    call.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : call.status === "failed"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {call.status}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600">
                              {call.reminders?.category}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500">
                            {new Date(call.scheduled_time).toLocaleDateString(
                              "en-US",
                              {
                                month: "numeric",
                                day: "numeric",
                                year: "2-digit",
                              }
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {new Date(call.scheduled_time).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded border border-slate-200">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {call.ai_agent_response}
                        </p>
                      </div>

                      {call.call_attempts > 0 && (
                        <div className="mt-2 text-xs text-slate-500">
                          Call attempts: {call.call_attempts}
                          {call.last_attempt_time && (
                            <>
                              {" "}
                              • Last attempt:{" "}
                              {new Date(
                                call.last_attempt_time
                              ).toLocaleString()}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-slate-600 mb-3 sm:mb-4 text-sm sm:text-base">
                    No call notes available yet.
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Call notes will appear here once scheduled calls with AI
                    responses are made.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

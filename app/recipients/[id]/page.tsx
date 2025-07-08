import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Phone, Clock, Calendar, Plus } from "lucide-react";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import ReminderModal from "./reminder/modal";

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

  return (
    <div className="min-h-screen bg-violet-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-violet-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 text-xs sm:text-sm"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Recipients</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
              <h1 className="text-lg sm:text-xl font-semibold text-violet-700">
                Care Recipient Details
              </h1>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto mt-4 sm:mt-6 px-4 sm:px-6 lg:px-8">
          {/* Recipient Information Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg mb-4 sm:mb-6 overflow-hidden">
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
                    Care Recipient
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-700">
                        Phone Number
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 break-all">
                        {recipient.phone_number}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-700">
                        Timezone
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600">
                        {recipient.timezone.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-700">
                        Date Added
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600">
                        {new Date(recipient.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reminders Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800">
                    Active Reminders
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {reminders?.length || 0} reminder
                    {reminders?.length !== 1 ? "s" : ""} configured
                  </p>
                </div>
                <ReminderModal
                  recipientId={recipient.id}
                  buttonText="Add Reminders"
                />
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {reminders && reminders.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {reminders.slice(0, 5).map((reminder: any) => (
                    <ReminderModal
                      key={reminder.id}
                      recipientId={recipient.id}
                      mode="edit"
                      reminder={reminder}
                      buttonText="Edit"
                      trigger={
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200 gap-3 sm:gap-0 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all group">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-800 text-sm sm:text-base group-hover:text-violet-700">
                              {reminder.name}
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-600">
                              {reminder.category}
                            </p>
                            {reminder.notes && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {reminder.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-xs sm:text-sm font-medium text-slate-700">
                              {reminder.time}
                            </p>
                            <div className="flex space-x-1 mt-1">
                              {[
                                "monday",
                                "tuesday",
                                "wednesday",
                                "thursday",
                                "friday",
                                "saturday",
                                "sunday",
                              ].map((day) => (
                                <div
                                  key={day}
                                  className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs ${
                                    reminder[day]
                                      ? "bg-violet-100 text-violet-600"
                                      : "bg-slate-200 text-slate-400"
                                  }`}
                                >
                                  {day.charAt(0).toUpperCase()}
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-slate-400 mt-2 group-hover:text-violet-500">
                              Click to edit
                            </p>
                          </div>
                        </div>
                      }
                    />
                  ))}

                  {reminders.length > 5 && (
                    <div className="text-center pt-4">
                      <p className="text-xs sm:text-sm text-slate-500">
                        Showing first 5 reminders. Use the "Add Reminders"
                        button to manage all reminders.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-slate-600 mb-3 sm:mb-4 text-sm sm:text-base">
                    No reminders configured yet.
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 mb-4">
                    Set up reminders to help {recipient.name} stay on track.
                  </p>
                  <ReminderModal
                    recipientId={recipient.id}
                    buttonText="Add First Reminder"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

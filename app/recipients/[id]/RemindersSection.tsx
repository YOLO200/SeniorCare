"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReminderModal from "./reminder/modal";

interface RemindersSectionProps {
  reminders: any[];
  recipientId: string;
}

export default function RemindersSection({
  reminders,
  recipientId,
}: RemindersSectionProps) {
  const [showAllReminders, setShowAllReminders] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 mb-4 sm:mb-6">
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
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {reminders.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllReminders(!showAllReminders)}
                className="sm:hidden border-slate-300 text-slate-600 hover:text-violet-600 hover:bg-violet-50 flex-1 text-center bg-violet-100"
              >
                {showAllReminders
                  ? "Show Less"
                  : `View All (${reminders.length - 1})`}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none bg-violet-500 hover:bg-violet-600 text-white hover:text-white text-sm sm:text-base"
              onClick={() => {
                // Trigger the ReminderModal programmatically
                const addButton = document.querySelector(
                  "[data-add-reminder]"
                ) as HTMLButtonElement;
                if (addButton) addButton.click();
              }}
            >
              Add Reminders
            </Button>
            <div className="hidden">
              <ReminderModal
                recipientId={recipientId}
                buttonText="Add Reminders"
                trigger={<button data-add-reminder className="hidden" />}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {reminders && reminders.length > 0 ? (
          <>
            {/* Single scrollable container for all reminders */}
            <div
              className={`space-y-3 sm:space-y-4 ${
                isMobile && showAllReminders
                  ? "max-h-96 overflow-y-auto pr-2"
                  : "sm:max-h-80 sm:overflow-y-auto sm:pr-4"
              }`}
            >
              {/* Show first 1 reminder on mobile when collapsed, all when expanded or on desktop */}
              {reminders
                .slice(0, isMobile && !showAllReminders ? 1 : reminders.length)
                .map((reminder: any) => (
                  <ReminderModal
                    key={reminder.id}
                    recipientId={recipientId}
                    mode="edit"
                    reminder={reminder}
                    buttonText="Edit"
                    trigger={
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-slate-50 rounded-lg border border-slate-200 gap-3 sm:gap-0 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-slate-800 text-sm sm:text-base group-hover:text-violet-700">
                              {reminder.name}
                            </h4>
                            <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded">
                              {reminder.delivery_method === "call"
                                ? "Phone Call"
                                : "Text Message"}
                            </span>
                          </div>
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
                          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1">
                            <p className="text-xs sm:text-sm font-medium text-slate-700">
                              {reminder.time}
                            </p>
                            <div className="flex space-x-1">
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
                          </div>
                        </div>
                      </div>
                    }
                  />
                ))}
            </div>
          </>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-slate-600 mb-3 sm:mb-4 text-sm sm:text-base">
              No reminders configured yet.
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mb-4">
              Set up reminders to help stay on track.
            </p>
            <ReminderModal
              recipientId={recipientId}
              buttonText="Add First Reminder"
            />
          </div>
        )}
      </div>
    </div>
  );
}

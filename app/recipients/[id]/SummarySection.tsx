"use client";

import { useState, useEffect } from "react";
import { BookOpen, MessageSquare, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConversationNotesSectionProps {
  scheduledCalls: any[];
  scheduledTexts: any[];
}

export default function ConversationNotesSection({
  scheduledCalls,
  scheduledTexts,
}: ConversationNotesSectionProps) {
  const [activeTab, setActiveTab] = useState<"calls" | "texts">("calls");

  // Debug logging
  useEffect(() => {
    console.log("ConversationNotesSection - scheduledCalls:", scheduledCalls);
    console.log("ConversationNotesSection - scheduledTexts:", scheduledTexts);
    console.log(
      "ConversationNotesSection - scheduledTexts length:",
      scheduledTexts?.length
    );
  }, [scheduledCalls, scheduledTexts]);

  const renderConversationItem = (item: any, type: "call" | "text") => (
    <div
      key={item.id}
      className="p-4 bg-slate-50 rounded-lg border border-slate-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          {type === "call" ? (
            <PhoneCall className="h-4 w-4 text-violet-600 flex-shrink-0" />
          ) : (
            <MessageSquare className="h-4 w-4 text-violet-600 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1 sm:justify-start sm:gap-2">
              <p className="font-medium text-slate-800 text-sm">
                {item.reminders?.name || "Reminder"}
              </p>
              {item.status && (
                <span
                  className={`inline-block px-2 py-1 rounded-lg text-[10px] sm:text-xs font-medium sm:hidden ${
                    item.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : item.status === "failed"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {item.status}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between sm:justify-start sm:gap-2">
              <p className="text-xs text-slate-600">
                {item.reminders?.category}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 sm:hidden">
                {new Date(
                  item.last_attempt_time || item.scheduled_time
                ).toLocaleDateString("en-US", {
                  month: "numeric",
                  day: "numeric",
                  year: "2-digit",
                })}{" "}
                •{" "}
                {new Date(
                  item.last_attempt_time || item.scheduled_time
                ).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          {item.status && (
            <p className="text-[10px] sm:text-xs font-medium mb-1">
              <span
                className={`inline-block px-2 py-1 rounded-lg ${
                  item.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : item.status === "failed"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {item.status}
              </span>
            </p>
          )}
          <p className="text-[10px] sm:text-xs text-slate-500">
            {new Date(
              item.last_attempt_time || item.scheduled_time
            ).toLocaleDateString("en-US", {
              month: "numeric",
              day: "numeric",
              year: "2-digit",
            })}{" "}
            •{" "}
            {new Date(
              item.last_attempt_time || item.scheduled_time
            ).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </p>
        </div>
      </div>

      <div className="bg-white p-3 rounded border border-slate-200">
        <p className="text-sm text-slate-700 whitespace-pre-wrap">
          {item.ai_agent_response}
        </p>
      </div>
    </div>
  );

  const currentData = activeTab === "calls" ? scheduledCalls : scheduledTexts;
  const callCount = scheduledCalls?.length || 0;
  const textCount = scheduledTexts?.length || 0;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-violet-600" />
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-800">
              Conversation Notes
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Summary of AI conversations with care recipients
            </p>
          </div>
        </div>

        {/* Toggle Buttons */}
        <div className="flex space-x-2 mt-4">
          <Button
            variant={activeTab === "calls" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("calls")}
            className={`${
              activeTab === "calls"
                ? "bg-violet-500 hover:bg-violet-600 text-white"
                : "border-slate-300 text-slate-600 hover:text-violet-600 hover:bg-violet-50"
            }`}
          >
            Calls ({callCount})
          </Button>
          <Button
            variant={activeTab === "texts" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("texts")}
            className={`${
              activeTab === "texts"
                ? "bg-violet-500 hover:bg-violet-600 text-white"
                : "border-slate-300 text-slate-600 hover:text-violet-600 hover:bg-violet-50"
            }`}
          >
            Texts ({textCount})
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {currentData && currentData.length > 0 ? (
          <div className="space-y-4">
            {currentData.map((item: any) =>
              renderConversationItem(
                item,
                activeTab === "calls" ? "call" : "text"
              )
            )}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-slate-600 mb-3 sm:mb-4 text-sm sm:text-base">
              No {activeTab === "calls" ? "call" : "text"} notes available yet.
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              {activeTab === "calls"
                ? "Call notes will appear here once scheduled calls with AI responses are made."
                : "Text notes will appear here once scheduled texts with AI responses are made."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

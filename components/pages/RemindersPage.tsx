"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Phone,
  MessageSquare,
  Calendar,
  Edit,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReminderForm from "@/app/recipients/[id]/reminder/ReminderForm";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

interface Reminder {
  id: number;
  name: string;
  category: string;
  delivery_method: string;
  time: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  notes: string;
  parent_id: number;
  parent?: {
    id: number;
    name: string;
  };
}

export default function RemindersPage() {
  const [deliveryFilter, setDeliveryFilter] = useState<"call" | "text">("call");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const REMINDERS_PER_PAGE = 10;

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get user data
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("supabase_id", user.id)
        .single();

      if (!userData) return;

      // Fetch all parents/recipients for the user
      const { data: parentsData, error: parentsError } = await supabase
        .from("parents")
        .select("*")
        .eq("user_id", userData.id);

      if (parentsError) {
        console.error("Error fetching parents:", parentsError);
        toast({
          title: "Error",
          description: "Failed to load recipients",
          variant: "destructive",
        });
        return;
      }

      // Sort parents alphabetically by name
      const sortedParents = (parentsData || []).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setParents(sortedParents);

      // Don't select any parent by default - show all users
      // Only set selectedMemberId if it's already set (user clicked on a specific user)

      // Fetch all reminders for all parents
      const parentIds = sortedParents?.map((p) => p.id) || [];
      if (parentIds.length > 0) {
        const { data: remindersData, error: remindersError } = await supabase
          .from("reminders")
          .select(
            `
            *,
            parents!reminders_parent_id_fkey (
              id,
              name
            )
          `
          )
          .in("parent_id", parentIds)
          .order("time");

        if (remindersError) {
          console.error("Error fetching reminders:", remindersError);
          toast({
            title: "Error",
            description: "Failed to load reminders",
            variant: "destructive",
          });
          return;
        }

        // Transform the data to include parent information
        const transformedReminders =
          remindersData?.map((r) => ({
            ...r,
            parent: r.parents,
          })) || [];

        setReminders(transformedReminders);
      }
    } catch (error) {
      console.error("Error in fetchData:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredReminders = reminders.filter(
    (r) =>
      r.delivery_method === deliveryFilter &&
      (selectedMemberId === "" || r.parent_id.toString() === selectedMemberId)
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredReminders.length / REMINDERS_PER_PAGE);
  const startIndex = (currentPage - 1) * REMINDERS_PER_PAGE;
  const endIndex = startIndex + REMINDERS_PER_PAGE;
  const paginatedReminders = filteredReminders.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMemberId, deliveryFilter]);

  const handleAddReminder = () => {
    if (parents.length === 0) {
      toast({
        title: "No Recipients",
        description:
          "Please add a care recipient first before creating reminders.",
        variant: "destructive",
      });
      return;
    }
    setSelectedReminder(null);
    setModalMode("add");
    setSelectedParentId(selectedMemberId || parents[0]?.id.toString() || "");
    setModalOpen(true);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setModalMode("edit");
    setSelectedParentId(reminder.parent_id.toString());
    setModalOpen(true);
  };

  const handleSuccess = () => {
    setModalOpen(false);
    fetchData(); // Refresh the data
  };

  const getDayString = (reminder: Reminder) => {
    const days = [];
    if (reminder.monday) days.push("Mon");
    if (reminder.tuesday) days.push("Tue");
    if (reminder.wednesday) days.push("Wed");
    if (reminder.thursday) days.push("Thu");
    if (reminder.friday) days.push("Fri");
    if (reminder.saturday) days.push("Sat");
    if (reminder.sunday) days.push("Sun");

    if (days.length === 7) return "Every day";
    if (days.length === 0) return "No days selected";
    return days.join(", ");
  };

  // Convert reminders to calendar events
  const convertRemindersToEvents = (reminders: Reminder[]) => {
    const events: any[] = [];

    reminders.forEach((reminder) => {
      const parent = parents.find((p) => p.id === reminder.parent_id);
      const color = getParentColor(reminder.parent_id);

      // Create recurring events for each selected day
      const daysOfWeek = [];
      if (reminder.monday) daysOfWeek.push(1);
      if (reminder.tuesday) daysOfWeek.push(2);
      if (reminder.wednesday) daysOfWeek.push(3);
      if (reminder.thursday) daysOfWeek.push(4);
      if (reminder.friday) daysOfWeek.push(5);
      if (reminder.saturday) daysOfWeek.push(6);
      if (reminder.sunday) daysOfWeek.push(0);

      daysOfWeek.forEach((dayOfWeek) => {
        events.push({
          id: `${reminder.id}-${dayOfWeek}`,
          title: `${reminder.name} (${parent?.name || "Unknown"})`,
          startTime: reminder.time,
          daysOfWeek: [dayOfWeek],
          startRecur: new Date(new Date().getFullYear() - 1, 0, 1), // Start from beginning of last year
          endRecur: new Date(new Date().getFullYear() + 1, 11, 31), // End of next year
          backgroundColor: color,
          borderColor: color,
          textColor: "#ffffff",
          extendedProps: {
            reminder: reminder,
            parent: parent,
          },
        });
      });
    });

    return events;
  };

  // Generate colors for different parents - Specific Pastel Colors
  const getParentColor = (parentId: number) => {
    const colors = [
      "#87CEEB", // Baby Blue
      "#FFB6C1", // Pastel Pink
      "#D8BFD8", // Lavender (darker)
      "#FFDAB9", // Peach
      "#98FB98", // Pastel Green
    ];

    const parentIndex = parents.findIndex((p) => p.id === parentId);
    return colors[parentIndex % colors.length];
  };

  const handleEventClick = (info: any) => {
    const reminder = info.event.extendedProps.reminder;
    if (reminder) {
      // Check if this is a past event
      const eventDate = info.event.start;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (eventDate < today) {
        // Past event - show read-only view
        setSelectedReminder(reminder);
        setModalMode("view");
        setSelectedParentId(reminder.parent_id.toString());
        setModalOpen(true);
      } else {
        // Future event - allow editing
        handleEditReminder(reminder);
      }
    }
  };

  const calendarEvents = convertRemindersToEvents(filteredReminders);

  // Debug logging
  console.log("Filtered reminders:", filteredReminders);
  console.log("Calendar events:", calendarEvents);

  return (
    <>
      {/* Header */}
      <div className="mb-8 mt-16 lg:mt-0">
        <h1 className="text-3xl font-bold text-slate-800">Reminders</h1>
        <p className="text-slate-600 mt-2">
          Manage all reminders across your care recipients
        </p>
      </div>

      {/* Filter and Stats */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Active Reminders
            </h2>
            <div className="text-sm text-slate-600 mb-4">
              <span className="font-medium">{filteredReminders.length}</span>{" "}
              {deliveryFilter} reminder
              {filteredReminders.length !== 1 ? "s" : ""}
              {selectedMemberId === "" ? (
                <span className="text-slate-500"> for all users</span>
              ) : (
                selectedMemberId &&
                parents.find((p) => p.id.toString() === selectedMemberId) && (
                  <span className="text-slate-500">
                    {" "}
                    for{" "}
                    {
                      parents.find((p) => p.id.toString() === selectedMemberId)
                        ?.name
                    }
                  </span>
                )
              )}
            </div>

            {/* Member Selector */}
            {parents.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedMemberId("");
                    setSelectedParentId("");
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedMemberId === ""
                      ? "bg-violet-500 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Users
                </button>
                {parents.map((parent, index) => {
                  const parentColor = getParentColor(parent.id);
                  return (
                    <button
                      key={parent.id}
                      onClick={() => {
                        setSelectedMemberId(parent.id.toString());
                        setSelectedParentId(parent.id.toString());
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        selectedMemberId === parent.id.toString()
                          ? "bg-violet-500 text-white shadow-md"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: parentColor }}
                      />
                      {parent.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Filter Buttons */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setDeliveryFilter("call")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  deliveryFilter === "call"
                    ? "bg-blue-200 text-blue-800 shadow-md border border-blue-300"
                    : "text-slate-600 hover:text-slate-800 hover:bg-blue-50"
                }`}
              >
                <Phone className="h-4 w-4" />
                <span>Call</span>
              </button>
              <button
                onClick={() => setDeliveryFilter("text")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  deliveryFilter === "text"
                    ? "bg-green-200 text-green-800 shadow-md border border-green-300"
                    : "text-slate-600 hover:text-slate-800 hover:bg-green-50"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Text</span>
              </button>
            </div>

            {/* Add Reminder Button */}
            <button
              onClick={handleAddReminder}
              className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Reminder
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto"></div>
            <p className="text-slate-600 mt-4">Loading reminders...</p>
          </div>
        ) : filteredReminders.length > 0 ? (
          <div className="h-[800px] p-4">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek",
              }}
              events={calendarEvents}
              eventClick={handleEventClick}
              height="100%"
              eventDisplay="block"
              dayMaxEvents={false}
              dayMaxEventRows={false}
              eventTimeFormat={{
                hour: "numeric",
                minute: "2-digit",
                meridiem: "short",
              }}
              validRange={{
                start: new Date(new Date().getFullYear() - 1, 0, 1),
                end: new Date(new Date().getFullYear() + 1, 11, 31),
              }}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              No {deliveryFilter} reminders found
            </h3>
            <p className="text-slate-600 mb-6">
              {parents.length === 0
                ? "You need to add members first before creating reminders."
                : `No ${deliveryFilter} reminders configured yet.`}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit/View Reminder Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-xl border-0 shadow-xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-lg sm:text-xl">
              {modalMode === "add"
                ? "Add New Reminder"
                : modalMode === "edit"
                ? "Edit Reminder"
                : "Reminder Details"}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {modalMode === "add"
                ? "Fill out the form below to set up the reminder details."
                : modalMode === "edit"
                ? "Update the reminder details below."
                : "View the reminder details below."}
            </DialogDescription>
          </DialogHeader>

          {modalMode === "view" ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Name
                </label>
                <p className="mt-1 text-sm text-slate-900 bg-slate-50 p-3 rounded-lg">
                  {selectedReminder?.name}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Category
                  </label>
                  <p className="mt-1 text-sm text-slate-900 bg-slate-50 p-3 rounded-lg">
                    {selectedReminder?.category}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Time
                  </label>
                  <p className="mt-1 text-sm text-slate-900 bg-slate-50 p-3 rounded-lg">
                    {selectedReminder?.time}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Delivery Method
                  </label>
                  <p className="mt-1 text-sm text-slate-900 bg-slate-50 p-3 rounded-lg">
                    {selectedReminder?.delivery_method === "call"
                      ? "Phone Call"
                      : "Text Message"}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Days
                </label>
                <p className="mt-1 text-sm text-slate-900 bg-slate-50 p-3 rounded-lg">
                  {selectedReminder ? getDayString(selectedReminder) : ""}
                </p>
              </div>

              {selectedReminder?.notes && (
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Notes
                  </label>
                  <p className="mt-1 text-sm text-slate-900 bg-slate-50 p-3 rounded-lg">
                    {selectedReminder.notes}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setModalOpen(false)}
                  className="bg-slate-500 hover:bg-slate-600 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <ReminderForm
              recipientId={selectedParentId}
              onSuccess={handleSuccess}
              mode={modalMode as "add" | "edit"}
              reminder={selectedReminder}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

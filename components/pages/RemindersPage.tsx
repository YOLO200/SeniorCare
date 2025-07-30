"use client";

import { useState, useEffect } from "react";
import { Bell, Plus, Phone, MessageSquare, Calendar, Edit, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [deliveryFilter, setDeliveryFilter] = useState<'call' | 'text'>('call');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
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
      const { data: { user } } = await supabase.auth.getUser();
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

      // Set the first parent as selected by default
      if (sortedParents.length > 0 && !selectedMemberId) {
        setSelectedMemberId(sortedParents[0].id.toString());
        setSelectedParentId(sortedParents[0].id.toString());
      }

      // Fetch all reminders for all parents
      const parentIds = sortedParents?.map(p => p.id) || [];
      if (parentIds.length > 0) {
        const { data: remindersData, error: remindersError } = await supabase
          .from("reminders")
          .select(`
            *,
            parents!reminders_parent_id_fkey (
              id,
              name
            )
          `)
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
        const transformedReminders = remindersData?.map(r => ({
          ...r,
          parent: r.parents
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
    r => r.delivery_method === deliveryFilter && 
         r.parent_id.toString() === selectedMemberId
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
        description: "Please add a care recipient first before creating reminders.",
        variant: "destructive",
      });
      return;
    }
    setSelectedReminder(null);
    setModalMode('add');
    setSelectedParentId(selectedMemberId || parents[0]?.id.toString() || '');
    setModalOpen(true);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setModalMode('edit');
    setSelectedParentId(reminder.parent_id.toString());
    setModalOpen(true);
  };

  const handleSuccess = () => {
    setModalOpen(false);
    fetchData(); // Refresh the data
  };

  const getDayString = (reminder: Reminder) => {
    const days = [];
    if (reminder.monday) days.push('Mon');
    if (reminder.tuesday) days.push('Tue');
    if (reminder.wednesday) days.push('Wed');
    if (reminder.thursday) days.push('Thu');
    if (reminder.friday) days.push('Fri');
    if (reminder.saturday) days.push('Sat');
    if (reminder.sunday) days.push('Sun');
    
    if (days.length === 7) return 'Every day';
    if (days.length === 0) return 'No days selected';
    return days.join(', ');
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8 mt-16 lg:mt-0">
        <h1 className="text-3xl font-bold text-slate-800">Reminders</h1>
        <p className="text-slate-600 mt-2">Manage all reminders across your care recipients</p>
      </div>

      {/* Filter and Stats */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Active Reminders</h2>
            <div className="text-sm text-slate-600 mb-4">
              <span className="font-medium">{filteredReminders.length}</span> {deliveryFilter} reminder{filteredReminders.length !== 1 ? 's' : ''}
              {selectedMemberId && parents.find(p => p.id.toString() === selectedMemberId) && (
                <span className="text-slate-500"> for {parents.find(p => p.id.toString() === selectedMemberId)?.name}</span>
              )}
            </div>
            
            {/* Member Selector */}
            {parents.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {parents.map((parent) => (
                  <button
                    key={parent.id}
                    onClick={() => {
                      setSelectedMemberId(parent.id.toString());
                      setSelectedParentId(parent.id.toString());
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedMemberId === parent.id.toString()
                        ? 'bg-violet-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {parent.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Filter Buttons */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setDeliveryFilter('call')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  deliveryFilter === 'call'
                    ? 'bg-blue-200 text-blue-800 shadow-md border border-blue-300'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-blue-50'
                }`}
              >
                <Phone className="h-4 w-4" />
                <span>Call</span>
              </button>
              <button
                onClick={() => setDeliveryFilter('text')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  deliveryFilter === 'text'
                    ? 'bg-green-200 text-green-800 shadow-md border border-green-300'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-green-50'
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

      {/* Reminders List */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto"></div>
            <p className="text-slate-600 mt-4">Loading reminders...</p>
          </div>
        ) : filteredReminders.length > 0 ? (
          <div>
            <div className="space-y-4">
              {paginatedReminders.map((reminder) => (
              <div
                key={reminder.id}
                onClick={() => handleEditReminder(reminder)}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer group"
              >
                <div className="flex-1 min-w-0 mb-3 sm:mb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-slate-800 text-base group-hover:text-violet-700">
                      {reminder.name}
                    </h4>
                    <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded">
                      {reminder.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {reminder.delivery_method === 'call' ? (
                      <Phone className="h-3 w-3" />
                    ) : (
                      <MessageSquare className="h-3 w-3" />
                    )}
                    <span>{reminder.delivery_method === 'call' ? 'Phone Call' : 'Text Message'}</span>
                  </div>
                  {reminder.notes && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {reminder.notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-1">
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-medium text-slate-700 mb-1">
                      {reminder.time}
                    </p>
                    <p className="text-xs text-slate-600">
                      {getDayString(reminder)}
                    </p>
                  </div>
                  <Edit className="h-4 w-4 text-slate-400 group-hover:text-violet-600 sm:mt-2" />
                </div>
              </div>
            ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
                <div className="text-sm text-slate-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredReminders.length)} of {filteredReminders.length} reminders
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md flex items-center gap-1 text-sm flex-shrink-0 ${
                      currentPage === 1
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {(() => {
                      const maxVisible = 4;
                      let startPage = 1;
                      let endPage = Math.min(maxVisible, totalPages);
                      
                      if (currentPage > 3 && totalPages > maxVisible) {
                        startPage = currentPage - 2;
                        endPage = Math.min(currentPage + 1, totalPages);
                        
                        if (endPage - startPage < maxVisible - 1) {
                          startPage = Math.max(1, endPage - maxVisible + 1);
                        }
                      }
                      
                      const pages = [];
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(i);
                      }
                      
                      return pages.map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-md text-sm font-medium flex-shrink-0 ${
                            currentPage === page
                              ? 'bg-violet-500 text-white'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      ));
                    })()}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md flex items-center gap-1 text-sm flex-shrink-0 ${
                      currentPage === totalPages
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
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

      {/* Add/Edit Reminder Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-xl border-0 shadow-xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-lg sm:text-xl">
              {modalMode === 'add' ? 'Add New Reminder' : 'Edit Reminder'}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {modalMode === 'add'
                ? 'Fill out the form below to set up the reminder details.'
                : 'Update the reminder details below.'}
            </DialogDescription>
          </DialogHeader>
          <ReminderForm
            recipientId={selectedParentId}
            onSuccess={handleSuccess}
            mode={modalMode}
            reminder={selectedReminder}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
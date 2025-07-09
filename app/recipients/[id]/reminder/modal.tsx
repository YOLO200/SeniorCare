"use client";

import { useState } from "react";
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
import { Plus, Edit } from "lucide-react";

interface ReminderModalProps {
  recipientId: string;
  buttonText?: string;
  mode?: "add" | "edit";
  reminder?: any;
  trigger?: React.ReactNode;
}

export default function ReminderModal({
  recipientId,
  buttonText = "Add Reminders",
  mode = "add",
  reminder,
  trigger,
}: ReminderModalProps) {
  const [open, setOpen] = useState(false);

  const defaultTrigger = (
    <Button className="bg-violet-500 hover:bg-violet-600 text-white text-sm sm:text-base">
      {mode === "add" ? (
        <Plus className="h-4 w-4 mr-2" />
      ) : (
        <Edit className="h-4 w-4 mr-2" />
      )}
      {buttonText}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-xl border-0 shadow-xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-lg sm:text-xl">
            {mode === "add" ? "Add New Reminder" : "Edit Reminder"}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {mode === "add"
              ? "Fill out the form below to set up the reminder details."
              : "Update the reminder details below."}
          </DialogDescription>
        </DialogHeader>
        <ReminderForm
          recipientId={recipientId}
          onSuccess={() => setOpen(false)}
          mode={mode}
          reminder={reminder}
        />
      </DialogContent>
    </Dialog>
  );
}

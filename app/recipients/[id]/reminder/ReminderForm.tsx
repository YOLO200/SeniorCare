// components/ReminderForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export const reminderSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["Medicine", "Appointment", "Activity"]),
  delivery_method: z.enum(["text", "call"]),
  hour: z.string(),
  minute: z.string(),
  ampm: z.enum(["AM", "PM"]),
  monday: z.boolean().default(false),
  tuesday: z.boolean().default(false),
  wednesday: z.boolean().default(false),
  thursday: z.boolean().default(false),
  friday: z.boolean().default(false),
  saturday: z.boolean().default(false),
  sunday: z.boolean().default(false),
  notes: z.string().min(1),
});

type ReminderFormValues = z.infer<typeof reminderSchema>;

export default function ReminderForm({
  recipientId,
  onSuccess,
  mode = "add",
  reminder,
}: {
  recipientId: string;
  onSuccess: () => void;
  mode?: "add" | "edit";
  reminder?: any;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse time string back to components for editing
  const parseTimeString = (timeString: string) => {
    const match = timeString.match(/(\d+):(\d+)(AM|PM)/);
    if (match) {
      return {
        hour: match[1],
        minute: match[2],
        ampm: match[3] as "AM" | "PM",
      };
    }
    return { hour: "12", minute: "00", ampm: "AM" as const };
  };

  const getDefaultValues = (): ReminderFormValues => {
    if (mode === "edit" && reminder) {
      const timeComponents = parseTimeString(reminder.time);
      return {
        name: reminder.name || "",
        category: reminder.category || "Medicine",
        delivery_method: reminder.delivery_method || "text",
        hour: timeComponents.hour,
        minute: timeComponents.minute,
        ampm: timeComponents.ampm,
        monday: reminder.monday || false,
        tuesday: reminder.tuesday || false,
        wednesday: reminder.wednesday || false,
        thursday: reminder.thursday || false,
        friday: reminder.friday || false,
        saturday: reminder.saturday || false,
        sunday: reminder.sunday || false,
        notes: reminder.notes || "",
      };
    }

    return {
      name: "",
      category: "Medicine",
      delivery_method: "text",
      hour: "12",
      minute: "00",
      ampm: "AM",
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
      notes: "",
    };
  };

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: getDefaultValues(),
  });

  const formatTimeString = (hour: string, minute: string, ampm: string) =>
    `${hour}:${minute}${ampm}`;

  const handleSubmit = async (values: ReminderFormValues) => {
    setIsSubmitting(true);
    try {
      const time = formatTimeString(values.hour, values.minute, values.ampm);
      const reminderData = {
        name: values.name,
        category: values.category,
        delivery_method: values.delivery_method,
        time,
        monday: values.monday,
        tuesday: values.tuesday,
        wednesday: values.wednesday,
        thursday: values.thursday,
        friday: values.friday,
        saturday: values.saturday,
        sunday: values.sunday,
        notes: values.notes,
        parent_id: parseInt(recipientId),
      };

      if (mode === "edit" && reminder) {
        // Update existing reminder
        const { error } = await supabase
          .from("reminders")
          .update(reminderData)
          .eq("id", reminder.id);
        if (error) throw error;
        toast({ title: "Reminder updated" });
      } else {
        // Create new reminder
        const { error } = await supabase
          .from("reminders")
          .insert([reminderData]);
        if (error) throw error;
        toast({ title: "Reminder added" });
      }

      router.refresh();
      onSuccess();
    } catch (err) {
      toast({
        title: "Error",
        description:
          mode === "edit"
            ? "Could not update reminder"
            : "Could not create reminder",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 sm:space-y-6"
      >
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm sm:text-base font-medium">
                Reminder Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Take medicine"
                  {...field}
                  className="text-sm sm:text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category and Delivery Method */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm sm:text-base font-medium">
                  Category
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Medicine">Medicine</SelectItem>
                    <SelectItem value="Appointment">Appointment</SelectItem>
                    <SelectItem value="Activity">Activity</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Delivery Method */}
          <FormField
            control={form.control}
            name="delivery_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm sm:text-base font-medium">
                  Delivery Method
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="text">Text Message</SelectItem>
                    <SelectItem value="call">Phone Call</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Time */}
        <div>
          <FormLabel className="text-sm sm:text-base font-medium mb-3 block">
            Reminder Time
          </FormLabel>
          <div className="flex flex-row gap-2 sm:gap-3">
            {["hour", "minute", "ampm"].map((key) => (
              <FormField
                key={key}
                control={form.control}
                name={key as keyof ReminderFormValues}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value as string}
                      >
                        <SelectTrigger className="text-sm sm:text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {key === "hour" &&
                            Array.from({ length: 12 }, (_, i) => (
                              <SelectItem key={i + 1} value={`${i + 1}`}>
                                {i + 1}
                              </SelectItem>
                            ))}
                          {key === "minute" &&
                            ["00", "15", "30", "45"].map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          {key === "ampm" &&
                            ["AM", "PM"].map((a) => (
                              <SelectItem key={a} value={a}>
                                {a}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        {/* Days */}
        <div>
          <FormLabel className="text-sm sm:text-base font-medium mb-3 block">
            Repeat Days
          </FormLabel>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {[
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ].map((day) => (
              <FormField
                key={day}
                control={form.control}
                name={day as keyof ReminderFormValues}
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center space-y-1">
                    <FormLabel className="text-xs capitalize text-center">
                      {day.slice(0, 3)}
                    </FormLabel>
                    <FormControl>
                      <Checkbox
                        checked={field.value as boolean}
                        onCheckedChange={field.onChange}
                        className="h-4 w-4 sm:h-5 sm:w-5"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm sm:text-base font-medium">
                Notes
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes..."
                  {...field}
                  className="text-sm sm:text-base min-h-[80px] sm:min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
          {mode === "edit" && (
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                if (confirm("Are you sure you want to delete this reminder?")) {
                  setIsSubmitting(true);
                  try {
                    const { error } = await supabase
                      .from("reminders")
                      .delete()
                      .eq("id", reminder.id);
                    if (error) throw error;
                    toast({ title: "Reminder deleted" });
                    router.refresh();
                    onSuccess();
                  } catch (err) {
                    toast({
                      title: "Error",
                      description: "Could not delete reminder",
                      variant: "destructive",
                    });
                  } finally {
                    setIsSubmitting(false);
                  }
                }
              }}
              disabled={isSubmitting}
              className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-2"
            >
              {isSubmitting ? "Deleting..." : "Delete Reminder"}
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-2"
          >
            {isSubmitting
              ? mode === "edit"
                ? "Updating..."
                : "Saving..."
              : mode === "edit"
              ? "Update Reminder"
              : "Save Reminder"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

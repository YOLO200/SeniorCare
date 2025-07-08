// app/recipients/add/AddRecipientForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { addRecipient } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  countryCode: z.string().min(1, "Country code is required"),
  timezone: z.string().min(1, "Timezone is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function AddRecipientForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      countryCode: "+1_US",
      timezone: "America/New_York",
    },
  });

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Convert the data object to FormData
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("phoneNumber", data.phoneNumber);
      formData.append("countryCode", data.countryCode);
      formData.append("timezone", data.timezone);

      const result = await addRecipient(null, formData);

      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else if (result?.success) {
        toast({
          title: "Success",
          description: result.success,
        });
        router.push("/");
      }
    } catch (error) {
      console.error("Error adding recipient:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Care recipient's name</FormLabel>
              <FormControl>
                <Input placeholder="Enter name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone Number Field */}
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone number</FormLabel>
              <div className="flex gap-2">
                <div className="w-24">
                  <FormField
                    control={form.control}
                    name="countryCode"
                    render={({ field: countryField }) => (
                      <Select
                        onValueChange={countryField.onChange}
                        defaultValue={countryField.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Code" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="h-[300px]">
                          {/* North America at the top */}
                          <SelectItem value="+1_US">+1 [US]</SelectItem>
                          <SelectItem value="+1_CA">+1 [CA]</SelectItem>

                          {/* Rest alphabetically */}
                          <SelectItem value="+44">+44 [UK]</SelectItem>
                          <SelectItem value="+33">+33 [FR]</SelectItem>
                          <SelectItem value="+49">+49 [DE]</SelectItem>
                          <SelectItem value="+39">+39 [IT]</SelectItem>
                          <SelectItem value="+34">+34 [ES]</SelectItem>
                          <SelectItem value="+81">+81 [JP]</SelectItem>
                          <SelectItem value="+86">+86 [CN]</SelectItem>
                          <SelectItem value="+91">+91 [IN]</SelectItem>
                          <SelectItem value="+61">+61 [AU]</SelectItem>
                          <SelectItem value="+55">+55 [BR]</SelectItem>
                          <SelectItem value="+52">+52 [MX]</SelectItem>
                          <SelectItem value="+7_RU">+7 [RU]</SelectItem>
                          <SelectItem value="+82">+82 [KR]</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="Enter phone number"
                      type="tel"
                      {...field}
                    />
                  </FormControl>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Timezone Field */}
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="h-[300px]">
                  {/* US Timezones at the top */}
                  <SelectItem value="America/New_York">
                    Eastern Time (ET)
                  </SelectItem>
                  <SelectItem value="America/Chicago">
                    Central Time (CT)
                  </SelectItem>
                  <SelectItem value="America/Denver">
                    Mountain Time (MT)
                  </SelectItem>
                  <SelectItem value="America/Los_Angeles">
                    Pacific Time (PT)
                  </SelectItem>
                  <SelectItem value="America/Anchorage">
                    Alaska Time (AKT)
                  </SelectItem>
                  <SelectItem value="Pacific/Honolulu">
                    Hawaii Time (HT)
                  </SelectItem>

                  {/* Common worldwide timezones */}
                  <SelectItem value="UTC">
                    UTC (Coordinated Universal Time)
                  </SelectItem>
                  <SelectItem value="Europe/London">
                    United Kingdom (GMT/BST)
                  </SelectItem>
                  <SelectItem value="Europe/Paris">France (CET)</SelectItem>
                  <SelectItem value="Europe/Berlin">Germany (CET)</SelectItem>
                  <SelectItem value="Europe/Rome">Italy (CET)</SelectItem>
                  <SelectItem value="Europe/Madrid">Spain (CET)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Japan (JST)</SelectItem>
                  <SelectItem value="Asia/Shanghai">China (CST)</SelectItem>
                  <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                  <SelectItem value="Australia/Sydney">
                    Australia - Sydney (AEST/AEDT)
                  </SelectItem>
                  <SelectItem value="America/Sao_Paulo">
                    Brazil - São Paulo (BRT)
                  </SelectItem>
                  <SelectItem value="America/Mexico_City">
                    Mexico (CST)
                  </SelectItem>
                  <SelectItem value="Europe/Moscow">
                    Russia - Moscow (MSK)
                  </SelectItem>
                  <SelectItem value="Asia/Seoul">Korea (KST)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            className="text-sm text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-violet-500 hover:bg-violet-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            {isSubmitting ? "Adding..." : "Add Recipient"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

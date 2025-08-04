"use client";

// Import everything from the original MembersPage except the AppLayout wrapper
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X, UserPlus, User, Plus } from "lucide-react";
import { addRecipient, getMembers, updateMember } from "@/lib/actions";
import Link from "next/link";
import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
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
import { useToast } from "@/hooks/use-toast";

// Function to format phone number for display
const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove underscores and split by underscores
  const parts = phoneNumber.split("_");

  if (parts.length >= 3) {
    // Format: +1_US_1234567890 -> +1 1234567890
    const countryCode = parts[0];
    const phoneDigits = parts.slice(2).join("");
    return `${countryCode} ${phoneDigits}`;
  } else if (parts.length === 2) {
    // Format: +1_1234567890 -> +1 1234567890
    const countryCode = parts[0];
    const phoneDigits = parts[1];
    return `${countryCode} ${phoneDigits}`;
  } else {
    // Fallback: just replace underscores with spaces
    return phoneNumber.replace(/_/g, " ");
  }
};

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .refine((value) => {
      // Remove any non-digit characters for validation
      const digitsOnly = value.replace(/\D/g, "");
      return digitsOnly.length === 10;
    }, "Phone number must be exactly 10 digits"),
  countryCode: z.string().min(1, "Country code is required"),
  timezone: z.string().min(1, "Timezone is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function MembersPage() {
  const [user, setUser] = useState<any>(null);
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
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

  const editForm = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      countryCode: "+1_US",
      timezone: "America/New_York",
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedMember) {
      const phoneNumberParts = selectedMember.phone_number.split("_");
      let countryCode = "+1_US";
      let phoneNumber = "";

      if (phoneNumberParts.length >= 2) {
        countryCode = `${phoneNumberParts[0]}_${phoneNumberParts[1]}`;
        phoneNumber = phoneNumberParts.slice(2).join("_");
      } else if (phoneNumberParts.length === 1) {
        phoneNumber = phoneNumberParts[0];
      }

      editForm.reset({
        name: selectedMember.name,
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        timezone: selectedMember.timezone,
      });
    }
  }, [selectedMember, editForm]);

  useEffect(() => {
    async function loadData() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      const supabase = createClient() as SupabaseClient;

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/auth/login");
        return;
      }

      setUser(authUser);

      const result = await getMembers();

      if (result.error) {
        console.error("Error loading members:", result.error);
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        console.log("Loaded members data:", result.data);
        setParents(result.data || []);
      }
      setLoading(false);
    }

    loadData();
  }, [router, toast]);

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
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
        setIsModalOpen(false);
        form.reset();
        await reloadData();
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

  const reloadData = async () => {
    if (!isSupabaseConfigured) return;

    const result = await getMembers();

    if (result.error) {
      console.error("Error reloading members:", result.error);
    } else {
      console.log("Reloaded members data:", result.data);
      setParents(result.data || []);
    }
  };

  const handleRowClick = (parent: any, event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest("a")) {
      return;
    }
    setSelectedMember(parent);
    setIsEditModalOpen(true);
  };

  const handleNameClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const handleEditSubmit = async (data: FormData) => {
    if (!selectedMember) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("memberId", selectedMember.id.toString());
      formData.append("name", data.name);
      formData.append("phoneNumber", data.phoneNumber);
      formData.append("countryCode", data.countryCode);
      formData.append("timezone", data.timezone);

      const result = await updateMember(null, formData);

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
        setIsEditModalOpen(false);
        setSelectedMember(null);
        await reloadData();
      }
    } catch (error) {
      console.error("Error updating member:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !mounted) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-violet-700">
          Loading members...
        </h2>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8 mt-16 lg:mt-0">
        <h1 className="text-3xl font-bold text-slate-800">Members</h1>
        <p className="text-slate-600 mt-2">Manage your care recipients</p>
      </div>

      {/* Members/Care Recipients Section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Care Recipients</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add New Member
          </button>
        </div>

        {parents && parents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">
                    Member Name
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">
                    Phone Number
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">
                    Timezone
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {parents.map(
                  (parent: {
                    id: number;
                    name: string;
                    phone_number: string;
                    timezone: string;
                  }) => (
                    <tr
                      key={parent.id}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={(e) => handleRowClick(parent, e)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/recipients/${parent.id}`}
                            className="flex items-center space-x-3 font-medium text-violet-600 hover:text-violet-700 hover:underline hover:bg-violet-50 px-2 py-1 rounded transition-colors"
                            onClick={handleNameClick}
                          >
                            <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-violet-600" />
                            </div>
                            <span>{parent.name}</span>
                          </Link>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatPhoneNumber(parent.phone_number)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {parent.timezone.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              No members added yet
            </h3>
            <p className="text-slate-600 mb-6">
              Add your first care recipient to start managing their care
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Your First Member
            </button>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">
                  Add New Member
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-4"
                >
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
                                    <SelectItem value="+1_US">
                                      +1 [US]
                                    </SelectItem>
                                    <SelectItem value="+1_CA">
                                      +1 [CA]
                                    </SelectItem>
                                    <SelectItem value="+44">
                                      +44 [UK]
                                    </SelectItem>
                                    <SelectItem value="+33">
                                      +33 [FR]
                                    </SelectItem>
                                    <SelectItem value="+49">
                                      +49 [DE]
                                    </SelectItem>
                                    <SelectItem value="+39">
                                      +39 [IT]
                                    </SelectItem>
                                    <SelectItem value="+34">
                                      +34 [ES]
                                    </SelectItem>
                                    <SelectItem value="+81">
                                      +81 [JP]
                                    </SelectItem>
                                    <SelectItem value="+86">
                                      +86 [CN]
                                    </SelectItem>
                                    <SelectItem value="+91">
                                      +91 [IN]
                                    </SelectItem>
                                    <SelectItem value="+61">
                                      +61 [AU]
                                    </SelectItem>
                                    <SelectItem value="+55">
                                      +55 [BR]
                                    </SelectItem>
                                    <SelectItem value="+52">
                                      +52 [MX]
                                    </SelectItem>
                                    <SelectItem value="+7_RU">
                                      +7 [RU]
                                    </SelectItem>
                                    <SelectItem value="+82">
                                      +82 [KR]
                                    </SelectItem>
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="h-[300px]">
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
                            <SelectItem value="UTC">
                              UTC (Coordinated Universal Time)
                            </SelectItem>
                            <SelectItem value="Europe/London">
                              United Kingdom (GMT/BST)
                            </SelectItem>
                            <SelectItem value="Europe/Paris">
                              France (CET)
                            </SelectItem>
                            <SelectItem value="Europe/Berlin">
                              Germany (CET)
                            </SelectItem>
                            <SelectItem value="Europe/Rome">
                              Italy (CET)
                            </SelectItem>
                            <SelectItem value="Europe/Madrid">
                              Spain (CET)
                            </SelectItem>
                            <SelectItem value="Asia/Tokyo">
                              Japan (JST)
                            </SelectItem>
                            <SelectItem value="Asia/Shanghai">
                              China (CST)
                            </SelectItem>
                            <SelectItem value="Asia/Kolkata">
                              India (IST)
                            </SelectItem>
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
                            <SelectItem value="Asia/Seoul">
                              Korea (KST)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Form Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Adding..." : "Add Member"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {isEditModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">
                  Edit Member Details
                </h3>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedMember(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <Form {...editForm}>
                <form
                  onSubmit={editForm.handleSubmit(handleEditSubmit)}
                  className="space-y-4"
                >
                  {/* Name Field */}
                  <FormField
                    control={editForm.control}
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
                    control={editForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone number</FormLabel>
                        <div className="flex gap-2">
                          <div className="w-24">
                            <FormField
                              control={editForm.control}
                              name="countryCode"
                              render={({ field: countryField }) => (
                                <Select
                                  onValueChange={countryField.onChange}
                                  value={countryField.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Code" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="h-[300px]">
                                    <SelectItem value="+1_US">
                                      +1 [US]
                                    </SelectItem>
                                    <SelectItem value="+1_CA">
                                      +1 [CA]
                                    </SelectItem>
                                    <SelectItem value="+44">
                                      +44 [UK]
                                    </SelectItem>
                                    <SelectItem value="+33">
                                      +33 [FR]
                                    </SelectItem>
                                    <SelectItem value="+49">
                                      +49 [DE]
                                    </SelectItem>
                                    <SelectItem value="+39">
                                      +39 [IT]
                                    </SelectItem>
                                    <SelectItem value="+34">
                                      +34 [ES]
                                    </SelectItem>
                                    <SelectItem value="+81">
                                      +81 [JP]
                                    </SelectItem>
                                    <SelectItem value="+86">
                                      +86 [CN]
                                    </SelectItem>
                                    <SelectItem value="+91">
                                      +91 [IN]
                                    </SelectItem>
                                    <SelectItem value="+61">
                                      +61 [AU]
                                    </SelectItem>
                                    <SelectItem value="+55">
                                      +55 [BR]
                                    </SelectItem>
                                    <SelectItem value="+52">
                                      +52 [MX]
                                    </SelectItem>
                                    <SelectItem value="+7_RU">
                                      +7 [RU]
                                    </SelectItem>
                                    <SelectItem value="+82">
                                      +82 [KR]
                                    </SelectItem>
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
                    control={editForm.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="h-[300px]">
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
                            <SelectItem value="UTC">
                              UTC (Coordinated Universal Time)
                            </SelectItem>
                            <SelectItem value="Europe/London">
                              United Kingdom (GMT/BST)
                            </SelectItem>
                            <SelectItem value="Europe/Paris">
                              France (CET)
                            </SelectItem>
                            <SelectItem value="Europe/Berlin">
                              Germany (CET)
                            </SelectItem>
                            <SelectItem value="Europe/Rome">
                              Italy (CET)
                            </SelectItem>
                            <SelectItem value="Europe/Madrid">
                              Spain (CET)
                            </SelectItem>
                            <SelectItem value="Asia/Tokyo">
                              Japan (JST)
                            </SelectItem>
                            <SelectItem value="Asia/Shanghai">
                              China (CST)
                            </SelectItem>
                            <SelectItem value="Asia/Kolkata">
                              India (IST)
                            </SelectItem>
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
                            <SelectItem value="Asia/Seoul">
                              Korea (KST)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Form Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setSelectedMember(null);
                      }}
                      className="px-4 py-2"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2"
                    >
                      {isSubmitting ? "Updating..." : "Update Member"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

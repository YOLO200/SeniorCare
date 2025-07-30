"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, 
  Plus,
  Shield,
  X
} from "lucide-react";
import { addCaregiver, getCaregivers, updateCaregiver } from "@/lib/actions";
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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  countryCode: z.string().min(1, "Country code is required"),
  role: z.string().min(1, "Role is required"),
  accessLevel: z.string().min(1, "Access level is required"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function CaregiversPage() {
  const [user, setUser] = useState<any>(null);
  const [caregivers, setCaregivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCaregiver, setSelectedCaregiver] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      countryCode: "+1",
      role: "Caregiver",
      accessLevel: "view",
      notes: "",
    },
  });

  const editForm = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      countryCode: "+1",
      role: "Caregiver",
      accessLevel: "view",
      notes: "",
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedCaregiver) {
      // Parse phone number
      const phoneNumberParts = selectedCaregiver.phone_number.split('_');
      let countryCode = '+1';
      let phoneNumber = '';
      
      if (phoneNumberParts.length >= 2) {
        countryCode = phoneNumberParts[0];
        phoneNumber = phoneNumberParts.slice(1).join('_');
      } else if (phoneNumberParts.length === 1) {
        phoneNumber = phoneNumberParts[0];
      }

      console.log('Selected caregiver for edit:', selectedCaregiver);
      console.log('Access level:', selectedCaregiver.access_level);

      editForm.reset({
        name: selectedCaregiver.name,
        email: selectedCaregiver.email,
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        role: selectedCaregiver.role || "Caregiver",
        accessLevel: selectedCaregiver.access_level || "view",
        notes: selectedCaregiver.notes || "",
      });
    }
  }, [selectedCaregiver, editForm]);

  useEffect(() => {
    async function loadData() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      const supabase = createClient() as SupabaseClient;
      
      // Get the user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push("/auth/login");
        return;
      }

      setUser(authUser);

      // Load caregivers using server action
      const result = await getCaregivers();
      
      if (result.error) {
        console.error("Error loading caregivers:", result.error);
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        console.log("Loaded caregivers data:", result.data);
        setCaregivers(result.data || []);
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
      formData.append("email", data.email);
      formData.append("phoneNumber", data.phoneNumber);
      formData.append("countryCode", data.countryCode);
      formData.append("role", data.role);
      formData.append("accessLevel", data.accessLevel);
      formData.append("notes", data.notes || "");

      const result = await addCaregiver(null, formData);

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
        // Reload the data
        await reloadData();
      }
    } catch (error) {
      console.error("Error adding caregiver:", error);
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

    const result = await getCaregivers();
    
    if (result.error) {
      console.error("Error reloading caregivers:", result.error);
    } else {
      console.log("Reloaded caregivers data:", result.data);
      setCaregivers(result.data || []);
    }
  };

  const handleRowClick = (caregiver: any, event: React.MouseEvent) => {
    // Don't trigger if clicking on a button or link
    if ((event.target as HTMLElement).closest('button, a')) {
      return;
    }
    setSelectedCaregiver(caregiver);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (data: FormData) => {
    if (!selectedCaregiver) return;

    console.log('Submitting edit with data:', data);
    console.log('Access level being submitted:', data.accessLevel);

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("caregiverId", selectedCaregiver.id.toString());
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("phoneNumber", data.phoneNumber);
      formData.append("countryCode", data.countryCode);
      formData.append("role", data.role);
      formData.append("accessLevel", data.accessLevel);
      formData.append("notes", data.notes || "");

      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const result = await updateCaregiver(null, formData);

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
        setSelectedCaregiver(null);
        await reloadData();
      }
    } catch (error) {
      console.error("Error updating caregiver:", error);
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
        <h2 className="text-xl font-semibold text-violet-700">Loading caregivers...</h2>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8 mt-16 lg:mt-0">
        <h1 className="text-3xl font-bold text-slate-800">Caregivers</h1>
        <p className="text-slate-600 mt-2">Manage caregivers who help with care recipients</p>
      </div>

      {/* Caregivers Section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Caregiver Team</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Caregiver
          </button>
        </div>
        
        {caregivers && caregivers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Phone</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Access Level</th>
                </tr>
              </thead>
              <tbody>
                {caregivers.map((caregiver: any) => (
                  <tr 
                    key={caregiver.id} 
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    onClick={(e) => handleRowClick(caregiver, e)}
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium">{caregiver.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span>{caregiver.email}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span>{caregiver.phone_number.replace(/_/g, " ")}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {caregiver.role}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        caregiver.access_level === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : caregiver.access_level === 'edit'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {caregiver.access_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <UserPlus className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No caregivers added yet</h3>
            <p className="text-slate-600 mb-6">
              Add caregivers to help manage care recipients
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add to Care Team
            </button>
          </div>
        )}
      </div>

      {/* Add Caregiver Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">Add New Caregiver</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  {/* Name Field */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Caregiver's name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email Field */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email" {...field} />
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
                                  <SelectContent>
                                    <SelectItem value="+1">+1 (US/CA)</SelectItem>
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

                  {/* Role Field */}
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Caregiver">Caregiver</SelectItem>
                            <SelectItem value="Nurse">Nurse</SelectItem>
                            <SelectItem value="Doctor">Doctor</SelectItem>
                            <SelectItem value="Therapist">Therapist</SelectItem>
                            <SelectItem value="Family Member">Family Member</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Access Level Field */}
                  <FormField
                    control={form.control}
                    name="accessLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Access Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select access level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="view">View Only</SelectItem>
                            <SelectItem value="edit">Edit</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Notes Field */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add any additional notes about this caregiver"
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
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
                      {isSubmitting ? "Adding..." : "Add Caregiver"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Caregiver Modal */}
      {isEditModalOpen && selectedCaregiver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">Edit Caregiver</h3>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedCaregiver(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                  {/* Name Field */}
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Caregiver's name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email Field */}
                  <FormField
                    control={editForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email" {...field} />
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
                                  <SelectContent>
                                    <SelectItem value="+1">+1 (US/CA)</SelectItem>
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

                  {/* Role Field */}
                  <FormField
                    control={editForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Caregiver">Caregiver</SelectItem>
                            <SelectItem value="Nurse">Nurse</SelectItem>
                            <SelectItem value="Doctor">Doctor</SelectItem>
                            <SelectItem value="Therapist">Therapist</SelectItem>
                            <SelectItem value="Family Member">Family Member</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Access Level Field */}
                  <FormField
                    control={editForm.control}
                    name="accessLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Access Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select access level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="view">View Only</SelectItem>
                            <SelectItem value="edit">Edit</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Notes Field */}
                  <FormField
                    control={editForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add any additional notes about this caregiver"
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
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
                        setSelectedCaregiver(null);
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
                      {isSubmitting ? "Updating..." : "Update Caregiver"}
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
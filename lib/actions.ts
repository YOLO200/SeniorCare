"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Type definitions
export interface Parent {
  id: number;
  name: string;
  phone_number: string;
  timezone: string;
}

// Helper function to create Supabase client for server actions
async function createSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// Update the signIn function to handle redirects properly
export async function signIn(prevState: any, formData: FormData) {
  // Check if formData is valid
  if (!formData) {
    return { error: "Form data is missing" };
  }

  const email = formData.get("email");
  const password = formData.get("password");

  // Validate required fields
  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createSupabaseClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    });

    if (error) {
      return { error: error.message };
    }

    // Return success instead of redirecting directly
    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

// Update the signUp function to handle potential null formData
export async function signUp(prevState: any, formData: FormData) {
  // Check if formData is valid
  if (!formData) {
    return { error: "Form data is missing" };
  }

  const email = formData.get("email");
  const password = formData.get("password");
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const timezone = formData.get("timezone");

  // Validate required fields
  if (!email || !password || !firstName || !lastName || !timezone) {
    return { error: "All fields are required" };
  }

  const supabase = await createSupabaseClient();

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
    });

    if (error) {
      return { error: error.message };
    }

    // If signup was successful and we have a user, create a profile record
    if (data.user) {
      const { error: profileError } = await supabase.from("users").insert({
        supabase_id: data.user.id,
        first_name: firstName.toString(),
        last_name: lastName.toString(),
        email: email.toString(),
        phone_number: "+1", // Default phone number placeholder
        timezone: timezone.toString(),
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // Don't fail the signup if profile creation fails, but log it
        // The user can still sign in and we can handle profile creation later
      }
    }

    return { success: "Check your email to confirm your account." };
  } catch (error) {
    console.error("Sign up error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function signUpWithGoogle() {
  const supabase = await createSupabaseClient();

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Google sign up error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function signOut() {
  const supabase = await createSupabaseClient();

  await supabase.auth.signOut();
  redirect("/auth/login");
}

export async function signInWithGoogle() {
  const supabase = await createSupabaseClient();

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Google sign in error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}


export async function resetPassword(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" };
  }

  const email = formData.get("email");
  if (!email) {
    return { error: "Email is required" };
  }

  const supabase = await createSupabaseClient();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toString(),
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
      }
    );

    if (error) {
      return { error: error.message };
    }

    return { success: "Password reset email sent! Check your email for instructions." };
  } catch (error) {
    console.error("Password reset error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function getMembers() {
  const supabase = await createSupabaseClient();

  try {
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "User not authenticated" };
    }

    // Get the user's ID from the users table
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("id")
      .eq("supabase_id", user.id)
      .single();

    if (userDataError || !userData) {
      return { error: "User data not found" };
    }

    // Get all parents (recipients) for this user
    const { data: parentsData, error: parentsError } = await supabase
      .from("parents")
      .select("id, name, phone_number, timezone")
      .eq("user_id", userData.id)
      .order("name");

    if (parentsError) {
      console.error("Error loading parents:", parentsError);
      return { error: "Failed to load members" };
    }

    return { success: true, data: parentsData || [] };
  } catch (error) {
    console.error("Get members error:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function updateMember(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" };
  }

  const memberId = formData.get("memberId");
  const name = formData.get("name");
  const phoneNumber = formData.get("phoneNumber");
  const countryCode = formData.get("countryCode");
  const timezone = formData.get("timezone");

  // Validate required fields
  if (!memberId || !name || !phoneNumber || !countryCode || !timezone) {
    return { error: "All fields are required" };
  }

  const supabase = await createSupabaseClient();

  try {
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "User not authenticated" };
    }

    // Format phone number with country code
    const formattedPhoneNumber = `${countryCode}_${phoneNumber}`;

    // Update the member
    const { error: updateError } = await supabase
      .from("parents")
      .update({
        name: name.toString(),
        phone_number: formattedPhoneNumber,
        timezone: timezone.toString(),
      })
      .eq("id", parseInt(memberId.toString()));

    if (updateError) {
      console.error("Update error:", updateError);
      return { error: "Failed to update member. Please try again." };
    }

    return { success: "Member updated successfully!" };
  } catch (error) {
    console.error("Update member error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function getCaregivers() {
  const supabase = await createSupabaseClient();

  try {
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "User not authenticated" };
    }

    // Get the user's ID from the users table
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("id")
      .eq("supabase_id", user.id)
      .single();

    if (userDataError || !userData) {
      return { error: "User data not found" };
    }

    // Get all caregivers for this user with access level
    const { data: caregiversData, error: caregiversError } = await supabase
      .from("user_caregivers")
      .select(`
        caregiver_id,
        access_level,
        caregivers (
          id,
          name,
          email,
          phone_number,
          role,
          notes,
          created_at
        )
      `)
      .eq("user_id", userData.id)
      .order("caregivers(name)");

    if (caregiversError) {
      console.error("Error loading caregivers:", caregiversError);
      return { error: "Failed to load caregivers" };
    }

    // Flatten the data structure
    const caregivers = caregiversData?.map(item => ({
      ...item.caregivers,
      access_level: item.access_level
    })) || [];

    return { success: true, data: caregivers };
  } catch (error) {
    console.error("Get caregivers error:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function addCaregiver(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" };
  }

  const name = formData.get("name");
  const email = formData.get("email");
  const phoneNumber = formData.get("phoneNumber");
  const countryCode = formData.get("countryCode");
  const role = formData.get("role") || "Caregiver";
  const accessLevel = formData.get("accessLevel") || "view";
  const notes = formData.get("notes") || "";

  // Validate required fields
  if (!name || !email || !phoneNumber || !countryCode) {
    return { error: "Name, email, and phone number are required" };
  }

  const supabase = await createSupabaseClient();

  try {
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "User not authenticated" };
    }

    // Get the user's ID from the users table
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("id")
      .eq("supabase_id", user.id)
      .single();

    if (userDataError || !userData) {
      return { error: "User data not found" };
    }

    // Format phone number with country code
    const formattedPhoneNumber = `${countryCode}_${phoneNumber}`;

    // Check if caregiver already exists
    const { data: existingCaregiver } = await supabase
      .from("caregivers")
      .select("id")
      .eq("email", email.toString())
      .single();

    let caregiverId;

    if (existingCaregiver) {
      // Caregiver already exists, just link to current user
      caregiverId = existingCaregiver.id;

      // Check if already linked
      const { data: existingLink } = await supabase
        .from("user_caregivers")
        .select("id")
        .eq("user_id", userData.id)
        .eq("caregiver_id", caregiverId)
        .single();

      if (existingLink) {
        return { error: "This caregiver is already in your list" };
      }
    } else {
      // Create new caregiver
      const { data: newCaregiver, error: insertError } = await supabase
        .from("caregivers")
        .insert({
          name: name.toString(),
          email: email.toString(),
          phone_number: formattedPhoneNumber,
          role: role.toString(),
          notes: notes.toString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert caregiver error details:", insertError);
        console.error("Insert caregiver error code:", insertError.code);
        console.error("Insert caregiver error message:", insertError.message);
        return { error: `Failed to add caregiver: ${insertError.message}` };
      }

      caregiverId = newCaregiver.id;
    }

    // Link caregiver to user
    const { error: linkError } = await supabase
      .from("user_caregivers")
      .insert({
        user_id: userData.id,
        caregiver_id: caregiverId,
        access_level: accessLevel.toString(),
        added_by: userData.id,
      });

    if (linkError) {
      console.error("Link caregiver error details:", linkError);
      console.error("Link caregiver error code:", linkError.code);
      console.error("Link caregiver error message:", linkError.message);
      return { error: `Failed to link caregiver: ${linkError.message}` };
    }

    return { success: "Caregiver added successfully!" };
  } catch (error) {
    console.error("Add caregiver error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function updateCaregiver(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" };
  }

  const caregiverId = formData.get("caregiverId");
  const name = formData.get("name");
  const email = formData.get("email");
  const phoneNumber = formData.get("phoneNumber");
  const countryCode = formData.get("countryCode");
  const role = formData.get("role");
  const accessLevel = formData.get("accessLevel");
  const notes = formData.get("notes");

  console.log('updateCaregiver received data:', {
    caregiverId,
    name,
    email,
    phoneNumber,
    countryCode,
    role,
    accessLevel,
    notes
  });

  // Validate required fields
  if (!caregiverId || !name || !email || !phoneNumber || !countryCode || !role) {
    return { error: "All fields are required" };
  }

  const supabase = await createSupabaseClient();

  try {
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "User not authenticated" };
    }

    // Get the user's ID and check access level
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("id")
      .eq("supabase_id", user.id)
      .single();

    if (userDataError || !userData) {
      return { error: "User data not found" };
    }

    // Check user has access to this caregiver (any access level allows editing your own caregiver relationships)
    const { data: accessData } = await supabase
      .from("user_caregivers")
      .select("access_level, added_by")
      .eq("user_id", userData.id)
      .eq("caregiver_id", parseInt(caregiverId.toString()))
      .single();

    if (!accessData) {
      return { error: "You don't have access to this caregiver" };
    }

    // Users can always edit caregivers they added, or if they have edit/admin access
    const canEdit = accessData.added_by === userData.id || ['edit', 'admin'].includes(accessData.access_level);
    
    if (!canEdit) {
      return { error: "You don't have permission to edit this caregiver" };
    }

    // Format phone number with country code
    const formattedPhoneNumber = `${countryCode}_${phoneNumber}`;

    // Update the caregiver
    const { error: updateError } = await supabase
      .from("caregivers")
      .update({
        name: name.toString(),
        email: email.toString(),
        phone_number: formattedPhoneNumber,
        role: role.toString(),
        notes: notes.toString(),
      })
      .eq("id", parseInt(caregiverId.toString()));

    if (updateError) {
      console.error("Update error:", updateError);
      return { error: "Failed to update caregiver. Please try again." };
    }

    // Update access level in user_caregivers table if provided
    if (accessLevel) {
      const { error: accessUpdateError } = await supabase
        .from("user_caregivers")
        .update({
          access_level: accessLevel.toString(),
        })
        .eq("user_id", userData.id)
        .eq("caregiver_id", parseInt(caregiverId.toString()));

      if (accessUpdateError) {
        console.error("Access level update error:", accessUpdateError);
        return { error: "Failed to update access level. Please try again." };
      }
    }

    return { success: "Caregiver updated successfully!" };
  } catch (error) {
    console.error("Update caregiver error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function addRecipient(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" };
  }

  const name = formData.get("name");
  const phoneNumber = formData.get("phoneNumber");
  const countryCode = formData.get("countryCode");
  const timezone = formData.get("timezone");

  // Validate required fields
  if (!name || !phoneNumber || !countryCode || !timezone) {
    return { error: "All fields are required" };
  }

  const supabase = await createSupabaseClient();

  try {
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "User not authenticated" };
    }

    // Get the user's ID from the users table
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("id")
      .eq("supabase_id", user.id)
      .single();

    if (userDataError || !userData) {
      return { error: "User data not found" };
    }

    // Format phone number with country code
    const formattedPhoneNumber = `${countryCode}_${phoneNumber}`;

    // Insert the new recipient
    const { error: insertError } = await supabase.from("parents").insert({
      name: name.toString(),
      phone_number: formattedPhoneNumber,
      timezone: timezone.toString(),
      user_id: userData.id,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return { error: "Failed to add recipient. Please try again." };
    }

    return { success: "Recipient added successfully!" };
  } catch (error) {
    console.error("Add recipient error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

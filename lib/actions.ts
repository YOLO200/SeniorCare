"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

  const supabase = createServerActionClient({ cookies });

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

  // Validate required fields
  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = createServerActionClient({ cookies });

  try {
    const { error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
    });

    if (error) {
      return { error: error.message };
    }

    return { success: "Check your email to confirm your account." };
  } catch (error) {
    console.error("Sign up error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function signUpWithGoogle() {
  const supabase = createServerActionClient({ cookies });

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
  const supabase = createServerActionClient({ cookies });

  await supabase.auth.signOut();
  redirect("/auth/login");
}

export async function signInWithGoogle() {
  const supabase = createServerActionClient({ cookies });

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

export async function sendMagicLink(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" };
  }

  const email = formData.get("email");
  if (!email) {
    return { error: "Email is required" };
  }

  const supabase = createServerActionClient({ cookies });

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.toString(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { success: "Magic link sent! Check your email to sign in." };
  } catch (error) {
    console.error("Magic link sign in error:", error);
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

  const supabase = createServerActionClient({ cookies });

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

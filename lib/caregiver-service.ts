import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Types for the caregiver service
interface AddCaregiverInput {
  name: string;
  email: string;
  phone_number: string;
  role?: string;
  user_id: number;
  access_level?: string;
}

interface CaregiverResult {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  role: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  access_level: string;
  added_by: number;
  added_at: string;
}

interface ServiceResponse {
  success: boolean;
  data?: CaregiverResult;
  error?: string;
}

// Helper function to create Supabase client
async function createSupabaseServiceClient() {
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
            // Ignore errors in Server Components
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // Ignore errors in Server Components
          }
        },
      },
    }
  );
}

/**
 * Adds a caregiver to the system and links them to a user
 * Handles both new caregivers and existing ones
 */
export async function addCaregiverService(input: AddCaregiverInput): Promise<ServiceResponse> {
  const {
    name,
    email,
    phone_number,
    role = "Caregiver",
    user_id,
    access_level = "view"
  } = input;

  // Validate required fields
  if (!name || !email || !phone_number || !user_id) {
    return {
      success: false,
      error: "Name, email, phone_number, and user_id are required"
    };
  }

  const supabase = await createSupabaseServiceClient();

  try {
    // Step 1: Check if caregiver already exists
    const { data: existingCaregiver, error: searchError } = await supabase
      .from("caregivers")
      .select("id")
      .eq("email", email)
      .single();

    if (searchError && searchError.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected if caregiver doesn't exist
      console.error("Error searching for existing caregiver:", searchError);
      return {
        success: false,
        error: "Error checking for existing caregiver"
      };
    }

    let caregiverId: number;

    if (existingCaregiver) {
      // Caregiver exists, use their ID
      caregiverId = existingCaregiver.id;
    } else {
      // Step 2: Create new caregiver if they don't exist
      const { data: newCaregiver, error: insertError } = await supabase
        .from("caregivers")
        .insert({
          name,
          email,
          phone_number,
          role,
          notes: null // Default to null for new caregivers
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating new caregiver:", insertError);
        return {
          success: false,
          error: `Failed to create caregiver: ${insertError.message}`
        };
      }

      caregiverId = newCaregiver.id;
    }

    // Step 3: Check if user-caregiver relationship already exists
    const { data: existingRelationship, error: relationshipSearchError } = await supabase
      .from("user_caregivers")
      .select("id")
      .eq("user_id", user_id)
      .eq("caregiver_id", caregiverId)
      .single();

    if (relationshipSearchError && relationshipSearchError.code !== "PGRST116") {
      console.error("Error checking existing relationship:", relationshipSearchError);
      return {
        success: false,
        error: "Error checking caregiver relationship"
      };
    }

    if (existingRelationship) {
      return {
        success: false,
        error: "This caregiver is already linked to your account"
      };
    }

    // Step 4: Create the user-caregiver relationship
    const { error: linkError } = await supabase
      .from("user_caregivers")
      .insert({
        user_id,
        caregiver_id: caregiverId,
        access_level,
        added_by: user_id
      });

    if (linkError) {
      console.error("Error linking caregiver to user:", linkError);
      return {
        success: false,
        error: `Failed to link caregiver: ${linkError.message}`
      };
    }

    // Step 5: Return the complete caregiver data with relationship info
    const { data: finalCaregiver, error: fetchError } = await supabase
      .from("caregivers")
      .select(`
        id,
        name,
        email,
        phone_number,
        role,
        notes,
        created_at,
        updated_at,
        user_caregivers!inner (
          access_level,
          added_by,
          added_at
        )
      `)
      .eq("id", caregiverId)
      .eq("user_caregivers.user_id", user_id)
      .single();

    if (fetchError) {
      console.error("Error fetching final caregiver data:", fetchError);
      return {
        success: false,
        error: "Caregiver added but failed to retrieve details"
      };
    }

    // Transform the data to match our expected format
    const result: CaregiverResult = {
      id: finalCaregiver.id,
      name: finalCaregiver.name,
      email: finalCaregiver.email,
      phone_number: finalCaregiver.phone_number,
      role: finalCaregiver.role,
      notes: finalCaregiver.notes,
      created_at: finalCaregiver.created_at,
      updated_at: finalCaregiver.updated_at,
      access_level: finalCaregiver.user_caregivers[0].access_level,
      added_by: finalCaregiver.user_caregivers[0].added_by,
      added_at: finalCaregiver.user_caregivers[0].added_at
    };

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error("Unexpected error in addCaregiverService:", error);
    return {
      success: false,
      error: "An unexpected error occurred"
    };
  }
}

/**
 * Wrapper function that matches the existing API pattern
 * This can be used as a drop-in replacement for the current addCaregiver function
 */
export async function addCaregiverFromFormData(prevState: any, formData: FormData) {
  const name = formData.get("name")?.toString();
  const email = formData.get("email")?.toString();
  const phoneNumber = formData.get("phoneNumber")?.toString();
  const countryCode = formData.get("countryCode")?.toString();
  const role = formData.get("role")?.toString() || "Caregiver";
  const accessLevel = formData.get("accessLevel")?.toString() || "view";

  if (!name || !email || !phoneNumber || !countryCode) {
    return { error: "Name, email, and phone number are required" };
  }

  // Get the current user's ID
  const supabase = await createSupabaseServiceClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: "User not authenticated" };
  }

  const { data: userData, error: userDataError } = await supabase
    .from("users")
    .select("id")
    .eq("supabase_id", user.id)
    .single();

  if (userDataError || !userData) {
    return { error: "User data not found" };
  }

  // Format phone number
  const formattedPhoneNumber = `${countryCode}_${phoneNumber}`;

  // Call the service function
  const result = await addCaregiverService({
    name,
    email,
    phone_number: formattedPhoneNumber,
    role,
    user_id: userData.id,
    access_level: accessLevel
  });

  if (result.success) {
    return { success: "Caregiver added successfully!" };
  } else {
    return { error: result.error };
  }
}
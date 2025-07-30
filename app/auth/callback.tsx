// app/auth/callback.tsx
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AuthCallbackPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500 text-lg">
          Unable to authenticate. Please try again.
        </p>
      </div>
    );
  }

  // Check if user profile exists, if not create one
  if (session.user) {
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("supabase_id", session.user.id)
      .single();

    if (!existingUser) {
      // Create user profile for OAuth users
      const { error: profileError } = await supabase.from("users").insert({
        supabase_id: session.user.id,
        first_name:
          session.user.user_metadata?.full_name?.split(" ")[0] || "User",
        last_name:
          session.user.user_metadata?.full_name
            ?.split(" ")
            .slice(1)
            .join(" ") || "",
        email: session.user.email || "",
        phone_number: "+1", // Default phone number placeholder
        timezone: "America/New_York", // Default timezone for OAuth users
      });

      if (profileError) {
        console.error("Profile creation error for OAuth user:", profileError);
      }
    }
  }

  redirect("/");
}

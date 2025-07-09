// app/auth/callback.tsx
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AuthCallbackPage() {
  const supabase = createServerComponentClient({ cookies });

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
      });

      if (profileError) {
        console.error("Profile creation error for OAuth user:", profileError);
      }
    }
  }

  redirect("/");
}

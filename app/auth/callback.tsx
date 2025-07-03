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

  redirect("/"); // or redirect("/dashboard") if you prefer
}

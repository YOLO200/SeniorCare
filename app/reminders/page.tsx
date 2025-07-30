"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RemindersRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard with reminders page
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#D8ECF8] to-[#E8DDFB]">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-violet-700">Redirecting...</h2>
      </div>
    </div>
  );
}
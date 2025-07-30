"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";
import AppLayout from "./AppLayout";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const router = useRouter();

  // Override router.push to use startTransition for smoother navigation
  const enhancedRouter = {
    ...router,
    push: (href: string) => {
      startTransition(() => {
        router.push(href);
      });
    }
  };

  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}
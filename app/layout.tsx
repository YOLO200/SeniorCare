import type React from "react";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Supabase Auth with SSR",
  description: "A Next.js application with Supabase authentication using SSR",
  generator: "v0.dev",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={geist.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

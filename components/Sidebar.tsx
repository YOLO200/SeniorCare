"use client";

import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Users,
  UserPlus,
  LogOut,
  LayoutDashboard,
  Watch,
  Brain,
  CreditCard,
  Settings,
  Bell,
  FileText,
  MessageSquare,
} from "lucide-react";
import { signOut } from "@/lib/actions";
interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  currentPage?: string;
  setCurrentPage?: (page: string) => void;
}

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  currentPage = "/",
  setCurrentPage,
}: SidebarProps) {
  const menuItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/" },
    { icon: Users, label: "Members", href: "/members" },
    { icon: UserPlus, label: "Caregivers", href: "/caregivers" },
    { icon: Bell, label: "Reminders", href: "/reminders" },
    { icon: MessageSquare, label: "Chatbot", href: "/chatbot" },
    { icon: FileText, label: "Logs", href: "/logs" },
    { icon: Watch, label: "Devices", href: "/devices" },
    { icon: Brain, label: "Cognitive AI Agent", href: "/cognitive-ai" },
    { icon: CreditCard, label: "Billing", href: "/billing" },
    { icon: Settings, label: "Profile Settings", href: "/settings" },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isSidebarOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-sm shadow-lg transform transition-transform duration-300 ease-in-out
        ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }
      `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-violet-700">CareAI</h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pb-4">
            <ul className="space-y-2">
              {menuItems.map((item, index) => (
                <li key={`nav-${index}-${item.href}`}>
                  <button
                    onClick={() => {
                      if (setCurrentPage) {
                        setCurrentPage(item.href);
                      }
                      setIsSidebarOpen(false); // Close mobile sidebar
                    }}
                    className={`w-full text-left flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                      currentPage === item.href
                        ? "bg-violet-100 text-violet-700 border-2 border-violet-300"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-800 border-2 border-transparent"
                    }`}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-slate-200">
            <form action={signOut}>
              <Button
                type="submit"
                variant="outline"
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
}

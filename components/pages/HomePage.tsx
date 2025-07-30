"use client";

import { 
  Users, 
  UserPlus, 
  Brain,
  Watch,
  CreditCard,
  Settings,
} from "lucide-react";

interface HomePageProps {
  setCurrentPage?: (page: string) => void;
}

export default function HomePage({ setCurrentPage }: HomePageProps) {
  return (
    <>
      {/* Header */}
      <div className="mb-8 mt-16 lg:mt-0">
        <h1 className="text-3xl font-bold text-slate-800">Welcome to CareAI</h1>
        <p className="text-slate-600 mt-2">Empowering families with smart elder care</p>
      </div>

      {/* Features Overview */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Active Features</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="border border-slate-200 rounded-lg p-4">
            <Users className="h-8 w-8 text-violet-600 mb-3" />
            <h3 className="font-semibold text-slate-800 mb-2">Members Management</h3>
            <p className="text-sm text-slate-600 mb-3">Track and manage care recipients</p>
            <button
              onClick={() => setCurrentPage && setCurrentPage('/members')}
              className="text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              View Members →
            </button>
          </div>
          <div className="border border-slate-200 rounded-lg p-4">
            <UserPlus className="h-8 w-8 text-violet-600 mb-3" />
            <h3 className="font-semibold text-slate-800 mb-2">Caregiver Profiles</h3>
            <p className="text-sm text-slate-600 mb-3">Manage caregiver access and profiles</p>
            <button
              onClick={() => setCurrentPage && setCurrentPage('/caregivers')}
              className="text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              View Caregivers →
            </button>
          </div>
          <div className="border border-slate-200 rounded-lg p-4">
            <Brain className="h-8 w-8 text-violet-600 mb-3" />
            <h3 className="font-semibold text-slate-800 mb-2">AI Assistant</h3>
            <p className="text-sm text-slate-600 mb-3">Cognitive support for care recipients</p>
            <button
              onClick={() => setCurrentPage && setCurrentPage('/cognitive-ai')}
              className="text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Features */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Upcoming Features</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="border border-slate-200 rounded-lg p-4">
            <Watch className="h-8 w-8 text-violet-600 mb-3" />
            <h3 className="font-semibold text-slate-800 mb-2">Wearables Integration</h3>
            <p className="text-sm text-slate-600">Connect WHOOP, Apple Watch, and other health devices</p>
          </div>
          <div className="border border-slate-200 rounded-lg p-4">
            <CreditCard className="h-8 w-8 text-violet-600 mb-3" />
            <h3 className="font-semibold text-slate-800 mb-2">Billing & Subscriptions</h3>
            <p className="text-sm text-slate-600">Manage your subscription and payment methods</p>
          </div>
          <div className="border border-slate-200 rounded-lg p-4">
            <Settings className="h-8 w-8 text-violet-600 mb-3" />
            <h3 className="font-semibold text-slate-800 mb-2">Advanced Settings</h3>
            <p className="text-sm text-slate-600">Customize your experience and preferences</p>
          </div>
        </div>
      </div>
    </>
  );
}
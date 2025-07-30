"use client";

import { useState } from "react";
import { User, Mail, Phone, MapPin, Shield, Edit2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      {/* Header */}
      <div className="mb-8 mt-16 lg:mt-0">
        <h1 className="text-3xl font-bold text-slate-800">Profile Settings</h1>
        <p className="text-slate-600 mt-2">Manage your account information and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Information */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-violet-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">User Profile</h2>
                <p className="text-slate-600">user@example.com</p>
              </div>
            </div>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="border-violet-300 text-violet-600 hover:bg-violet-50"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>

          {!isEditing ? (
            // Display Mode
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-slate-600 mb-1">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Name</span>
                </div>
                <p className="text-slate-800">Not provided</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-slate-600 mb-1">
                  <Mail className="h-4 w-4" />
                  <span className="font-medium">Email Address</span>
                </div>
                <p className="text-slate-800">user@example.com</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-slate-600 mb-1">
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">Phone Number</span>
                </div>
                <p className="text-slate-800">Not provided</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-slate-600 mb-1">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Timezone</span>
                </div>
                <p className="text-slate-800">Eastern Time (ET)</p>
              </div>
            </div>
          ) : (
            // Edit Mode
            <div className="space-y-6">
              <p className="text-slate-600">Edit mode placeholder - form fields would go here</p>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-violet-500 hover:bg-violet-600 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Account Security */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="h-6 w-6 text-slate-600" />
            <h3 className="text-xl font-bold text-slate-800">Account Security</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <h4 className="font-medium text-slate-800">Password</h4>
                <p className="text-sm text-slate-600">
                  Click to reset your password via email
                </p>
              </div>
              <Button 
                variant="outline"
                className="border-violet-300 text-violet-600 hover:bg-violet-50"
              >
                Change Password
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <h4 className="font-medium text-slate-800">Two-Factor Authentication</h4>
                <p className="text-sm text-slate-600">Add an extra layer of security</p>
              </div>
              <Button variant="outline" disabled>
                Setup 2FA
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
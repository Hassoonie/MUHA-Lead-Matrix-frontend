"use client";

import Card from "@/components/ui/Card";
import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function SettingsPage() {
  // Load settings from localStorage (per-user, per-browser)
  const [notifications, setNotifications] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user_notifications");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // Invalid JSON, use defaults
        }
      }
    }
    return {
      email: true,
      jobComplete: true,
      errors: true,
    };
  });

  const [exportSettings, setExportSettings] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user_export_settings");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // Invalid JSON, use defaults
        }
      }
    }
    return {
      autoExport: false,
      format: "csv",
    };
  });

  // Save notifications to localStorage when changed
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user_notifications", JSON.stringify(notifications));
    }
  }, [notifications]);

  // Save export settings to localStorage when changed
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user_export_settings", JSON.stringify(exportSettings));
    }
  }, [exportSettings]);



  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Settings</h1>
          <p className="text-black/70">Manage your preferences and configuration</p>
        </div>

        {/* Notification Settings */}
        <Card>
          <h2 className="text-xl font-semibold text-black mb-6">Notifications</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-black">
                  Email Notifications
                </label>
                <p className="text-xs text-black/50">
                  Receive email updates about your jobs
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                className="w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-black">
                  Job Completion Alerts
                </label>
                <p className="text-xs text-black/50">
                  Get notified when jobs complete
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.jobComplete}
                onChange={(e) => setNotifications({ ...notifications, jobComplete: e.target.checked })}
                className="w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-black">
                  Error Alerts
                </label>
                <p className="text-xs text-black/50">
                  Get notified when jobs fail
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.errors}
                onChange={(e) => setNotifications({ ...notifications, errors: e.target.checked })}
                className="w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        </Card>

        {/* Export Settings */}
        <Card>
          <h2 className="text-xl font-semibold text-black dark:text-white mb-6">Export Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-black dark:text-white">
                  Auto-Export on Completion
                </label>
                <p className="text-xs text-black/50 dark:text-white/50">
                  Automatically export CSV when jobs complete
                </p>
              </div>
              <input
                type="checkbox"
                checked={exportSettings.autoExport}
                onChange={(e) => setExportSettings({ ...exportSettings, autoExport: e.target.checked })}
                className="w-4 h-4 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black/70 dark:text-white/70 mb-2">
                Default Export Format
              </label>
              <Select
                value={exportSettings.format}
                onChange={(e) => setExportSettings({ ...exportSettings, format: e.target.value })}
                options={[
                  { value: "csv", label: "CSV" },
                  { value: "json", label: "JSON" },
                  { value: "excel", label: "Excel" },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Settings are automatically saved to your browser's local storage */}
        <div className="flex justify-end">
          <p className="text-xs text-black/50">
            Settings are automatically saved per browser
          </p>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

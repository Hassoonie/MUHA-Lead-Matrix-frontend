"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { adminApi, UserDetailedStats } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function UserDetailPage() {
  return (
    <ProtectedRoute>
      <UserDetailContent />
    </ProtectedRoute>
  );
}

function UserDetailContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { showSuccess, showError } = useToast();
  
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirect if not admin (use useEffect to avoid render-time navigation)
  useEffect(() => {
    if (user && !(user as any).is_admin) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Return null during render if not admin
  if (user && !(user as any).is_admin) {
    return null;
  }

  const { data: userStats, error } = useSWR(
    userId ? `admin-user-${userId}` : null,
    () => adminApi.getUserStats(userId),
    { refreshInterval: 30000 }
  );
  
  const handleRoleChange = async () => {
    if (!userStats) return;

    setIsUpdating(true);
    try {
      const newIsAdmin = !userStats.is_admin;
      await adminApi.updateUserRole(userId, newIsAdmin);

      // Refresh data
      mutate(`admin-user-${userId}`);
      setIsPromoteModalOpen(false);

      showSuccess(`User ${newIsAdmin ? 'promoted to admin' : 'demoted to user'} successfully!`);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to update user role');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userStats) return;

    setIsDeleting(true);
    try {
      await adminApi.deleteUser(userId);

      // Close modal and redirect to users list
      setIsDeleteModalOpen(false);
      router.push("/admin");

      showSuccess(`User ${userStats.email} has been deleted successfully`);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to delete user');
      setIsDeleting(false);
    }
  };

  if (!user || !(user as any).is_admin) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <div className="p-6 text-center text-red-600 dark:text-red-400">
              Error loading user data: {error.message}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-black dark:text-white">Loading...</div>
      </div>
    );
  }

  // Prepare pie chart data for success rate
  const successRateData = [
    {
      name: "Successful",
      value: userStats.successful_scrapes,
      color: "#10b981",
    },
    {
      name: "Failed",
      value: userStats.failed_scrapes,
      color: "#ef4444",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button
              variant="secondary"
              onClick={() => router.push("/admin")}
              className="mb-4"
            >
              ← Back to Users
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              User Details
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {userStats.email}
            </p>
          </div>
        </div>

        {/* User Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Leads
              </p>
              <p className="mt-2 text-3xl font-semibold text-blue-600 dark:text-blue-400">
                {userStats.total_leads.toLocaleString()}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Scrapes
              </p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                {userStats.total_scrapes}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {userStats.successful_scrapes} successful, {userStats.failed_scrapes}{" "}
                failed
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Success Rate
              </p>
              <p
                className={`mt-2 text-3xl font-semibold ${
                  userStats.success_rate >= 80
                    ? "text-green-600 dark:text-green-400"
                    : userStats.success_rate >= 50
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {userStats.success_rate.toFixed(1)}%
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Leads/Scrape
              </p>
              <p className="mt-2 text-3xl font-semibold text-purple-600 dark:text-purple-400">
                {userStats.avg_leads_per_scrape.toFixed(1)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Last active:{" "}
                {userStats.last_active
                  ? new Date(userStats.last_active).toLocaleDateString()
                  : "Never"}
              </p>
            </div>
          </Card>
        </div>

        {/* Role Management Card */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              User Role Management
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Current Role:{" "}
                  <span className="font-semibold">
                    {userStats.email === "hggarawi@gmail.com"
                      ? "Super Admin"
                      : userStats.is_admin
                      ? "Admin"
                      : "User"}
                  </span>
                </p>
                {userStats.email === "hggarawi@gmail.com" && (
                  <p className="text-xs text-gray-500">
                    Super admin role cannot be changed
                  </p>
                )}
              </div>
              {userStats.email !== "hggarawi@gmail.com" && (
                <Button
                  variant={userStats.is_admin ? "secondary" : "primary"}
                  onClick={() => setIsPromoteModalOpen(true)}
                >
                  {userStats.is_admin ? "Remove Admin" : "Promote to Admin"}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Leads Over Time Chart */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Leads Over Time (Last 30 Days)
              </h2>
              {userStats.leads_over_time.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userStats.leads_over_time}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => {
                        const d = new Date(date);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Leads"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </Card>

          {/* Success Rate Pie Chart */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Scrape Success Rate
              </h2>
              {userStats.total_scrapes > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={successRateData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {successRateData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No scrapes yet
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Scrapes Table */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Scrapes (Last 10)
            </h2>
            {userStats.recent_scrapes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Query
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Leads
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {userStats.recent_scrapes.map((scrape) => (
                      <tr key={scrape.run_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {new Date(scrape.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {scrape.query}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              scrape.status === "completed"
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                : scrape.status === "failed"
                                ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                                : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                            }`}
                          >
                            {scrape.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {scrape.leads_collected}
                          {scrape.target_leads ? ` / ${scrape.target_leads}` : ""}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {scrape.elapsed_time || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">No scrapes yet</div>
            )}
          </div>
        </Card>

        {/* Danger Zone - Delete User */}
        {userStats.email !== "hggarawi@gmail.com" && (
          <div className="mt-12 mb-8">
            <Card className="border-2 border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-gray-900 shadow-lg">
              <div className="p-8">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30">
                        <span className="text-2xl">⚠️</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">
                          Danger Zone
                        </h2>
                        <p className="text-sm text-red-600 dark:text-red-500 font-medium">
                          Irreversible actions
                        </p>
                      </div>
                    </div>
                    <div className="ml-15 space-y-4">
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-5 border border-red-200 dark:border-red-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Delete User Account
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Permanently remove <span className="font-semibold text-gray-900 dark:text-white">{userStats.email}</span> from the system. 
                          This will delete the user account from the database. This action cannot be undone.
                        </p>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="secondary"
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="bg-red-600 hover:bg-red-700 text-white border-red-700 font-semibold px-6 py-2 shadow-md hover:shadow-lg transition-all"
                          >
                            🗑️ Delete User Permanently
                          </Button>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            This action requires confirmation
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Role Change Confirmation Modal */}
        <Modal
          isOpen={isPromoteModalOpen}
          onClose={() => setIsPromoteModalOpen(false)}
          title={
            userStats.is_admin
              ? "Remove Admin Privileges?"
              : "Promote to Admin?"
          }
        >
          <div className="p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {userStats.is_admin
                ? `Remove admin privileges from ${userStats.email}? They will lose access to the admin dashboard.`
                : `Grant admin privileges to ${userStats.email}? They will be able to view system stats and all user data.`}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setIsPromoteModalOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleRoleChange}
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Confirm"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete User Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
          title="⚠️ Delete User?"
        >
          <div className="p-6">
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Are you sure you want to permanently delete this user?
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-900 dark:text-red-300 mb-1">
                  {userStats.email}
                </p>
                <p className="text-xs text-red-700 dark:text-red-400">
                  This will delete the user account from the database. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? "Deleting..." : "Delete User"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, UserMetrics, SystemStats } from "@/lib/api";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}

function AdminDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "last_active", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");

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

  // Fetch system stats
  const { data: stats, error: statsError } = useSWR(
    "admin-stats",
    adminApi.getSystemStats,
    {
      refreshInterval: 30000, // Refresh every 30s
    }
  );

  // Fetch all users
  const { data: users, error: usersError } = useSWR(
    "admin-users",
    adminApi.getAllUsers,
    {
      refreshInterval: 30000,
    }
  );

  // Table columns
  const columnHelper = createColumnHelper<UserMetrics>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("email", {
        header: "Email",
        cell: (info) => (
          <div className="font-medium text-gray-900 dark:text-white">
            {info.getValue()}
            {info.row.original.is_admin && (
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                Admin
              </span>
            )}
          </div>
        ),
      }),
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => (
          <span className="text-gray-700 dark:text-gray-300">
            {info.getValue() || "-"}
          </span>
        ),
      }),
      columnHelper.accessor("total_leads", {
        header: "Total Leads",
        cell: (info) => (
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {info.getValue().toLocaleString()}
          </span>
        ),
      }),
      columnHelper.accessor("total_scrapes", {
        header: "Total Scrapes",
        cell: (info) => (
          <span className="text-gray-700 dark:text-gray-300">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("success_rate", {
        header: "Success Rate",
        cell: (info) => {
          const rate = info.getValue();
          const color =
            rate >= 80
              ? "text-green-600 dark:text-green-400"
              : rate >= 50
              ? "text-yellow-600 dark:text-yellow-400"
              : "text-red-600 dark:text-red-400";
          return <span className={`font-medium ${color}`}>{rate.toFixed(1)}%</span>;
        },
      }),
      columnHelper.accessor("last_active", {
        header: "Last Active",
        cell: (info) => {
          const date = info.getValue();
          if (!date) return <span className="text-gray-500">Never</span>;
          return (
            <span className="text-gray-600 dark:text-gray-400">
              {new Date(date).toLocaleDateString()}
            </span>
          );
        },
      }),
    ],
    [columnHelper]
  );

  const table = useReactTable({
    data: users || [],
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-black dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!(user as any).is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            System overview and user management
          </p>
        </div>

        {/* System Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Users
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                      {stats.total_users}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <svg
                      className="w-6 h-6 text-blue-600 dark:text-blue-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Leads
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                      {stats.total_leads.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                    <svg
                      className="w-6 h-6 text-green-600 dark:text-green-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Scrapes
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                      {stats.total_scrapes}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <svg
                      className="w-6 h-6 text-purple-600 dark:text-purple-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Active Today
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                      {stats.active_users_today}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      {stats.total_scrapes_today} scrapes,{" "}
                      {stats.total_leads_today.toLocaleString()} leads
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-full ${
                      stats.system_health === "healthy"
                        ? "bg-green-100 dark:bg-green-900"
                        : stats.system_health === "warning"
                        ? "bg-yellow-100 dark:bg-yellow-900"
                        : "bg-red-100 dark:bg-red-900"
                    }`}
                  >
                    <svg
                      className={`w-6 h-6 ${
                        stats.system_health === "healthy"
                          ? "text-green-600 dark:text-green-300"
                          : stats.system_health === "warning"
                          ? "text-yellow-600 dark:text-yellow-300"
                          : "text-red-600 dark:text-red-300"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* User List */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                All Users
              </h2>
              <div className="w-64">
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                />
              </div>
            </div>

            {usersError && (
              <div className="text-red-600 dark:text-red-400 mb-4">
                Error loading users: {usersError.message}
              </div>
            )}

            {!users ? (
              <div className="text-center py-12 text-gray-500">Loading users...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div className="flex items-center space-x-1">
                              <span>
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </span>
                              <span>
                                {{
                                  asc: " ↑",
                                  desc: " ↓",
                                }[header.column.getIsSorted() as string] ?? null}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        onClick={() =>
                          router.push(`/admin/users/${row.original.user_id}`)
                        }
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-6 py-4 whitespace-nowrap text-sm"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {table.getRowModel().rows.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

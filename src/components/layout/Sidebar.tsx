"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Build navigation items - add admin link if user is admin
  const navItems = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/dashboard", label: "My Scrapes", icon: "📋" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
    // Conditionally add admin link - only for verified admins
    ...((user as any)?.is_admin === true
      ? [{ href: "/admin", label: "Admin", icon: "🛡️" }]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobileOpen) {
      onMobileClose();
    }
  }, [pathname]);

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity animate-fade-in"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white dark:bg-black border-r-2 border-gray-200 dark:border-gray-800 z-50 transition-transform duration-300 ease-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } w-[280px] md:w-[280px] flex flex-col`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b-2 border-gray-200 dark:border-gray-800">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image
              src="/logo/muha-meds-logo.png"
              alt="Muha Meds"
              width={80}
              height={80}
              className="object-contain"
            />
            <Image
              src="/logo/logo.webp"
              alt="Dialed Moods"
              width={120}
              height={120}
              className="object-contain"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                      active
                        ? "bg-gray-100 dark:bg-[#1a1a1a] text-black dark:text-[#c5b26f] font-semibold shadow-sm"
                        : "text-black dark:text-[#c5b26f] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] hover:text-black dark:hover:text-[#c5b26f]"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="tracking-wide-label uppercase">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t-2 border-gray-200 dark:border-gray-800">
          {user && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-[#c5b26f]/70 uppercase tracking-wide">
                  Logged In As
                </p>
                {(user as any).is_admin && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-[#c5b26f]">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-[#c5b26f] truncate mb-1">
                {user.name || "User"}
              </p>
              <p className="text-xs text-gray-600 dark:text-[#c5b26f]/70 truncate">
                {user.email}
              </p>
            </div>
          )}
          <Button
            onClick={logout}
            variant="outline"
            className="w-full text-sm border-gray-200 dark:border-gray-800 text-black dark:text-[#c5b26f] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
          >
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}

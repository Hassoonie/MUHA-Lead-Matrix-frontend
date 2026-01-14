"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  
  // Don't show sidebar on login/signup pages
  const showSidebar = isAuthenticated && !pathname?.includes("/login") && !pathname?.includes("/signup");

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      <div className="flex flex-1">
        {showSidebar && (
          <Sidebar
            isMobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Mobile menu button */}
        {showSidebar && (
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="fixed top-4 left-4 z-40 md:hidden p-2 bg-black dark:bg-[#c5b26f] text-white dark:text-black rounded-lg hover:bg-[#c5b26f] dark:hover:bg-[#c5b26f]/90 transition-colors"
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}

        {/* Main content */}
        <main className={`flex-1 ${showSidebar ? "md:ml-[280px]" : ""} min-h-screen flex flex-col`}>
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </main>
      </div>
      <ThemeToggle />
    </div>
  );
}

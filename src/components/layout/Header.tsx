"use client";

import Link from "next/link";
import { useState } from "react";
import Drawer from "./Drawer";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/campaigns", label: "Campaigns" },
    { href: "/analytics", label: "Analytics" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 text-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <span className="font-medium text-lg text-black">Lead Scraper</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium tracking-wide-label uppercase hover:opacity-70 transition-opacity"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-2 hover:opacity-70 transition-opacity"
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
          </div>
        </div>
      </header>

      {/* Drawer */}
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} navItems={navItems} />
    </>
  );
}

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: ReactNode;
  variant?: "success" | "warning" | "error" | "info" | "default" | "gold";
  className?: string;
}

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-[#f0f5fa] dark:bg-[#1a1a1a] text-black dark:text-[#c5b26f]",
    success: "bg-[#c5b26f] text-black",
    warning: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
    error: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
    info: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
    gold: "bg-[#c5b26f] text-black font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

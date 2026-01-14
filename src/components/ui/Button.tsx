import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "gold";
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  const baseClasses = "px-5 py-3 rounded-[10px] font-medium text-sm tracking-wide-label uppercase transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-black dark:bg-[#c5b26f] text-white dark:text-black hover:bg-[#c5b26f] dark:hover:bg-[#c5b26f]/90 hover:text-black dark:hover:text-black hover:scale-[1.02] active:scale-[0.98]",
    secondary: "bg-white dark:bg-[#0a0a0a] text-black dark:text-[#c5b26f] border border-gray-200 dark:border-gray-800 hover:border-[#c5b26f] dark:hover:border-[#c5b26f] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
    outline: "bg-transparent text-black dark:text-[#c5b26f] border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-[#c5b26f] hover:bg-black dark:hover:bg-[#c5b26f] hover:text-white dark:hover:text-black",
    gold: "bg-[#c5b26f] text-black hover:bg-[#c5b26f]/90 hover:scale-[1.02] active:scale-[0.98] font-semibold",
  };

  return (
    <button
      className={cn(baseClasses, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

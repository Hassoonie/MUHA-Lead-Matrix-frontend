import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export default function Card({ children, className, hover = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-[#0a0a0a] rounded-[10px] border border-gray-200 dark:border-gray-800 p-6 transition-all duration-150",
        hover && "hover:border-[#c5b26f]/30 dark:hover:border-[#c5b26f]/50 hover:shadow-sm dark:hover:shadow-[#c5b26f]/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

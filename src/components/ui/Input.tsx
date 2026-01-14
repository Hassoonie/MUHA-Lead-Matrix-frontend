import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-black dark:text-[#c5b26f] mb-2 tracking-wide-label uppercase">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full px-4 py-3 rounded-[10px] border border-[#f0f5fa] dark:border-gray-800 bg-white dark:bg-[#0a0a0a] text-black dark:text-[#c5b26f]",
          "focus:outline-none focus:ring-2 focus:ring-[#c5b26f]/30 dark:focus:ring-[#c5b26f]/50 focus:border-[#c5b26f]",
          "transition-all duration-150",
          "placeholder:text-black/40 dark:placeholder:text-[#c5b26f]/50",
          className
        )}
        {...props}
      />
    </div>
  );
}

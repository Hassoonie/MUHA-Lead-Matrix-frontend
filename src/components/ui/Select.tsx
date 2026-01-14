import { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export default function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-black dark:text-[#c5b26f] mb-2 tracking-wide-label uppercase">
          {label}
        </label>
      )}
      <select
        className={cn(
          "w-full px-4 py-3 rounded-[10px] border border-[#f0f5fa] dark:border-gray-800 bg-white dark:bg-[#0a0a0a] text-black dark:text-[#c5b26f]",
          "focus:outline-none focus:ring-2 focus:ring-[#c5b26f]/30 dark:focus:ring-[#c5b26f]/50 focus:border-[#c5b26f]",
          "transition-all duration-150",
          "appearance-none cursor-pointer",
          "bg-[url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 12 12\"%3E%3Cpath fill=\"%23000\" d=\"M6 9L1 4h10z\"/%3E%3C/svg%3E')] dark:bg-[url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 12 12\"%3E%3Cpath fill=\"%23c5b26f\" d=\"M6 9L1 4h10z\"/%3E%3C/svg%3E')] bg-no-repeat bg-[right:12px_center] pr-10",
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-white dark:bg-[#0a0a0a] text-black dark:text-[#c5b26f]">
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

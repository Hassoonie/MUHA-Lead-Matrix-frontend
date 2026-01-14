import { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-black dark:text-[#c5b26f] mb-2 tracking-wide-label uppercase">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full px-4 py-3 rounded-[10px] border border-[#f0f5fa] dark:border-[#c5b26f]/30 bg-white dark:bg-[#000000] text-black dark:text-[#c5b26f]",
          "focus:outline-none focus:ring-2 focus:ring-[#c5b26f]/30 focus:border-[#c5b26f]",
          "transition-all duration-150 resize-y min-h-[100px]",
          "placeholder:text-black/40 dark:placeholder:text-[#c5b26f]/50",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-[#c5b26f]">{error}</p>
      )}
    </div>
  );
}

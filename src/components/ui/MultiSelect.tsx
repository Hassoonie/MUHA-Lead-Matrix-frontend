"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export default function MultiSelect({
  label,
  options,
  value,
  onChange,
  disabled = false,
  error,
  className
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleOption = (optionValue: string) => {
    if (disabled) return;
    
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const selectedLabels = options
    .filter(opt => value.includes(opt.value))
    .map(opt => opt.label);

  const displayText = value.length === 0
    ? "Select users..."
    : value.length === 1
    ? selectedLabels[0]
    : `${value.length} users selected`;

  return (
    <div className={cn("w-full", className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-black dark:text-[#c5b26f] mb-2 tracking-wide-label uppercase">
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-3 rounded-[10px] border border-[#f0f5fa] dark:border-[#c5b26f]/30",
            "bg-white dark:bg-[#000000] text-black dark:text-[#c5b26f]",
            "focus:outline-none focus:ring-2 focus:ring-[#c5b26f]/30 focus:border-[#c5b26f]",
            "transition-all duration-150",
            "text-left flex items-center justify-between",
            "appearance-none cursor-pointer",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className={cn(
            "truncate",
            value.length === 0 && "text-black/40 dark:text-[#c5b26f]/50"
          )}>
            {displayText}
          </span>
          <svg
            className={cn(
              "w-4 h-4 transition-transform",
              isOpen && "rotate-180"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#000000] border border-[#f0f5fa] dark:border-[#c5b26f]/30 rounded-[10px] shadow-lg max-h-60 overflow-auto">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-black/60 dark:text-[#c5b26f]/70">
                No options available
              </div>
            ) : (
              options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className={cn(
                      "flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors",
                      isSelected && "bg-[#c5b26f]/10 dark:bg-[#c5b26f]/10"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOption(option.value)}
                      className="w-4 h-4 text-[#c5b26f] border-gray-300 rounded focus:ring-[#c5b26f] focus:ring-2 cursor-pointer"
                    />
                    <span className="ml-3 text-sm text-black dark:text-[#c5b26f]">
                      {option.label}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        )}
      </div>

      {value.length > 0 && (
        <p className="text-xs text-black/60 dark:text-[#c5b26f]/70 mt-2">
          {value.length} {value.length === 1 ? "user" : "users"} selected
        </p>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-[#c5b26f]">{error}</p>
      )}
    </div>
  );
}

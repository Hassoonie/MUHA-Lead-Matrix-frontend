"use client";

interface ProgressBarProps {
  progress: number;
  className?: string;
}

export default function ProgressBar({ progress, className = "" }: ProgressBarProps) {
  return (
    <div className={`w-full bg-[#f0f5fa] rounded-full h-3 overflow-hidden ${className}`}>
      <div
        className="h-full bg-[#c5b26f] transition-all duration-500 ease-out rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}

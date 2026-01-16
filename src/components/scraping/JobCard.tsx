"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProgressBar from "./ProgressBar";
import { JobSummary } from "@/lib/api";
import Link from "next/link";
import Button from "@/components/ui/Button";

interface JobCardProps {
  job: JobSummary;
  onDelete?: (jobId: string) => void;
  isSelected?: boolean;
  onSelect?: (jobId: string, selected: boolean) => void;
}

export default function JobCard({ job, onDelete, isSelected = false, onSelect }: JobCardProps) {
  const canViewResults = job.status === "completed" || job.status === "running" || job.status === "pending";
  const isActive = job.status === "running" || job.status === "pending";
  const [animatedDots, setAnimatedDots] = useState(1);

  useEffect(() => {
    if (!isActive) {
      setAnimatedDots(1);
      return;
    }
    const interval = setInterval(() => {
      setAnimatedDots((prev) => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [isActive]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "failed":
        return "error";
      case "running":
        return "info";
      case "cancelled":
        return "warning";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatDateTime = (dateString: string) => {
    // Parse the ISO date string
    // Pydantic serializes datetime as ISO string, often without 'Z' suffix
    // We need to ensure proper UTC parsing if no timezone is specified
    let date: Date;
    
    // Check if string already has timezone indicator
    if (dateString.endsWith('Z') || dateString.match(/[+-]\d{2}:\d{2}$/)) {
      // Has timezone indicator (Z or +/-offset), parse as-is
      date = new Date(dateString);
    } else {
      // No timezone indicator - assume UTC and append 'Z' for proper parsing
      date = new Date(dateString + 'Z');
    }
    
    // Format in user's local timezone (no timezone name to keep it clean)
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Card className={`animate-pop-in ${isSelected ? 'ring-2 ring-[#c5b26f]' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 flex items-start gap-3">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(job.job_id, e.target.checked)}
              className="mt-1 w-4 h-4 cursor-pointer"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-black dark:text-white">
              {formatDate(job.created_at)} {job.niche || 'General'}
            </h3>
              <Badge variant={getStatusVariant(job.status)}>
                {job.status}
              </Badge>
            </div>
            {isActive && (
              <p className="text-xs text-black/60 dark:text-white/60">
                Running, generating leads
                {".".repeat(animatedDots)}
              </p>
            )}
          </div>
        </div>
        {onDelete && job.status !== "running" && (
          <button
            onClick={() => onDelete(job.job_id)}
            className="text-gray-400 hover:text-red-600 transition-colors"
            aria-label="Delete job"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-black/70 dark:text-white/70">Queries</span>
          <p className="font-semibold text-black dark:text-white">
            {job.queries_completed} / {job.queries_total}
          </p>
        </div>
        <div>
          <span className="text-black/70 dark:text-white/70">Leads</span>
          <p className="font-semibold text-black dark:text-white">
            {job.total_leads}{job.target_leads ? ` / ${job.target_leads}` : ""}
          </p>
        </div>
      </div>

      {canViewResults && (
        <>
          {(job.csv_downloaded || (job.ghl_uploads && job.ghl_uploads.length > 0)) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 mb-4">
              <p className="text-sm font-semibold text-black/70 dark:text-white/70 mb-2">Actions</p>
              {job.csv_downloaded && (
                <div className="text-xs text-black/60 dark:text-white/60 mb-1">
                  ✓ CSV Downloaded {job.csv_downloaded_at ? `on ${formatDateTime(job.csv_downloaded_at)}` : ''}
                </div>
              )}
              {job.ghl_uploads && job.ghl_uploads.length > 0 && (
                <div className="space-y-1">
                  {job.ghl_uploads.map((upload: any, idx: number) => (
                    <div key={idx} className="text-xs text-black/60 dark:text-white/60">
                      ✓ GHL Uploaded to {upload.location_id}
                      {upload.assigned_to && ` (Assigned to: ${upload.assigned_to})`}
                      {upload.uploaded_at && ` on ${formatDateTime(upload.uploaded_at)}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <Link href={`/scrape/${job.job_id}`}>
            <Button variant="primary" className="w-full">
              View Results
            </Button>
          </Link>
        </>
      )}

      {job.error_message && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{job.error_message}</p>
        </div>
      )}
    </Card>
  );
}

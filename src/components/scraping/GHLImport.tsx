"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { ghlApi, GHLImportRequest } from "@/lib/api";
import { Lead } from "@/lib/api";

interface GHLImportProps {
  jobId: string;
  leads: Lead[];
  selectedLeadIndices: number[];
}

export default function GHLImport({ jobId, leads, selectedLeadIndices }: GHLImportProps) {
  const [locationId, setLocationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [importMode, setImportMode] = useState<"api" | "csv">("csv");

  const selectedLeads = selectedLeadIndices.map(idx => leads[idx]).filter(Boolean);
  const leadCount = selectedLeadIndices.length > 0 ? selectedLeadIndices.length : leads.length;

  const handleImport = async () => {
    if (!locationId.trim()) {
      setError("Please enter a GHL Location ID");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const request: GHLImportRequest = {
        job_id: jobId,
        lead_ids: selectedLeadIndices.length > 0 ? selectedLeadIndices.map(String) : undefined,
        location_id: locationId.trim(),
      };

      const response = await ghlApi.import(request);

      if (response.success) {
        setSuccess(true);
        if (response.csv_url) {
          // If CSV mode, trigger download
          window.open(response.csv_url, "_blank");
        }
      } else {
        setError(response.message || "Import failed");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Failed to import to GHL";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      setLoading(true);
      setError("");
      // For CSV fallback, we'll use the existing download endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/scrape/${jobId}/download`);
      if (!response.ok) {
        throw new Error("Download failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ghl_import_${jobId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess(true);
    } catch (err) {
      setError("Failed to download CSV");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="text-xl font-semibold text-black mb-6">Import to GoHighLevel</h2>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">
            {importMode === "api" 
              ? "Leads imported successfully to GoHighLevel!" 
              : "CSV file downloaded. You can now import it manually to GoHighLevel."}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-sm text-black/70 mb-2">
            Selected Leads: <span className="font-semibold text-black">{leadCount}</span>
            {selectedLeadIndices.length === 0 && " (All leads)"}
          </p>
        </div>

        <Input
          type="text"
          label="GHL Location ID"
          placeholder="Enter your GoHighLevel Location ID"
          value={locationId}
          onChange={(e) => {
            setLocationId(e.target.value);
            setError("");
          }}
          disabled={loading}
        />

        <p className="text-xs text-black/60">
          You can find your Location ID in GoHighLevel Settings → Integrations → API
        </p>

        <div className="flex gap-4 pt-4">
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={loading || !locationId.trim()}
            className="flex-1"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importing...
              </span>
            ) : (
              "Import to GHL"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadCSV}
            disabled={loading}
          >
            Download CSV
          </Button>
        </div>
      </div>
    </Card>
  );
}

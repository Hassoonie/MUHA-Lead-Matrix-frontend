"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import MultiSelect from "@/components/ui/MultiSelect";
import Card from "@/components/ui/Card";
import { ghlApi, GHLImportRequest, GHLLocation, GHLUser } from "@/lib/api";
import { Lead } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface GHLImportFormProps {
  jobId: string;
  leads: Lead[];
  selectedLeadIndices: number[];
  onClose?: () => void;
  onImport?: (ghlConfig: GHLImportRequest) => Promise<void>;
  isLoading?: boolean;
}

export default function GHLImportForm({ jobId, leads, selectedLeadIndices, onClose, onImport, isLoading = false }: GHLImportFormProps) {
  const { user } = useAuth();
  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [locationId, setLocationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locations, setLocations] = useState<GHLLocation[]>([]);
  const [users, setUsers] = useState<Record<string, GHLUser[]>>({});
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [selectedLocationName, setSelectedLocationName] = useState("");

  // Fetch GHL locations and users on mount (GHL is always connected globally via backend)
  useEffect(() => {
    const fetchGHLData = async () => {
      try {
        setLoadingLocations(true);
        // GHL is always connected globally - just fetch locations and users
        const status = await ghlApi.getConnectionStatus();
        // Always use locations and users from response (even if connected=false, backend still provides data)
        setLocations(status.locations || []);
        setUsers(status.users || {});
      } catch (err) {
        console.error("Failed to fetch GHL data:", err);
        // On error, still allow form to work - locations will be empty but user can still try
        setLocations([]);
        setUsers({});
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchGHLData();
  }, []);

  // Update location name when location changes
  useEffect(() => {
    if (locations.length > 0 && locationId) {
      const location = locations.find(loc => loc.id === locationId);
      setSelectedLocationName(location?.name || "");
    } else {
      setSelectedLocationName("");
    }
    // Reset assigned users when location changes
    setAssignedUsers([]);
  }, [locationId, locations]);

  // Auto-select user for sales reps when location is selected
  useEffect(() => {
    if (locationId && user && user.is_admin !== true && assignedUsers.length === 0) {
      const locationUsers = users[locationId] || [];
      const matchingUser = locationUsers.find(ghlUser => 
        ghlUser.email?.toLowerCase() === user.email?.toLowerCase()
      );
      if (matchingUser) {
        setAssignedUsers([matchingUser.id]);
      }
    }
  }, [locationId, users, user, assignedUsers.length]);

  // Build location options from API - sort to show Muha Meds and Dialed Moods first
  const locationOptions = (() => {
    const options = [
      { value: "", label: "Select location..." }
    ];
    
    // Sort locations: Muha Meds and Dialed Moods first, then others
    const sortedLocations = [...locations].sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Muha Meds first
      if (aName.includes("muha") && aName.includes("med")) return -1;
      if (bName.includes("muha") && bName.includes("med")) return 1;
      
      // Dialed Moods second
      if (aName.includes("dialed") && aName.includes("mood")) return -1;
      if (bName.includes("dialed") && bName.includes("mood")) return 1;
      
      return a.name.localeCompare(b.name);
    });
    
    options.push(...sortedLocations.map(loc => ({
      value: loc.id,
      label: loc.name
    })));
    
    return options;
  })();

  // Build user options based on selected location
  const userOptions = (() => {
    if (!locationId) {
      return [{ value: "", label: "Select a location first..." }];
    }
    const locationUsers = users[locationId] || [];
    if (locationUsers.length === 0) {
      return [{ value: "", label: "No users available for this location" }];
    }
    
    // Filter users based on admin status
    let filteredUsers = locationUsers;
    if (user && user.is_admin !== true) {
      // Sales rep: only show themselves (match by email)
      filteredUsers = locationUsers.filter(ghlUser => 
        ghlUser.email?.toLowerCase() === user.email?.toLowerCase()
      );
      
      if (filteredUsers.length === 0) {
        return [{ 
          value: "", 
          label: "No matching user found. Please contact an admin." 
        }];
      }
    }
    
    // Add "nobody" option first, then filtered users
    return [
      { value: "nobody", label: "Nobody (No assignment)" },
      ...filteredUsers.map(ghlUser => ({
        value: ghlUser.id,
        label: ghlUser.name || `${ghlUser.firstName || ""} ${ghlUser.lastName || ""}`.trim() || ghlUser.email || ghlUser.id
      }))
    ];
  })();

  const selectedLeads = selectedLeadIndices.length > 0 
    ? selectedLeadIndices.map(idx => leads[idx]).filter(Boolean)
    : leads;
  const leadCount = selectedLeadIndices.length > 0 ? selectedLeadIndices.length : (leads?.length || 0);

  const handleImport = async () => {
    if (!locationId || locationId === "") {
      setError("Please select a GHL Location ID");
      return;
    }

    if (!assignedUsers || assignedUsers.length === 0) {
      setError("Please select at least one user or 'Nobody' to import leads");
      return;
    }
    
    // "nobody" is a valid selection (means no assignment)
    // If only "nobody" is selected, that's fine - leads will be imported without assignment

    setLoading(true);
    setError("");

    try {
      // Parse tags from comma-separated string
      const tagsArray = tags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Filter out "nobody" option - if only "nobody" is selected, send empty array
      const userIds = assignedUsers.filter(id => id !== "nobody");
      
      const request: GHLImportRequest = {
        job_id: jobId,
        lead_ids: selectedLeadIndices.length > 0 ? selectedLeadIndices.map(String) : undefined,
        location_id: locationId.trim(),
        assigned_to: userIds.length > 0 ? userIds : undefined, // Empty array means no assignment
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        notes: notes.trim() || undefined,
      };

      // If onImport callback is provided, use it (for bulk operations)
      // Otherwise, use the default import flow
      let response;
      if (onImport) {
        await onImport(request);
        response = { success: true, message: "Import successful" };
      } else {
        response = await ghlApi.import(request);
      }

      if (response.success) {
        setError("");
        // Trigger success modal via parent component
        if (onClose) {
          onClose(); // This will trigger handleImportSuccess in parent
        }
        
        if (response.csv_url) {
          // If CSV mode, trigger download
          const fullUrl = response.csv_url.startsWith('http') 
            ? response.csv_url 
            : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${response.csv_url}`;
          window.open(fullUrl, "_blank");
        }
      } else {
        setError(response.message || "Import failed");
      }
    } catch (err: any) {
      console.error("[GHL Import] Error:", err);
      // Check if it's a partial success (some leads imported, some duplicates)
      // If the error mentions success count, treat it as success
      const errorMessage = err.response?.data?.detail || err.message || "Failed to import to GHL";
      
      // If any leads were imported (even with duplicates), show success
      if (errorMessage.includes("imported") || errorMessage.includes("success")) {
        // Trigger success modal via parent component
        if (onClose) {
          onClose(); // This will trigger handleImportSuccess in parent
        }
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      setLoading(true);
      setError("");
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
    } catch (err) {
      setError("Failed to download CSV");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div>
        <h2 className="text-xl font-semibold text-black mb-6">Import to GoHighLevel</h2>

      {/* Loading locations */}
      {loadingLocations && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">Loading GHL locations...</p>
        </div>
      )}

      {isLoading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm text-blue-800 font-medium">Loading leads...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Selected Leads Count */}
        <div>
          <p className="text-sm text-black/70 mb-2">
            Leads to Import: <span className="font-semibold text-black">{leadCount}</span>
            {selectedLeadIndices.length === 0 && leadCount > 0 && " (All leads)"}
            {leadCount === 0 && !isLoading && (
              <span className="text-red-600 ml-2">(No leads available)</span>
            )}
          </p>
        </div>

        {/* GHL Location Selection - Where to import leads */}
        <Select
          label="Where do you want to import the leads?"
          value={locationId}
          onChange={(e) => {
            setLocationId(e.target.value);
            setError("");
          }}
          disabled={loading || loadingLocations}
          required
          options={locationOptions}
        />
        {selectedLocationName && (
          <p className="text-xs text-black/60 -mt-4">
            Selected: <span className="font-medium">{selectedLocationName}</span>
          </p>
        )}

        {/* Who do you want to import leads for? (User assignment - Required) */}
        {locationId && (
          <MultiSelect
            label="Who do you want to import leads for?"
            value={assignedUsers}
            onChange={(values) => {
              // Handle "nobody" option - if selected, clear all other selections
              if (values.includes("nobody")) {
                setAssignedUsers(["nobody"]);
              } else {
                // If a real user is selected, remove "nobody" if it was there
                setAssignedUsers(values.filter(v => v !== "nobody"));
              }
              setError("");
            }}
            disabled={loading}
            options={userOptions}
          />
        )}

        {/* What do you want to tag the leads? */}
        <Input
          type="text"
          label="What do you want to tag the leads?"
          placeholder="e.g., new-leads, qualified, warm"
          value={tags}
          onChange={(e) => {
            setTags(e.target.value);
            setError("");
          }}
          disabled={loading}
        />
        <p className="text-xs text-black/60 -mt-4">
          Separate multiple tags with commas
        </p>

        {/* Do you want to put any notes on the leads? */}
        <Textarea
          label="Do you want to put any notes on the leads?"
          placeholder="Optional notes for these leads..."
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setError("");
          }}
          disabled={loading}
        />


        {/* Import Progress Indicator */}
        {loading && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div>
                <p className="text-sm text-blue-800 font-medium">Importing to GoHighLevel...</p>
                <p className="text-xs text-blue-600 mt-1">
                  Creating {leadCount} {leadCount === 1 ? 'contact' : 'contacts'} in GHL. Please wait...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={loading || !locationId.trim() || assignedUsers.length === 0}
            className="flex-1"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importing to GHL...
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
    </div>
  );
}

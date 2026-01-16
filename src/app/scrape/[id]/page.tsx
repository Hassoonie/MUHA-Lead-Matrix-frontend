"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/scraping/ProgressBar";
import Button from "@/components/ui/Button";
import { scrapeApi, createWebSocketUrl, JobProgress, JobResult } from "@/lib/api";
import LeadsTable from "@/components/scraping/LeadsTable";
import ViewLeadsModal from "@/components/scraping/ViewLeadsModal";
import GHLImportModal from "@/components/scraping/GHLImportModal";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useToast } from "@/contexts/ToastContext";

export default function ScrapeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { showError } = useToast();
  const [wsProgress, setWsProgress] = useState<JobProgress | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [showLeadsModal, setShowLeadsModal] = useState(false);
  const [showGHLImportModal, setShowGHLImportModal] = useState(false);
  const [fetchingLeads, setFetchingLeads] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [modalLeads, setModalLeads] = useState<JobResult["leads"]>([]);
  const [animatedDots, setAnimatedDots] = useState(1);
  const [maxLeadsCollected, setMaxLeadsCollected] = useState(0);

  const { data: jobStatus, error, mutate } = useSWR(
    jobId ? `/api/scrape/${jobId}/status` : null,
    () => scrapeApi.getStatus(jobId),
    { refreshInterval: 2000 }
  );

  const statusLower = jobStatus?.status?.toLowerCase();
  const shouldFetchResults = Boolean(
    jobId && (statusLower === "running" || statusLower === "completed")
  );
  const resultsRefreshInterval = statusLower === "running" ? 2000 : 0;

  const { data: jobResults, error: resultsError, isLoading: resultsLoading, mutate: mutateResults } = useSWR(
    shouldFetchResults ? `/api/scrape/${jobId}/results` : null,
    () => scrapeApi.getResults(jobId),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      refreshInterval: resultsRefreshInterval,
      shouldRetryOnError: (error) => {
        // Don't retry on 404 errors (job doesn't exist)
        return error?.response?.status !== 404;
      },
    }
  );

  // Error logging only for debugging critical issues
  useEffect(() => {
    if (resultsError) {
      console.error("Failed to load job results:", resultsError);
    }
  }, [resultsError]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    // Only connect when job is actually running
    const status = jobStatus?.status?.toLowerCase();
    if (!jobId || status !== "running") {
      setWsProgress(null); // Clear progress when not running
      return;
    }

    const ws = new WebSocket(createWebSocketUrl(jobId));

    ws.onopen = () => {
      // WebSocket connected
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "progress" && message.data) {
          setWsProgress(message.data);
          // Also trigger a status refresh to keep data in sync
          mutate();
        } else if (message.type === "completion") {
          mutate(); // Refresh to get final status
        } else if (message.type === "connected") {
          // Initial connection message - update progress immediately
          if (message.progress) {
            setWsProgress(message.progress);
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = () => {
      // WebSocket error - will be handled by onclose
      // Don't show error to user, fallback to polling via SWR refresh
    };

    ws.onclose = () => {
      // WebSocket closed
    };

    return () => {
      ws.close();
    };
  }, [jobId, jobStatus?.status, mutate]);

  // Ensure jobResults is fetched when job is running or completes
  useEffect(() => {
    const status = jobStatus?.status?.toLowerCase();
    if ((status === "completed" || status === "running") && !jobResults && !resultsLoading && jobId) {
      mutateResults().catch((error) => {
        console.error("Failed to fetch results on job completion:", error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobStatus?.status, jobResults, resultsLoading, jobId]);

  // Update modalLeads when jobResults changes and we have leads
  useEffect(() => {
    if (jobResults?.leads && jobResults.leads.length > 0) {
      setModalLeads(jobResults.leads);
    }
  }, [jobResults]);

  useEffect(() => {
    setMaxLeadsCollected(0);
  }, [jobId]);

  const baseProgress = jobStatus || wsProgress;
  const wsLeadsCollected = wsProgress?.leads_collected ?? 0;
  const statusLeadsCollected = jobStatus?.leads_collected ?? 0;
  const resultsLeadsCollected = jobResults?.leads?.length ?? 0;
  const baseLeadsCollected = Math.max(
    statusLeadsCollected,
    resultsLeadsCollected,
    wsLeadsCollected
  );

  useEffect(() => {
    if (baseLeadsCollected > maxLeadsCollected) {
      setMaxLeadsCollected(baseLeadsCollected);
    }
  }, [baseLeadsCollected, maxLeadsCollected]);

  const targetLeads = baseProgress?.target_leads || jobStatus?.target_leads || wsProgress?.target_leads || 0;
  const rawPercent = targetLeads > 0 ? (maxLeadsCollected / targetLeads) * 100 : (baseProgress?.progress_percent || 0);
  const statusForPercent = baseProgress?.status?.toLowerCase() || "";
  const cappedPercent = statusForPercent === "running" ? Math.min(99, rawPercent) : Math.min(100, rawPercent);
  const progress = baseProgress
    ? {
        ...baseProgress,
        leads_collected: maxLeadsCollected,
        progress_percent: statusForPercent === "completed" ? 100 : cappedPercent,
      }
    : baseProgress;
  const effectiveLeadsCollected = maxLeadsCollected;
  const isRunning = progress?.status?.toLowerCase() === "running";

  // Fetch leads when modal opens if not already loaded
  const fetchLeadsIfNeeded = useCallback(async (): Promise<JobResult | null> => {
    // If we already have leads, return them immediately
    if (jobResults?.leads && Array.isArray(jobResults.leads) && jobResults.leads.length > 0) {
      return jobResults;
    }

    const status = jobStatus?.status?.toLowerCase();
    if (status !== "completed" && status !== "running" && status !== "pending") {
      return null;
    }

    setFetchingLeads(true);
    setFetchError(null);

    try {
      // Directly fetch from API to ensure we get fresh data
      let directResult;
      try {
        directResult = await scrapeApi.getResults(jobId);
      } catch (fetchError: any) {
        // Handle 404 gracefully - job might not exist
        if (fetchError?.response?.status === 404) {
          setFetchError("Job not found. It may have been cleared after a backend restart.");
          setFetchingLeads(false);
          return null;
        }
        throw fetchError;
      }

      if (directResult) {
        // Update SWR cache
        await mutateResults(directResult, false);
        
        // Check if we have leads
        if (directResult.leads && Array.isArray(directResult.leads) && directResult.leads.length > 0) {
          return directResult;
        }
        
        return directResult;
      }
      
      return null;
    } catch (error: any) {
      console.error("Failed to fetch jobResults:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Failed to fetch leads. Please ensure the backend API is running.";
      setFetchError(errorMessage);
      
      // Try to revalidate SWR cache as fallback
      try {
        await mutateResults();
      } catch (mutateError) {
        console.error("Failed to revalidate cache:", mutateError);
      }
      
      return null;
    } finally {
      setFetchingLeads(false);
    }
  }, [jobId, jobStatus?.status, jobStatus?.leads_collected, jobResults, mutateResults]);

  useEffect(() => {
    if (!isRunning) {
      setAnimatedDots(1);
      return;
    }
    const interval = setInterval(() => {
      setAnimatedDots((prev) => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [isRunning]);


  const handleDownload = async () => {
    try {
      const blob = await scrapeApi.download(jobId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads_${jobId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      showError("Failed to download results");
    }
  };

  // Handle 404 errors (job doesn't exist - likely backend restart)
  if (error || (resultsError && resultsError?.response?.status === 404)) {
    const is404 = error?.response?.status === 404 || resultsError?.response?.status === 404;
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-[#c5b26f] mb-2 font-medium">
              {is404 ? "Job Not Found" : "Failed to load job details"}
            </p>
            {is404 && (
              <p className="text-sm text-black/60 dark:text-[#c5b26f]/70 mb-4">
                This job may have been cleared after a backend restart.<br />
                Jobs are stored in memory and are lost when the server restarts.
              </p>
            )}
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!progress) {
    // Check if it's a 404 error
    if (error?.response?.status === 404 || resultsError?.response?.status === 404) {
      return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-[#c5b26f] mb-2 font-medium">Job Not Found</p>
              <p className="text-sm text-black/60 dark:text-[#c5b26f]/70 mb-4">
                This job may have been cleared after a backend restart.<br />
                Jobs are stored in memory and are lost when the server restarts.
              </p>
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="text-center py-12">
            <p className="text-black/70 dark:text-[#c5b26f]/80">Loading job details...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white mb-2">Scraping Job</h1>
            <p className="text-black/70 dark:text-white/70">Job ID: {jobId}</p>
          </div>
          <Badge variant={progress.status === "completed" ? "success" : progress.status === "failed" ? "error" : "info"}>
            {progress.status}
          </Badge>
        </div>

        {/* Progress Card */}
        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-black dark:text-white">Progress</h2>
          </div>

          {(progress.status?.toLowerCase() === "running" || progress.status?.toLowerCase() === "pending") && (
            <div className="mb-6">
            {isRunning && (
                <p className="text-sm text-black/70 dark:text-white/70 mb-2">
                  {progress.current_query?.toLowerCase().includes("email")
                    ? progress.current_query
                    : `Running, generating leads${".".repeat(animatedDots)}`}
                </p>
              )}
              <div className="flex justify-between text-sm mb-2">
                <span className="text-black/70 dark:text-white/70">Overall Progress</span>
                <span className="font-medium text-black dark:text-white">{progress.progress_percent?.toFixed(1) || 0}%</span>
              </div>
              <ProgressBar progress={progress.progress_percent || 0} />
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-sm text-black/70 dark:text-white/70 mb-1">Queries</p>
              <p className="text-2xl font-bold text-black dark:text-white">
                {progress.queries_completed} / {progress.queries_total}
              </p>
            </div>
            <div>
              <p className="text-sm text-black/70 dark:text-white/70 mb-1">Leads Collected</p>
              <p className="text-2xl font-bold text-black dark:text-white">
                {effectiveLeadsCollected}
                {progress.target_leads ? ` / ${progress.target_leads}` : ""}
              </p>
            </div>
            <div>
              <p className="text-sm text-black/70 dark:text-white/70 mb-1">Duplicates</p>
              <p className="text-2xl font-bold text-black dark:text-white">{progress.duplicates_removed}</p>
            </div>
            <div>
              <p className="text-sm text-black/70 dark:text-white/70 mb-1">Failed</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{progress.failed_queries}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-4">
            {progress.elapsed_time && (
              <p className="text-sm text-black/70 dark:text-white/70">
                <span className="font-medium">Elapsed Time:</span> {progress.elapsed_time}
              </p>
            )}
            {progress.status === "running" && (
              <p className="text-sm text-black/70 dark:text-white/70">
                <span className="font-medium">Time Remaining:</span>{" "}
                <span className="text-[#c5b26f]">
                  {progress.estimated_time_remaining || "Estimating..."}
                </span>
              </p>
            )}
          </div>

          {/* Quick Actions - Show when completed with leads */}
          {((progress.status?.toLowerCase() === "completed" || progress.status?.toLowerCase() === "running" || progress.status?.toLowerCase() === "pending") && ((progress.leads_collected || 0) > 0 || (jobStatus?.leads_collected || 0) > 0)) && (
            <div className="mt-6 pt-6 border-t border-[#f0f5fa]">
              {(fetchError || resultsError) && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">
                    {fetchError || resultsError?.response?.data?.detail || resultsError?.message || "An error occurred while fetching leads"}
                  </p>
                  {resultsError && (
                    <p className="text-xs text-red-600 mt-2">
                      Make sure the backend API is running on port 8000. You can start it with: <code className="bg-red-100 px-1 rounded">npm run dev:backend</code>
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <Button 
                  variant="primary" 
                  onClick={async () => {
                    setFetchError(null);
                    const results = await fetchLeadsIfNeeded();
                    if (results?.leads && Array.isArray(results.leads) && results.leads.length > 0) {
                      setModalLeads(results.leads);
                      setShowLeadsModal(true);
                      setFetchError(null);
                    } else if (!fetchingLeads) {
                      // Check if we have leads from jobResults
                      const availableLeads = jobResults?.leads || [];
                      if (availableLeads.length > 0) {
                        setModalLeads(availableLeads);
                        setShowLeadsModal(true);
                      } else {
                        setFetchError("No leads available to view. The leads may still be processing, or try downloading the CSV file.");
                      }
                    }
                  }}
                  disabled={fetchingLeads}
                  className="flex-1"
                >
                  {fetchingLeads ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    "View Leads"
                  )}
                </Button>
                <Button 
                  variant="primary" 
                  onClick={async () => {
                    setFetchError(null);
                    const results = await fetchLeadsIfNeeded();
                    if (results?.leads && Array.isArray(results.leads) && results.leads.length > 0) {
                      setModalLeads(results.leads);
                      setShowGHLImportModal(true);
                      setFetchError(null);
                    } else if (!fetchingLeads) {
                      // Check if we have leads from jobResults
                      const availableLeads = jobResults?.leads || [];
                      if (availableLeads.length > 0) {
                        setModalLeads(availableLeads);
                        setShowGHLImportModal(true);
                      } else {
                        setFetchError("No leads available to import. The leads may still be processing, or try downloading the CSV file.");
                      }
                    }
                  }}
                  disabled={fetchingLeads}
                  className="flex-1"
                >
                  {fetchingLeads ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    "Import into GHL"
                  )}
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleDownload}
                  className="flex-1"
                >
                  Download CSV
                </Button>
              </div>
            </div>
          )}

          {progress.current_query && (
            <div className={`mt-4 p-4 rounded-lg ${
              progress.current_query.toLowerCase().includes("email")
                ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700"
                : "bg-[#f0f5fa] dark:bg-gray-700"
            }`}>
              <p className="text-sm text-black/70 dark:text-white/70 mb-1">
                {progress.current_query.toLowerCase().includes("email")
                  ? "Enriching Leads — this could take a while"
                  : "Currently Processing"}
              </p>
              <p className={`font-medium ${
                progress.current_query.toLowerCase().includes("email")
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-black dark:text-white"
              }`}>{progress.current_query}</p>
            </div>
          )}

          {progress.error_message && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800 mb-1">Error</p>
              <p className="text-sm text-red-600">{progress.error_message}</p>
            </div>
          )}
        </Card>

        {/* View Leads Modal */}
        <ViewLeadsModal
          isOpen={showLeadsModal}
          onClose={() => {
            setShowLeadsModal(false);
            setFetchError(null);
          }}
          leads={modalLeads.length > 0 ? modalLeads : (jobResults?.leads || [])}
          isLoading={fetchingLeads}
          totalLeads={effectiveLeadsCollected}
        />

        {/* GHL Import Modal */}
        <GHLImportModal
          isOpen={showGHLImportModal}
          onClose={() => {
            setShowGHLImportModal(false);
            setFetchError(null);
          }}
          jobId={jobId}
          leads={modalLeads.length > 0 ? modalLeads : (jobResults?.leads || [])}
          selectedLeadIndices={selectedLeads}
          isLoading={fetchingLeads}
        />

        {/* Results - Show when job is running or completed */}
        {(progress.status?.toLowerCase() === "completed" || progress.status?.toLowerCase() === "running") && (
          <>
            {resultsLoading ? (
              <Card>
                <div className="text-center py-8">
                  <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin h-8 w-8 text-[#c5b26f]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-black/70 dark:text-white/70">Loading leads...</p>
                  </div>
                </div>
              </Card>
            ) : resultsError ? (
              <Card>
                <div className="text-center py-8">
                  <p className="text-red-600 dark:text-red-400 mb-4">
                    {resultsError.response?.data?.detail || resultsError.message || "Failed to load leads"}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={async () => {
                      setFetchError(null);
                      await mutateResults();
                    }}>
                      Retry
                    </Button>
                    <Button variant="outline" onClick={handleDownload}>
                      Download CSV
                    </Button>
                  </div>
                </div>
              </Card>
            ) : jobResults && jobResults.leads && Array.isArray(jobResults.leads) && jobResults.leads.length > 0 ? (
              <>
                {/* Leads Table */}
                <LeadsTable
                  leads={jobResults.leads}
                  selectedLeads={selectedLeads}
                  onSelectionChange={setSelectedLeads}
                  totalLeads={effectiveLeadsCollected}
                />
              </>
            ) : (
              <Card>
                <div className="text-center py-8">
                  <p className="text-black/70 dark:text-white/70 mb-4">
                  {progress.leads_collected > 0 
                      ? "Leads are still being generated. This list will update as more results arrive."
                      : "No leads were collected for this scrape."}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={async () => {
                      setFetchError(null);
                      await mutateResults();
                    }}>
                      Refresh
                    </Button>
                    <Button variant="outline" onClick={handleDownload}>
                      Download CSV
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Back Button */}
        <div className="flex justify-start">
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import Card from "@/components/ui/Card";
import JobCard from "@/components/scraping/JobCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import StatsDashboard from "@/components/scraping/StatsDashboard";
import BulkActionsBar from "@/components/scraping/BulkActionsBar";
import GHLImportForm from "@/components/scraping/GHLImportForm";
import Modal from "@/components/ui/Modal";
import { scrapeApi, JobSummary, GHLImportRequest } from "@/lib/api";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useToast } from "@/contexts/ToastContext";

export default function DashboardPage() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const { data: jobs, error, mutate } = useSWR(
    "/api/scrape/jobs",
    scrapeApi.listJobs,
    { refreshInterval: 2000 }
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most_leads" | "least_leads">("newest");
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [showBulkGHLModal, setShowBulkGHLModal] = useState(false);

  const handleDeleteJob = async (jobId: string) => {
    if (confirm("Are you sure you want to delete this scrape?")) {
      try {
        await scrapeApi.deleteJob(jobId);
        mutate();
        // Remove from selection if selected
        setSelectedJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      } catch (error) {
        showError("Failed to delete scrape");
      }
    }
  };

  const handleSelectJob = (jobId: string, selected: boolean) => {
    setSelectedJobs(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(jobId);
      } else {
        newSet.delete(jobId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedJobs(new Set(filteredJobs.map(job => job.job_id)));
    } else {
      setSelectedJobs(new Set());
    }
  };

  const handleBulkDelete = async () => {
    const jobIds = Array.from(selectedJobs);
    if (jobIds.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${jobIds.length} job(s)?`)) {
      return;
    }

    try {
      await scrapeApi.bulkDelete(jobIds);
      setSelectedJobs(new Set());
      mutate();
    } catch (error: any) {
      showError(error.response?.data?.detail || "Failed to delete jobs");
    }
  };

  const handleBulkExport = async () => {
    const jobIds = Array.from(selectedJobs);
    if (jobIds.length === 0) return;

    try {
      const blob = await scrapeApi.bulkExport(jobIds);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bulk_export_${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
      setSelectedJobs(new Set());
    } catch (error: any) {
      showError(error.response?.data?.detail || "Failed to export jobs");
    }
  };

  const handleBulkImportToGHL = () => {
    setShowBulkGHLModal(true);
  };

  const handleBulkGHLImportSubmit = async (ghlConfig: GHLImportRequest) => {
    const jobIds = Array.from(selectedJobs);
    if (jobIds.length === 0) return;

    try {
      const response = await scrapeApi.bulkImportToGHL(jobIds, ghlConfig);
      setSelectedJobs(new Set());
      setShowBulkGHLModal(false);
      mutate();
      showSuccess(response.message || `Successfully imported leads from ${jobIds.length} job(s) to GHL`);
    } catch (error: any) {
      showError(error.response?.data?.detail || "Failed to import to GHL");
    }
  };

  const filteredJobs = useMemo(() => {
    if (!jobs || jobs.length === 0) return [];
    
    let filtered = [...jobs];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job => 
        job.niche?.toLowerCase().includes(query) ||
        job.query.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(job => job.status === statusFilter);
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest": 
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest": 
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "most_leads": 
          return b.total_leads - a.total_leads;
        case "least_leads": 
          return a.total_leads - b.total_leads;
        default: 
          return 0;
      }
    });
    
    return filtered;
  }, [jobs, searchQuery, statusFilter, sortBy]);

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "completed", label: "Completed" },
    { value: "running", label: "Running" },
    { value: "pending", label: "Pending" },
    { value: "failed", label: "Failed" },
    { value: "cancelled", label: "Cancelled" }
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "most_leads", label: "Most Leads" },
    { value: "least_leads", label: "Least Leads" }
  ];

  return (
    <ProtectedRoute>
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white dark:bg-black min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-[#c5b26f] mb-2">Dialed Moods - My Scrapes</h1>
          <p className="text-black/80 dark:text-[#c5b26f]/80">View and manage your scraping jobs</p>
        </div>
        <div className="flex gap-3 items-center">
          {filteredJobs.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedJobs.size === filteredJobs.length && filteredJobs.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-sm text-black/70 dark:text-white/70">Select All</span>
            </div>
          )}
          <Link href="/">
            <Button variant="primary">New Scrape</Button>
          </Link>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {jobs && jobs.length > 0 && <StatsDashboard jobs={jobs} />}

      {/* Search and Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-black/70 dark:text-white/70 mb-2">Search</label>
            <Input
              type="text"
              placeholder="Search by niche or query..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black/70 dark:text-white/70 mb-2">Status</label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black/70 dark:text-white/70 mb-2">Sort By</label>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              options={sortOptions}
            />
          </div>
        </div>
        {jobs && jobs.length > 0 && (
          <p className="text-sm text-black/60 dark:text-white/60 mt-4">
            Showing {filteredJobs.length} of {jobs.length} jobs
          </p>
        )}
      </Card>

      {/* Jobs List */}
      {jobs && jobs.length > 0 ? (
        filteredJobs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.job_id}
                  job={job as any}
                  onDelete={handleDeleteJob}
                  isSelected={selectedJobs.has(job.job_id)}
                  onSelect={handleSelectJob}
                />
              ))}
            </div>
            <BulkActionsBar
              selectedCount={selectedJobs.size}
              onDelete={handleBulkDelete}
              onExport={handleBulkExport}
              onImportToGHL={handleBulkImportToGHL}
              onClearSelection={() => setSelectedJobs(new Set())}
            />
          </>
        ) : (
          <Card>
            <div className="text-center py-12">
              <p className="text-black/70 dark:text-white/70 mb-4">No jobs match your filters</p>
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setSortBy("newest");
              }}>
                Clear Filters
              </Button>
            </div>
          </Card>
        )
      ) : (
        <Card>
          <div className="text-center py-12">
            <p className="text-black/70 dark:text-white/70 mb-4">No scrapes yet</p>
            <Link href="/">
              <Button variant="primary">Start Your First Scrape</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Bulk GHL Import Modal */}
      {showBulkGHLModal && (
        <Modal
          isOpen={showBulkGHLModal}
          onClose={() => setShowBulkGHLModal(false)}
          title={`Import to GHL (${selectedJobs.size} job${selectedJobs.size > 1 ? 's' : ''})`}
        >
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              This will import leads from {selectedJobs.size} selected job{selectedJobs.size > 1 ? 's' : ''} to GoHighLevel.
            </p>
          </div>
          <GHLImportForm
            jobId={Array.from(selectedJobs)[0] || ""}
            leads={[]}
            selectedLeadIndices={[]}
            onClose={() => setShowBulkGHLModal(false)}
            onImport={handleBulkGHLImportSubmit}
            isLoading={false}
          />
        </Modal>
      )}
    </div>
    </ProtectedRoute>
  );
}

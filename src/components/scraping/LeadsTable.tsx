"use client";

import { useState, useMemo } from "react";
import { Lead } from "@/lib/api";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import * as XLSX from "xlsx";

interface LeadsTableProps {
  leads: Lead[];
  selectedLeads?: number[];
  onSelectionChange?: (selectedIndices: number[]) => void;
  totalLeads?: number;
}

export default function LeadsTable({ 
  leads, 
  selectedLeads = [], 
  onSelectionChange,
  totalLeads
}: LeadsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Lead | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [emailFilter, setEmailFilter] = useState<"all" | "has" | "none">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [minRating, setMinRating] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const itemsPerPage = 20;

  // Get unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    leads.forEach(lead => {
      if (lead.category) {
        categories.add(lead.category);
      }
    });
    return Array.from(categories).sort();
  }, [leads]);

  // Filter and sort leads
  const filteredAndSortedLeads = useMemo(() => {
    let filtered = leads.filter((lead) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || (
        lead.name?.toLowerCase().includes(searchLower) ||
        lead.address?.toLowerCase().includes(searchLower) ||
        lead.phone?.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.category?.toLowerCase().includes(searchLower) ||
        false
      );
      
      // Email filter
      const matchesEmail = emailFilter === "all" || 
        (emailFilter === "has" && lead.email && lead.email.trim() !== "") ||
        (emailFilter === "none" && (!lead.email || lead.email.trim() === ""));
      
      // Category filter
      const matchesCategory = categoryFilter === "all" || lead.category === categoryFilter;
      
      // Location filter
      const matchesLocation = !locationFilter || 
        lead.address?.toLowerCase().includes(locationFilter.toLowerCase()) || false;
      
      // Rating filter
      const rating = parseFloat(lead.rating || "0");
      const matchesRating = rating >= minRating;
      
      return matchesSearch && matchesEmail && matchesCategory && matchesLocation && matchesRating;
    });

    if (sortField) {
      filtered.sort((a, b) => {
        const aVal = a[sortField] || "";
        const bVal = b[sortField] || "";
        const comparison = String(aVal).localeCompare(String(bVal));
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [leads, searchTerm, sortField, sortDirection, emailFilter, categoryFilter, locationFilter, minRating]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedLeads.length / itemsPerPage);
  const paginatedLeads = filteredAndSortedLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: keyof Lead }) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1">
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  // Handle checkbox selection - using Set for better performance
  const selectedSet = new Set(selectedLeads);

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      // Select all filtered leads (by their original indices)
      const allIndices = filteredAndSortedLeads.map(lead => {
        return leads.findIndex(l => l === lead);
      }).filter(idx => idx !== -1);
      onSelectionChange(allIndices);
    } else {
      // Deselect all filtered leads
      const filteredIndices = filteredAndSortedLeads.map(lead => {
        return leads.findIndex(l => l === lead);
      }).filter(idx => idx !== -1);
      onSelectionChange(selectedLeads.filter(idx => !filteredIndices.includes(idx)));
    }
  };

  const handleSelectLead = (lead: Lead, checked: boolean) => {
    if (!onSelectionChange) return;
    const originalIndex = leads.findIndex(l => l === lead);
    if (originalIndex === -1) return;
    
    if (checked) {
      onSelectionChange([...selectedLeads, originalIndex]);
    } else {
      onSelectionChange(selectedLeads.filter(idx => idx !== originalIndex));
    }
  };

  const isAllSelected = filteredAndSortedLeads.length > 0 && 
    filteredAndSortedLeads.every(lead => {
      const originalIndex = leads.findIndex(l => l === lead);
      return originalIndex !== -1 && selectedSet.has(originalIndex);
    });

  const isLeadSelected = (lead: Lead) => {
    const originalIndex = leads.findIndex(l => l === lead);
    return originalIndex !== -1 && selectedSet.has(originalIndex);
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (emailFilter !== "all") count++;
    if (categoryFilter !== "all") count++;
    if (locationFilter) count++;
    if (minRating > 0) count++;
    return count;
  }, [emailFilter, categoryFilter, locationFilter, minRating]);

  const clearAllFilters = () => {
    setEmailFilter("all");
    setCategoryFilter("all");
    setLocationFilter("");
    setMinRating(0);
    setSearchTerm("");
  };

  // Export functions
  const handleExport = (format: "csv" | "json" | "excel") => {
    const leadsToExport = selectedLeads.length > 0 
      ? filteredAndSortedLeads.filter((lead) => {
          const originalIndex = leads.findIndex(l => l === lead);
          return selectedLeads.includes(originalIndex);
        })
      : filteredAndSortedLeads;
    
    if (format === "csv") {
      // CSV export
      const headers = ["name", "address", "phone", "email", "website", "category", "rating"];
      const rows = leadsToExport.map(lead => 
        headers.map(header => {
          const value = lead[header as keyof Lead] || "";
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value);
          return stringValue.includes(",") || stringValue.includes('"') 
            ? `"${stringValue.replace(/"/g, '""')}"` 
            : stringValue;
        })
      );
      
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (format === "json") {
      // JSON export
      const jsonContent = JSON.stringify(leadsToExport, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (format === "excel") {
      // Excel export using xlsx library
      const worksheet = XLSX.utils.json_to_sheet(leadsToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
      XLSX.writeFile(workbook, `leads_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
    
    setShowExportOptions(false);
  };

  return (
    <Card>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-black">
              {typeof totalLeads === "number" && totalLeads > filteredAndSortedLeads.length
                ? `Leads (showing ${filteredAndSortedLeads.length} of ${totalLeads})`
                : `Leads (${filteredAndSortedLeads.length})`}
            </h2>
            {activeFiltersCount > 0 && (
              <span className="text-xs bg-[#c5b26f] text-black px-2 py-1 rounded-full">
                {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {onSelectionChange && selectedLeads.length > 0 && (
              <p className="text-sm text-black/70 self-center">
                {selectedLeads.length} selected
              </p>
            )}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="text-sm"
              >
                Export
              </Button>
              {showExportOptions && (
                <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                  <button
                    onClick={() => handleExport("csv")}
                    className="block w-full text-left px-4 py-2 text-sm text-black hover:bg-[#f0f5fa] rounded-t-lg"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleExport("json")}
                    className="block w-full text-left px-4 py-2 text-sm text-black hover:bg-[#f0f5fa]"
                  >
                    Export JSON
                  </button>
                  <button
                    onClick={() => handleExport("excel")}
                    className="block w-full text-left px-4 py-2 text-sm text-black hover:bg-[#f0f5fa] rounded-b-lg"
                  >
                    Export Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Input
          type="text"
          placeholder="Search leads..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="mb-4"
        />

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-[#f0f5fa] rounded-lg mb-4">
            <div>
              <label className="block text-xs font-medium text-black/70 mb-1">Email</label>
              <Select
                value={emailFilter}
                onChange={(e) => {
                  setEmailFilter(e.target.value as typeof emailFilter);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "all", label: "All" },
                  { value: "has", label: "Has Email" },
                  { value: "none", label: "No Email" }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-black/70 mb-1">Category</label>
              <Select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "all", label: "All Categories" },
                  ...uniqueCategories.map(cat => ({ value: cat, label: cat }))
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-black/70 mb-1">Location</label>
              <Input
                type="text"
                placeholder="Filter by address..."
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-black/70 mb-1">Min Rating</label>
              <Input
                type="number"
                min="0"
                max="5"
                step="0.1"
                placeholder="0"
                value={minRating}
                onChange={(e) => {
                  setMinRating(parseFloat(e.target.value) || 0);
                  setCurrentPage(1);
                }}
              />
            </div>
            {activeFiltersCount > 0 && (
              <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="text-sm"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f0f5fa]">
              {onSelectionChange && (
                <th className="py-3 px-4 text-sm font-semibold text-black w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
              )}
              {[
                "name",
                "address",
                "phone",
                "email",
                "website",
                "category",
              ].map((field) => (
                <th
                  key={field}
                  className="text-left py-3 px-4 text-sm font-semibold text-black cursor-pointer hover:bg-[#f0f5fa] transition-colors uppercase tracking-wide-label"
                  onClick={() => handleSort(field as keyof Lead)}
                >
                  <div className="flex items-center">
                    {field}
                    <SortIcon field={field as keyof Lead} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedLeads.map((lead, index) => {
              const isSelected = isLeadSelected(lead);
              return (
                <tr
                  key={index}
                  className={`border-b border-[#f0f5fa] hover:bg-[#f0f5fa] transition-colors ${isSelected ? 'bg-[#f0f5fa]' : ''}`}
                >
                  {onSelectionChange && (
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectLead(lead, e.target.checked)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="py-3 px-4 text-sm text-black">{lead.name || "-"}</td>
                  <td className="py-3 px-4 text-sm text-black/70">{lead.address || "-"}</td>
                  <td className="py-3 px-4 text-sm text-black/70">{lead.phone || "-"}</td>
                  <td className="py-3 px-4 text-sm text-black/70">{lead.email || "-"}</td>
                  <td className="py-3 px-4 text-sm">
                    {lead.website ? (
                      <a
                        href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {lead.website}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-black/70">{lead.category || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-black/70">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

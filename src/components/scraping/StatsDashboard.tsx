"use client";

import Card from "@/components/ui/Card";
import { JobSummary } from "@/lib/api";
import { useMemo } from "react";

interface StatsDashboardProps {
  jobs: JobSummary[];
}

export default function StatsDashboard({ jobs }: StatsDashboardProps) {
  const stats = useMemo(() => {
    if (!jobs || jobs.length === 0) {
      return {
        totalJobs: 0,
        totalLeads: 0,
        successRate: 0,
        avgLeadsPerJob: 0,
        activeJobs: 0
      };
    }
    
    const completedJobs = jobs.filter(j => j.status === "completed");
    const activeJobs = jobs.filter(j => j.status === "running" || j.status === "pending");
    const totalLeads = jobs.reduce((sum, j) => sum + j.total_leads, 0);
    
    return {
      totalJobs: jobs.length,
      totalLeads,
      successRate: jobs.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0,
      avgLeadsPerJob: completedJobs.length > 0 ? Math.round(totalLeads / completedJobs.length) : 0,
      activeJobs: activeJobs.length
    };
  }, [jobs]);

  const statCards = [
    {
      label: "Total Jobs",
      value: stats.totalJobs,
      icon: "📊"
    },
    {
      label: "Total Leads",
      value: stats.totalLeads.toLocaleString(),
      icon: "👥"
    },
    {
      label: "Success Rate",
      value: `${stats.successRate.toFixed(1)}%`,
      icon: "✅"
    },
    {
      label: "Avg Leads/Job",
      value: stats.avgLeadsPerJob,
      icon: "📈"
    },
    {
      label: "Active Jobs",
      value: stats.activeJobs,
      icon: "🔄"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {statCards.map((stat) => (
        <Card key={stat.label} className="text-center">
          <div className="text-3xl mb-2">{stat.icon}</div>
          <div className="text-2xl font-bold text-black dark:text-white mb-1">{stat.value}</div>
          <div className="text-sm text-black/70 dark:text-white/70">{stat.label}</div>
        </Card>
      ))}
    </div>
  );
}

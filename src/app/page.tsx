"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { scrapeApi, ScrapeRequest } from "@/lib/api";
import { useRouter } from "next/navigation";
import ErrorAlert from "@/components/ui/ErrorAlert";
import TemplateSelector from "@/components/scraping/TemplateSelector";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  const extractLimitFromQuery = (text: string): number | undefined => {
    const match = text.match(/(\d{1,4})/);
    if (!match) {
      return undefined;
    }
    const value = Number(match[1]);
    if (!Number.isFinite(value) || value <= 0) {
      return undefined;
    }
    return value;
  };

  // Show loading state while checking authentication
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-black dark:text-[#c5b26f]">Loading...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const trimmedQuery = query.trim();
      const inferredLimit = extractLimitFromQuery(trimmedQuery);
      const request: ScrapeRequest = {
        query: trimmedQuery,
        limit: inferredLimit,
      };

      const response = await scrapeApi.start(request);
      router.push(`/scrape/${response.job_id}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Failed to start scraping job";
      console.error("Scrape error:", err);
      
      // Provide user-friendly error messages
      if (errorMessage.includes("connect") || errorMessage.includes("Network")) {
        setError("Cannot connect to server. Please make sure the backend API is running on port 8000.");
      } else if (errorMessage.includes("API key") || errorMessage.includes("OpenAI")) {
        setError("API configuration error. Please check your OpenAI API key settings.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Hero Section */}
      <section className="relative pt-12 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background - solid white/dark */}
        <div className="absolute inset-0 bg-white dark:bg-black" />
        
        <div className="relative container mx-auto max-w-4xl">
          <div className="text-center animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black dark:text-[#c5b26f] leading-tight mb-4">
              Dialed Moods
            </h1>
            <p className="text-lg sm:text-xl text-black/80 dark:text-[#c5b26f]/80 mb-2 max-w-2xl mx-auto leading-relaxed">
              AI-Powered Lead Generation Platform
            </p>
            <p className="text-sm text-black/60 dark:text-[#c5b26f]/70 mb-8">
              Find and enrich business leads with natural language queries
            </p>
            
            {/* Quick Examples */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {["Find 10 gyms in Los Angeles", "5 coffee shops in Miami", "Yoga studios in Seattle"].map((example) => (
                <button
                  key={example}
                  onClick={() => {
                    setQuery(example);
                    setError("");
                  }}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#2a2a2a] text-black dark:text-[#c5b26f] rounded-lg transition-colors border border-gray-300 dark:border-gray-800 hover:border-gray-400 dark:hover:border-[#c5b26f]/50"
                >
                  {example}
                </button>
              ))}
            </div>

            {/* Quick Start Form */}
            <Card className="max-w-2xl mx-auto animate-slide-up bg-white dark:bg-[#0a0a0a] border-2 border-gray-200 dark:border-gray-800" hover={false}>
              <div className="mb-4 flex gap-2 justify-center">
                <Button
                  type="button"
                  variant={showTemplates ? "primary" : "outline"}
                  onClick={() => setShowTemplates(!showTemplates)}
                >
                  {showTemplates ? "Hide Templates" : "Show Templates"}
                </Button>
              </div>
              
              {showTemplates && (
                <div className="mb-6">
                  <TemplateSelector
                    onSelectTemplate={async (template) => {
                      setQuery(template.query);
                      setShowTemplates(false);
                    }}
                    showSaveButton={false}
                  />
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Find 10 gyms in Los Angeles"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setError("");
                  }}
                  disabled={loading}
                  className="text-base py-4"
                />
                {error && <ErrorAlert error={error} />}
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || !query.trim()}
                  className="w-full text-base py-4"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Starting...
                    </span>
                  ) : (
                    "Start Scraping"
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-black dark:text-[#c5b26f] mb-4">
              Powerful Features
            </h2>
            <p className="text-black/80 dark:text-[#c5b26f]/80 text-lg max-w-2xl mx-auto">
              Everything you need for efficient lead generation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Natural Language",
                description: "Describe what you need in plain English. AI understands your intent and generates optimal search queries.",
                icon: "💬",
              },
              {
                title: "Real-Time Progress",
                description: "Watch your leads being collected in real-time with live progress updates and status tracking.",
                icon: "⚡",
              },
              {
                title: "Lead Enrichment",
                description: "Automatically enrich leads with emails, tech stack, SEO data, and social media links.",
                icon: "🔍",
              },
              {
                title: "GHL Integration",
                description: "Import leads directly to GoHighLevel CRM with one click. Seamless integration for your sales workflow.",
                icon: "📊",
              },
              {
                title: "Export & Download",
                description: "Download results as CSV files, filter data, and export exactly what you need.",
                icon: "📥",
              },
              {
                title: "IP Protection",
                description: "Built-in safety features to prevent bans with multiple protection layers and adaptive rate limiting.",
                icon: "🛡️",
              },
            ].map((feature, index) => (
              <Card
                key={feature.title}
                className="animate-pop-in bg-white dark:bg-[#0a0a0a] border-2 border-gray-200 dark:border-[#c5b26f]/30"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-black dark:text-[#c5b26f] mb-2">
                  {feature.title}
                </h3>
                <p className="text-black/80 dark:text-[#c5b26f]/90 leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
        <div className="container mx-auto max-w-4xl text-center animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-bold text-black dark:text-[#c5b26f] mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-black/80 dark:text-[#c5b26f]/80 mb-8 max-w-2xl mx-auto">
            Start generating leads in minutes. No complex setup required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button variant="primary">View My Scrapes</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

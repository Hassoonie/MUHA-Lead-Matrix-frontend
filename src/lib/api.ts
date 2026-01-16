import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors (no response received)
    if (!error.response) {
      let errorMessage = "Network error occurred. ";
      
      // Handle specific error codes
      if (error.code === 'ECONNREFUSED') {
        errorMessage += "Cannot connect to the API server. Please ensure the backend is running on port 8000.";
      } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
        errorMessage += "Cannot resolve the API server address. Please check your network connection and API URL.";
      } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        errorMessage += `Request timed out after ${api.defaults.timeout}ms. The server may be slow or unresponsive.`;
      } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        errorMessage += "Unable to reach the API server. This could be due to CORS issues, network problems, or the server being down.";
      } else if (error.code === 'ERR_CANCELED') {
        errorMessage = "Request was cancelled.";
      } else {
        errorMessage += error.message || "Please check your connection and try again.";
      }
      
      error.response = {
        data: {
          detail: errorMessage,
          code: error.code || 'NETWORK_ERROR'
        },
        status: 0
      };
      return Promise.reject(error);
    }

    // Handle HTTP error responses
    const status = error.response.status;
    const originalDetail = error.response.data?.detail || error.response.data?.message;
    
    switch (status) {
      case 400:
        error.response.data = {
          detail: originalDetail || "Invalid request. Please check your input and try again.",
          code: 'BAD_REQUEST'
        };
        break;
      case 404:
        error.response.data = {
          detail: originalDetail || `API endpoint not found: ${error.config?.url}. Please check the API URL configuration.`,
          code: 'NOT_FOUND'
        };
        break;
      case 401:
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login") && !window.location.pathname.includes("/signup")) {
          window.location.href = "/login";
        }
        error.response.data = {
          detail: originalDetail || "Please log in to continue.",
          code: 'UNAUTHORIZED'
        };
        break;
      case 500:
        error.response.data = {
          detail: originalDetail || "Internal server error. Please try again later or contact support.",
          code: 'SERVER_ERROR'
        };
        break;
      case 503:
        error.response.data = {
          detail: originalDetail || "Service unavailable. The server may be temporarily overloaded.",
          code: 'SERVICE_UNAVAILABLE'
        };
        break;
      default:
        // Preserve original error detail if available
        if (!error.response.data?.detail && originalDetail) {
          error.response.data = {
            ...error.response.data,
            detail: originalDetail,
            code: `HTTP_${status}`
          };
        } else if (!error.response.data?.detail) {
          error.response.data = {
            detail: `Request failed with status ${status}. Please try again.`,
            code: `HTTP_${status}`
          };
        }
    }

    return Promise.reject(error);
  }
);

// Types
export interface ScrapeRequest {
  query: string;
  limit?: number;
}

export interface AIUnderstanding {
  keywords: string[];
  regions: string[];
  limit: number;
  enrich: boolean;
  reasoning?: string;
}

export interface ExecutionPlan {
  mode: string;
  total_queries: number;
  expected_leads: number;
  estimated_time: string;
  campaigns?: string[];
}

export interface ScrapeResponse {
  job_id: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  ai_understanding?: AIUnderstanding;
  execution_plan?: ExecutionPlan;
  message: string;
}

export interface JobProgress {
  job_id: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  progress_percent: number;
  queries_completed: number;
  queries_total: number;
  leads_collected: number;
  target_leads: number;
  duplicates_removed: number;
  failed_queries: number;
  elapsed_time?: string;
  estimated_time_remaining?: string;
  current_query?: string;
  error_message?: string;
}

export interface Lead {
  name?: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: string;
  reviews?: string;
  category?: string;
  tech_stack?: string;
  seo_title?: string;
  seo_description?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_linkedin?: string;
  social_twitter?: string;
}

export interface JobResult {
  job_id: string;
  status: string;
  created_at: string;
  completed_at?: string;
  leads: Lead[];
  total_leads: number;
  target_leads: number;
  file_path?: string;
  execution_plan?: ExecutionPlan;
}

export interface JobSummary {
  job_id: string;
  status: string;
  query: string;
  created_at: string;
  completed_at?: string;
  total_leads: number;
  target_leads: number;
  queries_total: number;
  queries_completed: number;
  niche?: string;
  csv_downloaded?: boolean;
  csv_downloaded_at?: string;
  error_message?: string;
  ghl_uploads?: Array<{
    uploaded_at: string;
    location_id: string;
    assigned_to?: string;
    lead_count: number;
    tags?: string[];
  }>;
}

export interface JobTemplate {
  template_id: string;
  name: string;
  query: string;
  limit: number;
  niche?: string;
  created_at: string;
  updated_at: string;
}

export interface GHLImportRequest {
  job_id: string;
  lead_ids?: string[]; // if empty, import all
  location_id: string;
  assigned_to?: string[]; // Array of user IDs to assign leads to (round-robin distribution)
  tags?: string[]; // List of tags to apply
  notes?: string; // Notes to add to leads
}

export interface GHLImportResponse {
  success: boolean;
  message: string;
  imported_count?: number;
  csv_url?: string; // if API not available, returns CSV download URL
}

export interface GHLLocation {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface GHLUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  name?: string;
}

export interface GHLConnectionStatus {
  connected: boolean;
  locations: GHLLocation[];
  users: Record<string, GHLUser[]>; // location_id -> users
}

// API functions
export const scrapeApi = {
  start: async (request: ScrapeRequest): Promise<ScrapeResponse> => {
    const response = await api.post<ScrapeResponse>("/api/scrape/start", request);
    return response.data;
  },

  getStatus: async (jobId: string): Promise<JobProgress> => {
    const response = await api.get<JobProgress>(`/api/scrape/${jobId}/status`);
    return response.data;
  },

  getResults: async (jobId: string): Promise<JobResult> => {
    try {
      const response = await api.get<JobResult>(`/api/scrape/${jobId}/results`, {
        timeout: 600000  // 10 minute timeout for large result sets (191+ leads)
      });
      return response.data;
    } catch (error: any) {
      // Handle 404 gracefully - job might not exist (backend restart)
      if (error?.response?.status === 404) {
        throw new Error("Job not found. It may have been cleared after a backend restart.");
      }
      throw error;
    }
  },

  download: async (jobId: string): Promise<Blob> => {
    const response = await api.get(`/api/scrape/${jobId}/download`, {
      responseType: "blob",
    });
    return response.data;
  },

  listJobs: async (): Promise<JobSummary[]> => {
    const response = await api.get<JobSummary[]>("/api/scrape/jobs");
    return response.data;
  },

  templates: {
    list: async (): Promise<JobTemplate[]> => {
      const response = await api.get<JobTemplate[]>("/api/templates");
      return response.data;
    },
    create: async (template: Omit<JobTemplate, 'template_id' | 'created_at' | 'updated_at'>): Promise<JobTemplate> => {
      const response = await api.post<JobTemplate>("/api/templates", template);
      return response.data;
    },
    get: async (templateId: string): Promise<JobTemplate> => {
      const response = await api.get<JobTemplate>(`/api/templates/${templateId}`);
      return response.data;
    },
    delete: async (templateId: string): Promise<void> => {
      await api.delete(`/api/templates/${templateId}`);
    },
    startJob: async (templateId: string): Promise<ScrapeResponse> => {
      const response = await api.post<ScrapeResponse>(`/api/scrape/from-template/${templateId}`);
      return response.data;
    }
  },

  deleteJob: async (jobId: string): Promise<void> => {
    await api.delete(`/api/scrape/${jobId}`);
  },
  bulkDelete: async (jobIds: string[]): Promise<{ deleted: string[], not_found: string[], count: number }> => {
    const response = await api.post<{ deleted: string[], not_found: string[], count: number }>("/api/scrape/bulk-delete", { job_ids: jobIds });
    return response.data;
  },
  bulkExport: async (jobIds: string[]): Promise<Blob> => {
    const response = await api.post("/api/scrape/bulk-export", { job_ids: jobIds }, { responseType: "blob" });
    return response.data;
  },
  bulkImportToGHL: async (jobIds: string[], ghlConfig: GHLImportRequest): Promise<GHLImportResponse> => {
    const response = await api.post<GHLImportResponse>("/api/ghl/bulk-import", {
      job_ids: jobIds,
      location_id: ghlConfig.location_id,
      assigned_to: ghlConfig.assigned_to,
      tags: ghlConfig.tags
    }, { timeout: 600000 }); // 10 minutes timeout
    return response.data;
  },
};

// Auth API
export const authApi = {
  signup: async (email: string, password: string, name?: string) => {
    const response = await api.post("/api/auth/signup", {
      email,
      password,
      name,
    });
    const { user, token } = response.data;
    // Store token and user in localStorage
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user", JSON.stringify(user));
    return { user, token };
  },

  login: async (email: string, password: string) => {
    const response = await api.post("/api/auth/login", {
      email,
      password,
    });
    const { user, token } = response.data;
    // Store token and user in localStorage
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user", JSON.stringify(user));
    return { user, token };
  },

  logout: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  getCurrentUser: async () => {
    const response = await api.get("/api/auth/me");
    return response.data;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("auth_token");
  },

  getStoredUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },
};

// GHL Import API
export const ghlApi = {
  import: async (request: GHLImportRequest, onProgress?: (progress: any) => void): Promise<GHLImportResponse> => {
    // Use streaming endpoint for progress updates
    if (onProgress) {
      return new Promise((resolve, reject) => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          reject(new Error("Not authenticated. Please log in."));
          return;
        }
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        
        // Use fetch with streaming
        fetch(`${apiUrl}/api/ghl/import-stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include', // Include cookies for CORS
          body: JSON.stringify(request)
        }).then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          
          if (!reader) {
            reject(new Error("No response body"));
            return;
          }
          
          let buffer = '';
          
          const readStream = () => {
            reader.read().then(({ done, value }) => {
              if (done) {
                reject(new Error("Stream ended unexpectedly"));
                return;
              }
              
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // Keep incomplete line in buffer
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    
                    if (data.status === 'complete') {
                      resolve({
                        success: true,
                        message: data.message,
                        imported_count: data.result?.success_count || 0,
                        failed_count: data.result?.failed_count || 0,
                        errors: data.result?.errors || [],
                        warnings: data.result?.duplicate_count > 0 ? [`${data.result.duplicate_count} duplicate(s) skipped`] : undefined
                      });
                      return;
                    } else if (data.status === 'error') {
                      reject(new Error(data.error || "Import failed"));
                      return;
                    } else if (data.status !== 'heartbeat' && onProgress) {
                      onProgress(data);
                    }
                  } catch (e) {
                    console.error("Error parsing SSE data:", e);
                  }
                }
              }
              
              readStream(); // Continue reading
            }).catch(reject);
          };
          
          readStream();
        }).catch(reject);
      });
    }
    
    // Fallback to regular endpoint with increased timeout (10 minutes)
    const response = await api.post<GHLImportResponse>("/api/ghl/import", request, { timeout: 600000 });
    return response.data;
  },
  authorize: (): void => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${API_BASE_URL}/api/auth/ghl/authorize`;
  },
  getConnectionStatus: async (): Promise<GHLConnectionStatus> => {
    const response = await api.get<GHLConnectionStatus>("/api/auth/ghl/status");
    return response.data;
  },
  // Disconnect functionality removed - GHL integration cannot be disconnected
};

// Admin API Types
export interface SystemStats {
  total_users: number;
  total_leads: number;
  total_scrapes: number;
  total_scrapes_today: number;
  total_leads_today: number;
  active_users_today: number;
  system_health: "healthy" | "warning" | "error";
}

export interface UserMetrics {
  user_id: string;
  email: string;
  name?: string;
  total_leads: number;
  total_scrapes: number;
  successful_scrapes: number;
  failed_scrapes: number;
  success_rate: number;
  last_active?: string;
  created_at?: string;
  is_admin: boolean;
}

export interface UserDetailedStats {
  user_id: string;
  email: string;
  name?: string;
  is_admin: boolean;
  total_leads: number;
  total_scrapes: number;
  successful_scrapes: number;
  failed_scrapes: number;
  success_rate: number;
  avg_leads_per_scrape: number;
  last_active?: string;
  created_at?: string;
  recent_scrapes: Array<{
    run_id: string;
    query: string;
    status: string;
    leads_collected: number;
    target_leads?: number;
    created_at: string;
    elapsed_time?: string;
  }>;
  leads_over_time: Array<{
    date: string;
    count: number;
  }>;
}

// Admin API functions
export const adminApi = {
  // Get system-wide statistics
  getSystemStats: async (): Promise<SystemStats> => {
    const response = await api.get<SystemStats>("/api/admin/stats");
    return response.data;
  },

  // Get all users with metrics
  getAllUsers: async (): Promise<UserMetrics[]> => {
    const response = await api.get<UserMetrics[]>("/api/admin/users");
    return response.data;
  },

  // Get detailed stats for specific user
  getUserStats: async (userId: string): Promise<UserDetailedStats> => {
    const response = await api.get<UserDetailedStats>(`/api/admin/user/${userId}/stats`);
    return response.data;
  },

  // Update user's admin status
  updateUserRole: async (userId: string, isAdmin: boolean) => {
    const response = await api.patch(`/api/admin/user/${userId}/role`, {
      is_admin: isAdmin
    });
    return response.data;
  },

  // Delete a user
  deleteUser: async (userId: string) => {
    const response = await api.delete(`/api/admin/user/${userId}`);
    return response.data;
  },
};

// WebSocket helper
export function createWebSocketUrl(jobId: string): string {
  const wsProtocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsHost = process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:/, "") || "localhost:8000";
  return `${wsProtocol}//${wsHost}/ws/scrape/${jobId}`;
}

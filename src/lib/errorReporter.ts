/**
 * Frontend error reporting utility
 * Sends errors to backend for logging in production
 */

import axios from "axios";

interface ErrorContext {
  component?: string;
  action?: string;
  user?: string;
  [key: string]: unknown;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function reportError(
  error: Error,
  context: ErrorContext = {}
): Promise<void> {
  // Only report in production to avoid noise during development
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  try {
    // Send error to backend for logging
    await axios.post(
      `${API_URL}/api/errors/log`,
      {
        message: error.message,
        stack: error.stack,
        component: context.component,
        action: context.action,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        timestamp: new Date().toISOString(),
        context: context,
      },
      {
        timeout: 5000, // 5 second timeout - don't block app
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (reportingError) {
    // Silently fail - don't let error reporting break the app
    // Fall back to console logging
    if (process.env.NODE_ENV === "production") {
      console.error("Production error (failed to report to backend):", {
        message: error.message,
        stack: error.stack,
        context,
      });
    }
  }
}

/**
 * Get user-friendly error message from API error
 */
export function getErrorMessage(error: any): string {
  // Check for API response error
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }

  // Check for network error
  if (error?.message === "Network Error") {
    return "Network error. Please check your internet connection.";
  }

  // Check for timeout
  if (error?.code === "ECONNABORTED") {
    return "Request timed out. Please try again.";
  }

  // Check for 401/403 errors
  if (error?.response?.status === 401) {
    return "Please log in to continue.";
  }

  if (error?.response?.status === 403) {
    return "You don't have permission to perform this action.";
  }

  // Check for 429 rate limit
  if (error?.response?.status === 429) {
    return "Too many requests. Please try again later.";
  }

  // Check for 500 server error
  if (error?.response?.status >= 500) {
    return "Server error. Our team has been notified. Please try again later.";
  }

  // Default message
  return error?.message || "An unexpected error occurred. Please try again.";
}

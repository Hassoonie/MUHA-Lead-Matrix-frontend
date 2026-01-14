/**
 * Development-only logger utility
 * Respects environment to prevent sensitive data exposure in production
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error';

export const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

export const devInfo = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.info(...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(...args);
  }
};

// Errors should always be logged but without sensitive details in production
export const devError = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  } else {
    // In production, log generic error without details
    console.error('An error occurred. Check server logs for details.');
  }
};

// Structured logger for important events (can be extended to send to backend)
export const logger = {
  log: (message: string, data?: any) => devLog(message, data),
  info: (message: string, data?: any) => devInfo(message, data),
  warn: (message: string, data?: any) => devWarn(message, data),
  error: (message: string, error?: any) => devError(message, error),
};

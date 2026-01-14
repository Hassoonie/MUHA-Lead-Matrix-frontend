interface ErrorAlertProps {
  error?: string;
  message?: string; // Support both 'error' and 'message' props for compatibility
  className?: string;
}

export default function ErrorAlert({ error, message, className = "" }: ErrorAlertProps) {
  // Use message prop if provided, otherwise use error prop, fallback to empty string
  const errorMessage = message || error || "";
  
  // Only check for connection errors if we have a message
  const isConnectionError = errorMessage && (
    errorMessage.includes("connect") || 
    errorMessage.includes("backend") || 
    errorMessage.includes("server") || 
    errorMessage.includes("Network")
  );
  
  // Don't render if no error message
  if (!errorMessage) {
    return null;
  }
  
  return (
    <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <p className="text-sm text-red-800 font-medium mb-2">{errorMessage}</p>
      {isConnectionError && (
        <div className="mt-2 p-3 bg-red-100 rounded border border-red-300">
          <p className="text-xs text-red-900 font-semibold mb-1">To fix this, run the backend API:</p>
          <code className="text-xs text-red-800 block bg-red-200 px-2 py-1 rounded font-mono break-all">
            cd ADW-LeadMatrix && python -m uvicorn api.main:app --reload --port 8000
          </code>
        </div>
      )}
    </div>
  );
}

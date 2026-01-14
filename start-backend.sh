#!/bin/bash
# Script to start the backend API server
# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Navigate to ADW-LeadMatrix directory (parent of lead-scraper-user-interface)
BACKEND_DIR="${SCRIPT_DIR}/../ADW-LeadMatrix"

# Check if ADW-LeadMatrix directory exists
if [ ! -d "${BACKEND_DIR}" ]; then
  echo "Error: Backend directory not found at ${BACKEND_DIR}"
  echo "Please ensure ADW-LeadMatrix directory exists in the parent folder."
  exit 1
fi

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
  echo "Error: python3 command not found. Please install Python 3."
  exit 1
fi

# Navigate to backend directory
cd "${BACKEND_DIR}" || exit 1

# Check if api/main.py exists
if [ ! -f "api/main.py" ]; then
  echo "Error: api/main.py not found in ${BACKEND_DIR}"
  echo "Please ensure the backend API files are present."
  exit 1
fi

# Start the backend server
echo "Starting backend API server on http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""
exec python3 -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
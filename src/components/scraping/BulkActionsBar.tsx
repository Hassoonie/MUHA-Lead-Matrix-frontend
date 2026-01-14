"use client";

import Button from "@/components/ui/Button";

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onExport: () => void;
  onImportToGHL: () => void;
  onClearSelection: () => void;
}

export default function BulkActionsBar({
  selectedCount,
  onDelete,
  onExport,
  onImportToGHL,
  onClearSelection
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40 p-4">
      <div className="container mx-auto max-w-7xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-black dark:text-white">
            {selectedCount} job{selectedCount > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={onClearSelection}
            className="text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
          >
            Clear selection
          </button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExport}>
            Export Selected
          </Button>
          <Button variant="outline" onClick={onImportToGHL}>
            Import to GHL
          </Button>
          <Button variant="outline" onClick={onDelete} className="border-red-300 text-red-600 hover:bg-red-50">
            Delete Selected
          </Button>
        </div>
      </div>
    </div>
  );
}

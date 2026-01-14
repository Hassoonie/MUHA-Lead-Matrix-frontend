"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface JobTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, query: string, limit: number) => Promise<void>;
  initialQuery?: string;
  initialLimit?: number;
  isLoading?: boolean;
}

export default function JobTemplateModal({
  isOpen,
  onClose,
  onSave,
  initialQuery = "",
  initialLimit = 20,
  isLoading = false
}: JobTemplateModalProps) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState(initialQuery);
  const [limit, setLimit] = useState(initialLimit);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Template name is required");
      return;
    }

    if (!query.trim()) {
      setError("Query is required");
      return;
    }

    try {
      await onSave(name.trim(), query.trim(), limit);
      setName("");
      setQuery(initialQuery);
      setLimit(initialLimit);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save template");
    }
  };

  const handleClose = () => {
    setName("");
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Save as Template">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-black/70 mb-2">
            Template Name
          </label>
          <Input
            type="text"
            placeholder="e.g., Gyms in California"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black/70 mb-2">
            Query
          </label>
          <Input
            type="text"
            placeholder="Find 10 gyms in Los Angeles"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black/70 mb-2">
            Leads per Query
          </label>
          <Input
            type="number"
            min="1"
            max="100"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value) || 20)}
            disabled={isLoading}
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

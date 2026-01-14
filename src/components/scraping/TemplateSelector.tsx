"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { scrapeApi, JobTemplate } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";

interface TemplateSelectorProps {
  onSelectTemplate?: (template: JobTemplate) => void;
  showSaveButton?: boolean;
  initialQuery?: string;
  initialLimit?: number;
}

export default function TemplateSelector({
  onSelectTemplate,
  showSaveButton = false,
  initialQuery = "",
  initialLimit = 20
}: TemplateSelectorProps) {
  const router = useRouter();
  const { showError, showSuccess, showWarning } = useToast();
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await scrapeApi.templates.list();
      setTemplates(data);
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (template: JobTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    } else {
      // Default: start a new job from template
      try {
        const response = await scrapeApi.templates.startJob(template.template_id);
        router.push(`/scrape/${response.job_id}`);
      } catch (error: any) {
        showError(error.message || "Failed to start job from template");
      }
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      showWarning("Please enter a template name");
      return;
    }

    try {
      setSaving(true);
      await scrapeApi.templates.create({
        name: templateName.trim(),
        query: initialQuery,
        limit: initialLimit
      });
      setTemplateName("");
      setShowSaveModal(false);
      await loadTemplates();
      showSuccess("Template saved successfully!");
    } catch (error: any) {
      showError(error.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      await scrapeApi.templates.delete(templateId);
      await loadTemplates();
      showSuccess("Template deleted successfully");
    } catch (error: any) {
      showError(error.message || "Failed to delete template");
    }
  };

  if (loading) {
    return (
      <Card>
        <p className="text-black/70 text-center py-4">Loading templates...</p>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4">
        {showSaveButton && (
          <Button
            variant="outline"
            onClick={() => setShowSaveModal(true)}
            className="mb-4"
          >
            Save as Template
          </Button>
        )}
      </div>

      {templates.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-black/70 mb-4">No templates saved yet</p>
            {showSaveButton && (
              <Button variant="primary" onClick={() => setShowSaveModal(true)}>
                Create Your First Template
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.template_id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleUseTemplate(template)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-black">{template.name}</h3>
                <button
                  onClick={(e) => handleDeleteTemplate(template.template_id, e)}
                  className="text-red-500 hover:text-red-700 text-sm"
                  title="Delete template"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-black/70 mb-2">{template.query}</p>
              <div className="flex items-center gap-4 text-xs text-black/50">
                <span>Limit: {template.limit}</span>
                {template.niche && <span>• {template.niche}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Save Template Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => {
          setShowSaveModal(false);
          setTemplateName("");
        }}
        title="Save as Template"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black/70 mb-2">
              Template Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c5b26f]"
              placeholder="e.g., Gyms in California"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-black/50 mb-1">Query:</p>
            <p className="text-sm text-black/70">{initialQuery || "No query provided"}</p>
            <p className="text-xs text-black/50 mt-2 mb-1">Limit:</p>
            <p className="text-sm text-black/70">{initialLimit}</p>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveModal(false);
                setTemplateName("");
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveTemplate}
              disabled={saving || !templateName.trim()}
            >
              {saving ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

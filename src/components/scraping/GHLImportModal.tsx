"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import SuccessModal from "@/components/ui/SuccessModal";
import GHLImportForm from "./GHLImportForm";
import { Lead } from "@/lib/api";

interface GHLImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  leads: Lead[];
  selectedLeadIndices: number[];
  isLoading?: boolean;
}

export default function GHLImportModal({
  isOpen,
  onClose,
  jobId,
  leads,
  selectedLeadIndices,
  isLoading = false,
}: GHLImportModalProps) {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(isOpen);

  // Sync with parent isOpen prop
  useEffect(() => {
    setImportModalOpen(isOpen);
    if (!isOpen) {
      setShowSuccessModal(false); // Reset success modal when import modal closes
    }
  }, [isOpen]);

  const handleImportClose = () => {
    setImportModalOpen(false);
    onClose();
  };

  const handleImportSuccess = () => {
    // Close import modal
    setImportModalOpen(false);
    // Show success modal
    setShowSuccessModal(true);
  };

  return (
    <>
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onClose(); // Also close parent modal
        }}
        message="Success! Good job!"
        autoCloseDelay={3000}
      />
      <Modal isOpen={importModalOpen} onClose={handleImportClose} className="max-w-2xl">
        <GHLImportForm
          jobId={jobId}
          leads={leads}
          selectedLeadIndices={selectedLeadIndices}
          onClose={handleImportSuccess}
          isLoading={isLoading}
        />
      </Modal>
    </>
  );
}

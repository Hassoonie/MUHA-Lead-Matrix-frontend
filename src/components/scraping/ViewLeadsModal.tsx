"use client";

import Modal from "@/components/ui/Modal";
import { Lead } from "@/lib/api";

interface ViewLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  isLoading?: boolean;
  totalLeads?: number;
}

export default function ViewLeadsModal({ isOpen, onClose, leads, isLoading = false, totalLeads }: ViewLeadsModalProps) {
  const leadCount = leads?.length || 0;
  const title =
    typeof totalLeads === "number" && totalLeads > leadCount
      ? `All Leads (showing ${leadCount} of ${totalLeads})`
      : `All Leads (${leadCount})`;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className="max-w-5xl"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin h-8 w-8 text-[#c5b26f]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-black/70">Loading leads...</p>
            </div>
          </div>
        ) : !leads || leads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-black/70 mb-2">No leads to display</p>
            <p className="text-sm text-black/50">The leads may still be processing, or this scrape job didn't collect any leads.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((lead, index) => (
              <div
                key={index}
                className="p-4 border border-[#f0f5fa] rounded-lg hover:border-[#c5b26f]/30 transition-colors"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <p className="text-xs text-black/60 mb-1 uppercase tracking-wide-label">Name</p>
                    <p className="text-base font-semibold text-black">{lead.name || "-"}</p>
                  </div>

                  {/* Email */}
                  <div>
                    <p className="text-xs text-black/60 mb-1 uppercase tracking-wide-label">Email</p>
                    <p className="text-base text-black/80">
                      {lead.email ? (
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-black hover:text-[#c5b26f] transition-colors"
                        >
                          {lead.email}
                        </a>
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>

                  {/* Phone */}
                  <div>
                    <p className="text-xs text-black/60 mb-1 uppercase tracking-wide-label">Phone</p>
                    <p className="text-base text-black/80">
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="text-black hover:text-[#c5b26f] transition-colors"
                        >
                          {lead.phone}
                        </a>
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>

                  {/* Address */}
                  <div>
                    <p className="text-xs text-black/60 mb-1 uppercase tracking-wide-label">Address</p>
                    <p className="text-base text-black/80">{lead.address || "-"}</p>
                  </div>
                </div>

                {/* Additional info if available */}
                {(lead.website || lead.category) && (
                  <div className="mt-3 pt-3 border-t border-[#f0f5fa] grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lead.website && (
                      <div>
                        <p className="text-xs text-black/60 mb-1 uppercase tracking-wide-label">Website</p>
                        <a
                          href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base text-black/80 hover:text-[#c5b26f] transition-colors"
                        >
                          {lead.website}
                        </a>
                      </div>
                    )}
                    {lead.category && (
                      <div>
                        <p className="text-xs text-black/60 mb-1 uppercase tracking-wide-label">Category</p>
                        <p className="text-base text-black/80">{lead.category}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

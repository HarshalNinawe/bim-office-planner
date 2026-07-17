import React, { useState } from "react";
import { useProjectStore } from "../stores/projectStore";
import { runEngineeringCalculations } from "../calculations/calculationEngine";
import { API_BASE_URL } from "../config";

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({ isOpen, onClose }) => {
  const { project, materials } = useProjectStore();
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const generateReport = async (reportType: "executive_proposal" | "sustainability_report" | "risk_analysis" | "boq_summary") => {
    setIsLoading(true);
    setStatus("Generating audit report via Llama 3.3...");
    setReport(null);

    // Compute active calculations to feed as context
    const calculations = runEngineeringCalculations(project, materials);

    try {
      const response = await fetch(`${API_BASE_URL}/api/copilot/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType,
          projectState: project,
          calculations,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report.");
      }

      const data = await response.json();
      setReport(data.report);
      setStatus(null);
    } catch (err: unknown) {
      console.error(err);
      setStatus("Error: Failed to compile report.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-blueprint-panel/95 backdrop-blur-md border-l border-blueprint-line-dim/40 shadow-2xl z-40 flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-blueprint-line-dim/30">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blueprint-accent animate-pulse"></span>
          <span className="text-sm font-mono uppercase tracking-widest text-blueprint-line">AI Design Consultant</span>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-mono text-blueprint-text-dim hover:text-blueprint-text border border-blueprint-line-dim/30 px-2.5 py-1 rounded"
        >
          [ESC] CLOSE
        </button>
      </div>

      {/* Selector Dashboard */}
      <div className="p-4 bg-blueprint-bg/40 flex flex-wrap gap-2 border-b border-blueprint-line-dim/20">
        {[
          { id: "executive_proposal", label: "Executive Proposal" },
          { id: "sustainability_report", label: "Sustainability Audit" },
          { id: "risk_analysis", label: "Risk Analysis" },
          { id: "boq_summary", label: "BOQ Summary" },
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => generateReport(type.id as "executive_proposal" | "sustainability_report" | "risk_analysis" | "boq_summary")}
            disabled={isLoading}
            className="flex-1 min-w-[140px] px-3 py-2 text-left bg-blueprint-panel border border-blueprint-line-dim/40 rounded hover:border-blueprint-accent active:scale-95 transition-all text-xs font-mono text-blueprint-text disabled:opacity-50"
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {status && (
          <div className="text-xs font-mono text-blueprint-accent py-2 px-3 border border-blueprint-accent/20 bg-blueprint-accent/5 rounded animate-pulse">
            {status}
          </div>
        )}

        {report ? (
          <div className="prose prose-invert max-w-none text-xs font-mono whitespace-pre-wrap leading-relaxed text-blueprint-text border border-blueprint-line-dim/30 p-4 rounded bg-blueprint-bg/20 overflow-x-auto">
            {report}
          </div>
        ) : (
          !isLoading && (
            <div className="text-center py-20 text-xs font-mono text-blueprint-text-dim">
              Select a report type above to draft an AI architectural audit report.
            </div>
          )
        )}
      </div>

      {/* Footer Actions */}
      {report && (
        <div className="p-4 border-t border-blueprint-line-dim/30 bg-blueprint-bg/30 flex gap-2 justify-end">
          <button
            onClick={() => {
              navigator.clipboard.writeText(report);
              alert("Report copied to clipboard.");
            }}
            className="px-3 py-1.5 text-xs font-mono border border-blueprint-line-dim/50 text-blueprint-text hover:border-blueprint-line rounded transition-all"
          >
            COPY REPORT
          </button>
        </div>
      )}
    </div>
  );
};

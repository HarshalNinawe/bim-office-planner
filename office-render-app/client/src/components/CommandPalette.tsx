import React, { useState, useEffect } from "react";
import { useProjectStore } from "../stores/projectStore";
import type { ScenarioType } from "../types/project";
import { API_BASE_URL } from "../config";

interface CommandAction {
  type: "UPDATE_FLOORS" | "SET_EMPLOYEES" | "UPDATE_BUILDING_DIMENSIONS" | "SET_SCENARIO" | "REPLACE_MATERIAL";
  category?: string;
  target?: string;
  value: string | number | boolean;
  length?: number;
  width?: number;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const { project, updateBuildingDetails, updateProjectDetails, setScenario, updateActiveScenarioMaterials } = useProjectStore();

  // Listen for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setStatus(null);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setStatus("Analyzing command with Llama 3.3...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/copilot/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: query,
          projectState: project,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process command.");
      }

      const data = await response.json();
      const actions = data.actions as CommandAction[];

      if (!actions || actions.length === 0) {
        setStatus("No clear design actions could be mapped. Try phrasing differently.");
        setIsLoading(false);
        return;
      }

      // Apply structured actions to Zustand store
      actions.forEach((action) => {
        switch (action.type) {
          case "UPDATE_FLOORS":
            updateBuildingDetails({ floors: Number(action.value) });
            break;
          case "SET_EMPLOYEES":
            updateProjectDetails({ employees: Number(action.value) });
            break;
          case "UPDATE_BUILDING_DIMENSIONS": {
            const dimUpdate: { length?: number; width?: number } = {};
            if (action.length !== undefined) dimUpdate.length = Number(action.length);
            if (action.width !== undefined) dimUpdate.width = Number(action.width);
            updateBuildingDetails(dimUpdate);
            break;
          }
          case "SET_SCENARIO":
            setScenario(action.value as ScenarioType);
            break;
          case "REPLACE_MATERIAL":
            if (action.category) {
              updateActiveScenarioMaterials({ [action.category]: action.value as string });
            }
            break;
          default:
            console.warn("Unknown action type:", action.type);
        }
      });

      setStatus(`Successfully applied ${actions.length} action(s).`);
      setQuery("");
      setTimeout(() => {
        setIsOpen(false);
      }, 1200);
    } catch (err: unknown) {
      console.error(err);
      setStatus("Error: Failed to contact AI Copilot.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-blueprint-bg/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-blueprint-panel border border-blueprint-line/40 rounded shadow-2xl p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-blueprint-line-dim/30 pb-2">
          <span className="text-xs font-mono uppercase tracking-widest text-blueprint-line">Command Palette [Ctrl+K]</span>
          <span className="text-[10px] text-blueprint-text-dim">[Esc] Close</span>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. 'Increase floors to 6' or 'Replace material concrete with conc_low'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-blueprint-bg border border-blueprint-line-dim/40 rounded px-3 py-2 text-xs font-mono text-blueprint-text placeholder-blueprint-line-dim outline-none focus:border-blueprint-accent"
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-4 py-2 bg-blueprint-accent text-blueprint-bg font-bold font-mono text-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            EXECUTE
          </button>
        </form>

        {status && (
          <div className="text-[11px] font-mono text-blueprint-accent py-1 px-2 border border-blueprint-accent/20 bg-blueprint-accent/5 rounded">
            {status}
          </div>
        )}

        <div className="text-[10px] text-blueprint-text-dim font-mono mt-1">
          <strong>Tip:</strong> You can command adjustments to dimensions, floor counts, occupant loads, active scenarios, or material substitutions.
        </div>
      </div>
    </div>
  );
};

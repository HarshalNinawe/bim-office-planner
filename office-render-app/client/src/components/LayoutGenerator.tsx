import React, { useState } from "react";
import { Wand2, ChevronDown, ChevronUp, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useProjectStore } from "../stores/projectStore";
import type { GeneratedLayout } from "../stores/projectStore";
import { API_BASE_URL } from "../config";

const QUICK_PROMPTS = [
  "Sustainable campus for 200 employees, 4 floors, solar panels and garden",
  "Cost-optimized 3-floor office for 150 staff with large parking lot",
  "Premium executive headquarters, 5 floors, 300 people, luxury garden",
  "High-density tech hub for 500 employees, 8 floors, minimal footprint",
  "Small startup office, 50 people, 2 floors, eco-friendly design",
];

type GeneratorState = "idle" | "loading" | "preview" | "error";

export const LayoutGenerator: React.FC = () => {
  const { project, applyGeneratedLayout } = useProjectStore();

  const [isExpanded, setIsExpanded] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<GeneratorState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<GeneratedLayout | null>(null);

  const generate = async (overridePrompt?: string) => {
    const finalPrompt = (overridePrompt ?? prompt).trim();
    if (!finalPrompt) return;

    setState("loading");
    setErrorMsg(null);
    setPreview(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/copilot/generate-layout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          siteConstraints: { length: project.site.length, width: project.site.width },
          employees: project.employees,
        }),
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);

      const layout: GeneratedLayout = await response.json();

      if (!layout.building || !Array.isArray(layout.elements)) {
        throw new Error("AI returned an incomplete layout. Please try again.");
      }

      setPreview(layout);
      setState("preview");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setErrorMsg(msg);
      setState("error");
    }
  };

  const applyLayout = () => {
    if (!preview) return;
    applyGeneratedLayout(preview);
    setPreview(null);
    setPrompt("");
    setState("idle");
  };

  const discard = () => {
    setPreview(null);
    setState("idle");
  };

  return (
    <div className="flex flex-col gap-2 border border-blueprint-accent/30 rounded bg-blueprint-accent/5">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="flex items-center justify-between px-3 py-2 text-xs font-mono uppercase tracking-widest text-blueprint-accent w-full"
      >
        <span className="flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5" />
          00 - AI Layout Generator
        </span>
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {isExpanded && (
        <div className="flex flex-col gap-3 px-3 pb-3">
          {/* Prompt Input */}
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={state === "loading"}
            placeholder={"Describe your office requirements...\ne.g. 'Sustainable campus for 250 employees, 5 floors, rooftop garden and solar panels'"}
            className="w-full bg-blueprint-bg border border-blueprint-line-dim/40 rounded px-2.5 py-2 text-[10px] font-mono text-blueprint-text placeholder-blueprint-line-dim/60 outline-none focus:border-blueprint-accent resize-none leading-relaxed disabled:opacity-50"
          />

          {/* Quick Prompts */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono text-blueprint-text-dim uppercase tracking-wider">Quick Start</span>
            <div className="flex flex-col gap-1">
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp}
                  onClick={() => {
                    setPrompt(qp);
                    generate(qp);
                  }}
                  disabled={state === "loading"}
                  className="text-left text-[9px] font-mono text-blueprint-text-dim hover:text-blueprint-accent border border-blueprint-line-dim/20 hover:border-blueprint-accent/40 rounded px-2 py-1 transition-all disabled:opacity-40 truncate"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          {state !== "preview" && (
            <button
              onClick={() => generate()}
              disabled={state === "loading" || !prompt.trim()}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-blueprint-accent text-blueprint-bg text-[10px] font-bold font-mono uppercase tracking-widest rounded hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              {state === "loading" ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-3 h-3" />
                  Generate Layout
                </>
              )}
            </button>
          )}

          {/* Error State */}
          {state === "error" && errorMsg && (
            <div className="flex items-start gap-2 p-2 bg-blueprint-danger/10 border border-blueprint-danger/30 rounded text-[10px] font-mono text-blueprint-danger">
              <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Card */}
          {state === "preview" && preview && (
            <div className="flex flex-col gap-2 border border-blueprint-accent/40 rounded bg-blueprint-accent/5 p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-blueprint-accent font-bold">
                <CheckCircle className="w-3 h-3" />
                Layout Ready - Preview
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono">
                <span className="text-blueprint-text-dim">Project:</span>
                <span className="text-blueprint-text truncate">{preview.projectName}</span>
                <span className="text-blueprint-text-dim">Scenario:</span>
                <span className="text-blueprint-text capitalize">{preview.scenario.replace(/_/g, " ")}</span>
                <span className="text-blueprint-text-dim">Employees:</span>
                <span className="text-blueprint-text">{preview.employees}</span>
                <span className="text-blueprint-text-dim">Floors:</span>
                <span className="text-blueprint-text">{preview.building.floors}</span>
                <span className="text-blueprint-text-dim">Building:</span>
                <span className="text-blueprint-text">{preview.building.length}m x {preview.building.width}m</span>
                <span className="text-blueprint-text-dim">Elements:</span>
                <span className="text-blueprint-text">{preview.elements.length} placed</span>
              </div>

              {/* Element type summary badges */}
              <div className="flex flex-wrap gap-1 mt-1">
                {[...new Set(preview.elements.map((e) => e.type))].map((t) => {
                  const count = preview.elements.filter((e) => e.type === t).length;
                  return (
                    <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 bg-blueprint-panel/60 border border-blueprint-line-dim/30 rounded text-blueprint-text-dim">
                      {count}x {t.replace(/_/g, " ")}
                    </span>
                  );
                })}
              </div>

              <div className="flex gap-1.5 mt-1">
                <button
                  onClick={applyLayout}
                  className="flex-1 py-1.5 bg-blueprint-accent text-blueprint-bg text-[10px] font-bold font-mono uppercase rounded hover:opacity-90 active:scale-95 transition-all"
                >
                  Apply to Canvas
                </button>
                <button
                  onClick={discard}
                  className="px-3 py-1.5 border border-blueprint-line-dim/40 text-blueprint-text-dim text-[10px] font-mono rounded hover:border-blueprint-danger/50 hover:text-blueprint-danger transition-all"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

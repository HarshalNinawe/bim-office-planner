import { useState } from "react";
import { useProjectStore } from "./stores/projectStore";
import { runEngineeringCalculations } from "./calculations/calculationEngine";
import { runConstraintValidation } from "./constraints/constraintEngine";
import { SVGCanvas } from "./components/SVGCanvas";
import { DashboardTab } from "./components/DashboardTab";
import { CommandPalette } from "./components/CommandPalette";
import { CopilotDrawer } from "./components/CopilotDrawer";
import { LayoutGenerator } from "./components/LayoutGenerator";
import type { ScenarioType, DesignElement, Material, DesignWarning } from "./types/project";
import { 
  Building as BuildingIcon, 
  Map, 
  Sparkles, 
  AlertTriangle, 
  Settings, 
  Wrench, 
  Layers, 
  DollarSign, 
  Clock, 
  Trees, 
  Cpu
} from "lucide-react";

function App() {
  const [activeTab, setActiveTab] = useState<"site-plan" | "analytics">("site-plan");
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const { 
    project, 
    materials, 
    selectedElementId, 
    updateBuildingDetails, 
    updateProjectDetails, 
    setScenario, 
    updateActiveScenarioMaterials,
    addElement,
    removeElement,
    updateElement,
    undo,
    redo
  } = useProjectStore();

  const activeScenarioKey = project.activeScenario;
  const activeScenario = project.scenarios[activeScenarioKey];
  const building = activeScenario.building;
  const elements = activeScenario.elements;

  // Run Calculations and Constraint validations dynamically
  const calculations = runEngineeringCalculations(project, materials);
  const warnings = runConstraintValidation(project, materials);

  // Inspector logic: find selected element
  const selectedElement = elements.find((el: DesignElement) => el.id === selectedElementId);
  const isBuildingSelected = selectedElementId === "building";

  // Helper to add standard design components
  const spawnElement = (type: "parking" | "road" | "tree" | "solar_panel" | "utility_hub") => {
    let name = "Object";
    let w = 5;
    let h = 5;
    if (type === "parking") { name = "Parking Bay"; w = 15; h = 10; }
    else if (type === "road") { name = "Road Overlay"; w = 6; h = 30; }
    else if (type === "tree") { name = "Green Vegetation"; w = 3; h = 3; }
    else if (type === "solar_panel") { name = "Solar Collector"; w = 6; h = 4; }
    else if (type === "utility_hub") { name = "Utility Station"; w = 8; h = 8; }

    addElement({
      type,
      x: 60,
      y: 40,
      width: w,
      height: h,
      rotation: 0,
      locked: false,
      visible: true,
      name
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-blueprint-bg text-blueprint-text overflow-hidden font-sans">
      {/* Top Header Control Bar */}
      <header className="flex items-center justify-between px-6 py-2.5 border-b border-blueprint-line-dim/30 bg-blueprint-panel/40 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <BuildingIcon className="w-5 h-5 text-blueprint-line" />
          <span className="text-sm font-bold tracking-widest text-blueprint-line font-mono">BIM_PLANNER</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-blueprint-line-dim/50 text-blueprint-text-dim uppercase font-mono">{activeScenario.name}</span>
        </div>
        
        {/* Undo/Redo & Tabs */}
        <div className="flex items-center gap-4">
          <div className="flex gap-1 border-r border-blueprint-line-dim/20 pr-4">
            <button onClick={undo} className="px-2 py-1 text-xs font-mono border border-blueprint-line-dim/30 hover:border-blueprint-accent text-blueprint-text-dim rounded transition-all">UNDO</button>
            <button onClick={redo} className="px-2 py-1 text-xs font-mono border border-blueprint-line-dim/30 hover:border-blueprint-accent text-blueprint-text-dim rounded transition-all">REDO</button>
          </div>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("site-plan")}
              className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase rounded transition-all ${
                activeTab === "site-plan"
                  ? "bg-blueprint-accent/15 text-blueprint-accent border border-blueprint-accent/30"
                  : "text-blueprint-text-dim hover:text-blueprint-text border border-transparent"
              }`}
            >
              SITE PLAN
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase rounded transition-all ${
                activeTab === "analytics"
                  ? "bg-blueprint-accent/15 text-blueprint-accent border border-blueprint-accent/30"
                  : "text-blueprint-text-dim hover:text-blueprint-text border border-transparent"
              }`}
            >
              ANALYTICS DASHBOARD
            </button>
          </nav>
        </div>

        {/* AI & Export Options */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCopilotOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono border border-blueprint-accent/50 text-blueprint-accent hover:bg-blueprint-accent/10 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI COPILOT
          </button>
          <button 
            onClick={() => {
              const svgEl = document.querySelector("svg");
              if (!svgEl) return;
              const serializer = new XMLSerializer();
              let source = serializer.serializeToString(svgEl);
              source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
              const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", url);
              downloadAnchor.setAttribute("download", "office_concept_plan.svg");
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="px-2.5 py-1 text-xs font-mono border border-blueprint-line-dim/50 text-blueprint-text hover:border-blueprint-line transition-all"
          >
            EXPORT SVG
          </button>
          <button 
            onClick={() => {
              let csvContent = "data:text/csv;charset=utf-8,Category,Quantity,Cost (USD)\n";
              csvContent += `Concrete Volume,${calculations.concreteVolume.toFixed(1)} m3,$${Math.round(calculations.concreteVolume * 120).toLocaleString()}\n`;
              csvContent += `Steel Mass,${(calculations.steelMass / 1000).toFixed(1)} tons,$${Math.round((calculations.steelMass / 1000) * 850).toLocaleString()}\n`;
              csvContent += `Glass Area,${calculations.glazingArea.toFixed(1)} m2,$${Math.round(calculations.glazingArea * 250).toLocaleString()}\n`;
              csvContent += `Brick Count,${calculations.brickCount.toFixed(0)} units,$${Math.round(calculations.brickCount * 0.65).toLocaleString()}\n`;
              csvContent += `Roofing Area,${calculations.roofArea.toFixed(1)} m2,$${Math.round(calculations.roofArea * 45).toLocaleString()}\n`;
              csvContent += `Total Project Cost,,$${Math.round(calculations.totalProjectCost).toLocaleString()}\n`;
              
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "bill_of_quantities_cost_report.csv");
              document.body.appendChild(link);
              link.click();
              link.remove();
            }}
            className="px-2.5 py-1 text-xs font-mono border border-blueprint-line-dim/50 text-blueprint-text hover:border-blueprint-line transition-all"
          >
            EXPORT CSV
          </button>
          <button 
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `${project.name.toLowerCase().replace(/ /g, "_")}_config.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="px-3 py-1 text-xs font-mono bg-blueprint-line text-blueprint-bg font-bold hover:opacity-90 active:scale-95 transition-all"
          >
            EXPORT JSON
          </button>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Layout Settings & Catalog */}
        <aside className="w-72 border-r border-blueprint-line-dim/30 bg-blueprint-panel/10 backdrop-blur-sm p-4 overflow-y-auto flex flex-col gap-5">
          
          {/* Section 00: AI Layout Generator */}
          <LayoutGenerator />

          {/* Section 1: Plot Dimensions */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-mono uppercase tracking-widest text-blueprint-line border-b border-blueprint-line-dim/20 pb-1 flex items-center gap-1.5"><Map className="w-3.5 h-3.5" /> 01 - Site Dimensions</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex flex-col gap-1">
                <label className="text-blueprint-text-dim">Length (m)</label>
                <input 
                  type="number" 
                  value={project.site.length} 
                  onChange={(e) => updateProjectDetails({ site: { ...project.site, length: Number(e.target.value) } })}
                  className="bg-blueprint-bg border border-blueprint-line-dim/35 rounded px-2 py-1 outline-none text-blueprint-text focus:border-blueprint-accent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-blueprint-text-dim">Width (m)</label>
                <input 
                  type="number" 
                  value={project.site.width} 
                  onChange={(e) => updateProjectDetails({ site: { ...project.site, width: Number(e.target.value) } })}
                  className="bg-blueprint-bg border border-blueprint-line-dim/35 rounded px-2 py-1 outline-none text-blueprint-text focus:border-blueprint-accent"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Building Parameters */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-mono uppercase tracking-widest text-blueprint-line border-b border-blueprint-line-dim/20 pb-1 flex items-center gap-1.5"><BuildingIcon className="w-3.5 h-3.5" /> 02 - Building Specs</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex flex-col gap-1">
                <label className="text-blueprint-text-dim">Floors</label>
                <input 
                  type="number" 
                  min={1}
                  value={building.floors} 
                  onChange={(e) => updateBuildingDetails({ floors: Number(e.target.value) })}
                  className="bg-blueprint-bg border border-blueprint-line-dim/35 rounded px-2 py-1 outline-none text-blueprint-text focus:border-blueprint-accent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-blueprint-text-dim">Occupants</label>
                <input 
                  type="number" 
                  min={1}
                  value={project.employees} 
                  onChange={(e) => updateProjectDetails({ employees: Number(e.target.value) })}
                  className="bg-blueprint-bg border border-blueprint-line-dim/35 rounded px-2 py-1 outline-none text-blueprint-text focus:border-blueprint-accent"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Scenario Selector */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-blueprint-line border-b border-blueprint-line-dim/20 pb-1 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> 03 - Active Scenario</span>
            <select
              value={activeScenarioKey}
              onChange={(e) => setScenario(e.target.value as ScenarioType)}
              className="w-full bg-blueprint-bg border border-blueprint-line-dim/40 rounded p-1.5 text-xs font-mono outline-none text-blueprint-text focus:border-blueprint-accent"
            >
              <option value="current">Current Design</option>
              <option value="cost_optimized">Cost Optimized</option>
              <option value="sustainable">Green Sustainable</option>
              <option value="high_capacity">Max Occupancy</option>
              <option value="premium">Premium Office Layout</option>
            </select>
          </div>

          {/* Section 4: Material Configurations */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-mono uppercase tracking-widest text-blueprint-line border-b border-blueprint-line-dim/20 pb-1 flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5" /> 04 - Material Specs</span>
            <div className="flex flex-col gap-2 text-[11px] font-mono">
              {[
                { category: "concrete", label: "Concrete Mix" },
                { category: "steel", label: "Structural Steel" },
                { category: "glass", label: "Glazing Glass" },
                { category: "brick", label: "Facade Brick" },
                { category: "roofing", label: "Roof System" }
              ].map((item) => {
                const activeId = activeScenario.materials[item.category] || "";
                const filtered = materials.filter((m: Material) => m.category === item.category);

                return (
                  <div key={item.category} className="flex flex-col gap-0.5">
                    <label className="text-blueprint-text-dim">{item.label}</label>
                    <select
                      value={activeId}
                      onChange={(e) => updateActiveScenarioMaterials({ [item.category]: e.target.value })}
                      className="bg-blueprint-bg border border-blueprint-line-dim/35 rounded p-1 outline-none text-blueprint-text focus:border-blueprint-accent"
                    >
                      {filtered.map((m: Material) => (
                        <option key={m.id} value={m.id}>{m.name} (${m.cost}/{m.unit})</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: Component Toolbox catalog */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-mono uppercase tracking-widest text-blueprint-line border-b border-blueprint-line-dim/20 pb-1 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> 05 - Element Catalog</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { type: "parking", label: "Parking Bay" },
                { type: "road", label: "Road Access" },
                { type: "tree", label: "Vegetation" },
                { type: "solar_panel", label: "Solar Panel" },
                { type: "utility_hub", label: "Utility Hub" }
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => spawnElement(item.type as "parking" | "road" | "tree" | "solar_panel" | "utility_hub")}
                  className="px-2 py-1.5 bg-blueprint-panel/40 border border-blueprint-line-dim/40 rounded text-left font-mono text-[10px] text-blueprint-text hover:border-blueprint-accent hover:bg-blueprint-accent/10 active:scale-95 transition-all"
                >
                  + {item.label}
                </button>
              ))}
            </div>
          </div>

        </aside>

        {/* Center Workspace */}
        <section className="flex-1 relative flex flex-col bg-blueprint-bg">
          {activeTab === "site-plan" ? <SVGCanvas /> : <DashboardTab />}
        </section>

        {/* Right Side: Live Inspector & warnings */}
        <aside className="w-72 border-l border-blueprint-line-dim/30 bg-blueprint-panel/10 backdrop-blur-sm p-4 overflow-y-auto flex flex-col gap-5">
          
          {/* Inspector Panel */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-mono uppercase tracking-widest text-blueprint-line border-b border-blueprint-line-dim/20 pb-1 flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" /> 06 - Canvas Inspector</span>
            
            {isBuildingSelected ? (
              <div className="flex flex-col gap-2 text-xs font-mono">
                <div className="text-blueprint-line font-bold uppercase">Building Footprint</div>
                <div className="flex justify-between border-b border-blueprint-line-dim/10 pb-1">
                  <span className="text-blueprint-text-dim">Length:</span>
                  <span>{building.length.toFixed(1)}m</span>
                </div>
                <div className="flex justify-between border-b border-blueprint-line-dim/10 pb-1">
                  <span className="text-blueprint-text-dim">Width:</span>
                  <span>{building.width.toFixed(1)}m</span>
                </div>
                <div className="flex justify-between border-b border-blueprint-line-dim/10 pb-1">
                  <span className="text-blueprint-text-dim">Rotation:</span>
                  <span>{building.rotation.toFixed(0)}°</span>
                </div>
                <div className="flex justify-between border-b border-blueprint-line-dim/10 pb-1">
                  <span className="text-blueprint-text-dim">Floor Area:</span>
                  <span>{calculations.footprintArea.toFixed(1)}m²</span>
                </div>
              </div>
            ) : selectedElement ? (
              <div className="flex flex-col gap-2.5 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-blueprint-line font-bold uppercase">{selectedElement.name}</span>
                  <button 
                    onClick={() => removeElement(selectedElement.id)}
                    className="text-[9px] px-1 bg-blueprint-danger/20 text-blueprint-danger border border-blueprint-danger/30 rounded"
                  >
                    DELETE
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-blueprint-text-dim">Width (m)</label>
                  <input 
                    type="number" 
                    value={selectedElement.width} 
                    onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                    className="bg-blueprint-bg border border-blueprint-line-dim/35 rounded px-2 py-0.5 outline-none text-blueprint-text focus:border-blueprint-accent"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-blueprint-text-dim">Height (m)</label>
                  <input 
                    type="number" 
                    value={selectedElement.height} 
                    onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                    className="bg-blueprint-bg border border-blueprint-line-dim/35 rounded px-2 py-0.5 outline-none text-blueprint-text focus:border-blueprint-accent"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-blueprint-text-dim">Rotation (deg)</label>
                  <input 
                    type="number" 
                    value={selectedElement.rotation} 
                    onChange={(e) => updateElement(selectedElement.id, { rotation: Number(e.target.value) })}
                    className="bg-blueprint-bg border border-blueprint-line-dim/35 rounded px-2 py-0.5 outline-none text-blueprint-text focus:border-blueprint-accent"
                  />
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-blueprint-text-dim font-mono">Select building or element on canvas to inspect.</div>
            )}
          </div>

          {/* Conceptual calculations display */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-mono uppercase tracking-widest text-blueprint-line border-b border-blueprint-line-dim/20 pb-1 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> 07 - Live Feasibility</span>
            
            <div className="flex flex-col gap-2 text-xs font-mono">
              <div className="flex justify-between border-b border-blueprint-line-dim/10 pb-1">
                <span className="text-blueprint-text-dim">Est Project Cost:</span>
                <span className="text-blueprint-accent font-bold">${Math.round(calculations.totalProjectCost).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-blueprint-line-dim/10 pb-1 text-[11px]">
                <span className="text-blueprint-text-dim">- Material Cost:</span>
                <span>${Math.round(calculations.totalMaterialCost).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-blueprint-line-dim/10 pb-1 text-[11px]">
                <span className="text-blueprint-text-dim">- Labor Cost:</span>
                <span>${Math.round(calculations.totalProjectCost - calculations.totalMaterialCost).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-blueprint-line-dim/10 pb-1">
                <span className="text-blueprint-text-dim flex items-center gap-1"><Clock className="w-3 h-3 text-blueprint-line-dim" /> Construction:</span>
                <span className="text-blueprint-text">{calculations.constructionDurationWeeks} weeks</span>
              </div>
              <div className="flex justify-between border-b border-blueprint-line-dim/10 pb-1">
                <span className="text-blueprint-text-dim flex items-center gap-1"><Trees className="w-3 h-3 text-blueprint-success" /> Carbon Index:</span>
                <span className="text-blueprint-danger font-bold">{calculations.embodiedCarbonTons.toFixed(0)} T</span>
              </div>
              <div className="flex justify-between border-b border-blueprint-line-dim/10 pb-1">
                <span className="text-blueprint-text-dim">Energy Score:</span>
                <span className="text-blueprint-success font-bold">{calculations.energyEfficiencyScore}/100</span>
              </div>
              <div className="flex justify-between border-b border-blueprint-line-dim/10 pb-1">
                <span className="text-blueprint-text-dim">Occupants Limit:</span>
                <span>{calculations.occupancyLimit} / {project.employees} max</span>
              </div>
            </div>
          </div>

          {/* Validation warnings panel */}
          <div className="flex flex-col gap-2.5 flex-1 overflow-hidden">
            <span className="text-xs font-mono uppercase tracking-widest text-blueprint-line border-b border-blueprint-line-dim/20 pb-1 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> 08 - Constraint Engine</span>
            
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
              {warnings.length === 0 ? (
                <div className="text-[10px] text-blueprint-success font-mono">✔ All codes pass. Layout complies.</div>
              ) : (
                warnings.map((warn: DesignWarning) => (
                  <div 
                    key={warn.id} 
                    className={`p-2 border text-[10px] font-mono rounded flex flex-col gap-0.5 ${
                      warn.severity === "error" 
                        ? "bg-blueprint-danger/10 border-blueprint-danger/30 text-blueprint-danger" 
                        : "bg-blueprint-accent/10 border-blueprint-accent/30 text-blueprint-accent"
                    }`}
                  >
                    <span className="font-bold uppercase tracking-wider">{warn.code}</span>
                    <span>{warn.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </aside>

      </main>

      {/* Global Command Palette Overlay (Ctrl+K) */}
      <CommandPalette />

      {/* AI Copilot Drawer */}
      <CopilotDrawer isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
    </div>
  );
}

export default App;

import React from "react";
import { useProjectStore } from "../stores/projectStore";
import { runEngineeringCalculations } from "../calculations/calculationEngine";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { ScenarioType } from "../types/project";

export const DashboardTab: React.FC = () => {
  const { project, materials } = useProjectStore();

  // Compute metrics for all scenarios side-by-side
  const scenarioOptions = Object.keys(project.scenarios) as ScenarioType[];
  const scenarioComparisonData = scenarioOptions.map((key) => {
    const tempProj = { ...project, activeScenario: key };
    const calc = runEngineeringCalculations(tempProj, materials);
    return {
      name: project.scenarios[key].name,
      costK: Math.round(calc.totalProjectCost / 1000), // In thousands
      carbonTons: Math.round(calc.embodiedCarbonTons),
      energyScore: calc.energyEfficiencyScore,
      durationWeeks: calc.constructionDurationWeeks,
      parking: calc.parkingCapacity,
    };
  });

  // Cost distribution data for current scenario
  const activeScenario = project.scenarios[project.activeScenario];
  const getMatCost = (cat: string, defCost: number) => {
    const activeMatId = activeScenario.materials[cat];
    const mat = materials.find((m) => m.id === activeMatId);
    return mat?.cost || defCost;
  };

  const footprint = activeScenario.building.length * activeScenario.building.width;
  const floors = activeScenario.building.floors;
  const perimeter = 2 * (activeScenario.building.length + activeScenario.building.width);
  const facadeArea = perimeter * floors * 3.5;
  const windowCount = generateMockWindowCount(activeScenario.building.length, activeScenario.building.width);
  const glazingArea = windowCount * 2.0 * 1.8;
  const brickArea = Math.max(0, facadeArea - glazingArea);

  const concreteVolume = footprint * 0.2 * floors * 1.25;
  const steelMass = concreteVolume * 110;

  const costBreakdown = [
    { name: "Concrete", value: Math.round(concreteVolume * getMatCost("concrete", 120)) },
    { name: "Steel", value: Math.round((steelMass / 1000) * getMatCost("steel", 850)) },
    { name: "Glass Facade", value: Math.round(glazingArea * getMatCost("glass", 250)) },
    { name: "Brick Masonry", value: Math.round(brickArea * 50 * getMatCost("brick", 0.65)) },
    { name: "Roofing", value: Math.round(footprint * getMatCost("roofing", 45)) },
  ].filter((item) => item.value > 0);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 bg-blueprint-bg text-blueprint-text">
      {/* Title */}
      <div>
        <h2 className="text-lg font-mono uppercase tracking-widest text-blueprint-line">Scenario Comparison &amp; Conceptual Cost Estimations</h2>
        <p className="text-xs text-blueprint-text-dim mt-1">Calculations are conceptual planning estimates only (Not for structural certification).</p>
      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Cost Optimization Graph */}
        <div className="p-4 bg-blueprint-panel/30 border border-blueprint-line-dim/30 rounded backdrop-blur-sm">
          <h3 className="text-xs font-mono uppercase tracking-widest text-blueprint-line mb-4">Conceptual Cost comparison ($k)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scenarioComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(127, 209, 232, 0.05)" />
                <XAxis dataKey="name" stroke="var(--color-blueprint-text-dim)" tick={{ fontSize: 9 }} />
                <YAxis stroke="var(--color-blueprint-text-dim)" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--color-blueprint-bg)", borderColor: "var(--color-blueprint-line-dim)" }} />
                <Bar dataKey="costK" fill="var(--color-blueprint-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Embodied Carbon Graph */}
        <div className="p-4 bg-blueprint-panel/30 border border-blueprint-line-dim/30 rounded backdrop-blur-sm">
          <h3 className="text-xs font-mono uppercase tracking-widest text-blueprint-line mb-4">Carbon Footprint comparison (Tons CO2)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scenarioComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(127, 209, 232, 0.05)" />
                <XAxis dataKey="name" stroke="var(--color-blueprint-text-dim)" tick={{ fontSize: 9 }} />
                <YAxis stroke="var(--color-blueprint-text-dim)" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--color-blueprint-bg)", borderColor: "var(--color-blueprint-line-dim)" }} />
                <Bar dataKey="carbonTons" fill="var(--color-blueprint-danger)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current Scenario Cost Distribution */}
        <div className="p-4 bg-blueprint-panel/30 border border-blueprint-line-dim/30 rounded backdrop-blur-sm flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full">
            <h3 className="text-xs font-mono uppercase tracking-widest text-blueprint-line mb-4">Current Material Cost Distribution</h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {costBreakdown.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${(value as number).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Legend Table */}
          <div className="flex flex-col gap-2 text-xs font-mono w-full md:w-48">
            {costBreakdown.map((item, index) => (
              <div key={item.name} className="flex justify-between items-center border-b border-blueprint-line-dim/20 pb-1">
                <span className="flex items-center gap-1.5 text-blueprint-text-dim">
                  <span className="w-2.5 h-2.5 inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  {item.name}
                </span>
                <span className="text-blueprint-text font-bold">${item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Energy efficiency & duration side-by-side summary table */}
        <div className="p-4 bg-blueprint-panel/30 border border-blueprint-line-dim/30 rounded backdrop-blur-sm">
          <h3 className="text-xs font-mono uppercase tracking-widest text-blueprint-line mb-4">Operational Feasibility comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead>
                <tr className="border-b border-blueprint-line-dim/40 text-blueprint-line">
                  <th className="pb-2">Scenario</th>
                  <th className="pb-2 text-center">Energy Score</th>
                  <th className="pb-2 text-center">Duration (wks)</th>
                  <th className="pb-2 text-center">Parking</th>
                </tr>
              </thead>
              <tbody>
                {scenarioComparisonData.map((sc) => (
                  <tr key={sc.name} className="border-b border-blueprint-line-dim/10 hover:bg-blueprint-panel/10">
                    <td className="py-2 text-blueprint-text">{sc.name}</td>
                    <td className="py-2 text-center text-blueprint-success font-bold">{sc.energyScore}/100</td>
                    <td className="py-2 text-center text-blueprint-accent">{sc.durationWeeks} weeks</td>
                    <td className="py-2 text-center text-blueprint-text-dim">{sc.parking} slots</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

// Quick helper to duplicate window count formula
function generateMockWindowCount(length: number, width: number): number {
  const frontBackCount = Math.floor((length - 1.0) / 3.0) * 2;
  const sidesCount = Math.floor((width - 1.0) / 3.0) * 2;
  return frontBackCount + sidesCount;
}

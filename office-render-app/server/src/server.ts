import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

// Fallback rule-based parsing in case of Invalid API Key or network offline
function mockCommandParser(command: string, projectState: any) {
  const actions: any[] = [];
  const lower = command.toLowerCase();

  if (lower.includes("floor")) {
    const match = lower.match(/\b\d+\b/);
    if (match) actions.push({ type: "UPDATE_FLOORS", value: parseInt(match[0]) });
  }

  if (lower.includes("employee") || lower.includes("occupant") || lower.includes("people")) {
    const match = lower.match(/\b\d+\b/);
    if (match) actions.push({ type: "SET_EMPLOYEES", value: parseInt(match[0]) });
  }

  if (lower.includes("green") || lower.includes("garden")) {
    const match = lower.match(/\b\d+\b/);
    if (match) actions.push({ type: "SET_GREEN_AREA", value: parseInt(match[0]) });
  }

  if (lower.includes("scenario") || lower.includes("design")) {
    if (lower.includes("cost")) actions.push({ type: "SET_SCENARIO", value: "cost_optimized" });
    else if (lower.includes("sustain") || lower.includes("green")) actions.push({ type: "SET_SCENARIO", value: "sustainable" });
    else if (lower.includes("high") || lower.includes("max")) actions.push({ type: "SET_SCENARIO", value: "high_capacity" });
    else if (lower.includes("premium")) actions.push({ type: "SET_SCENARIO", value: "premium" });
  }

  if (lower.includes("glass") || lower.includes("concrete") || lower.includes("steel") || lower.includes("brick") || lower.includes("roof")) {
    let category = "";
    let val = "";
    if (lower.includes("glass")) { category = "glass"; val = "glass_lowe"; }
    else if (lower.includes("concrete")) { category = "concrete"; val = "conc_low"; }
    else if (lower.includes("steel")) { category = "steel"; val = "steel_std"; }
    else if (lower.includes("brick")) { category = "brick"; val = "brick_clay"; }
    else if (lower.includes("roof")) { category = "roofing"; val = "roof_green"; }
    if (category) {
      actions.push({ type: "REPLACE_MATERIAL", category, value: val });
    }
  }

  return { actions };
}

// Fallback report drafting in case of Invalid API Key or network offline
function mockReportGenerator(reportType: string, projectState: any, calculations: any) {
  let report = "";
  const scenario = projectState.scenarios[projectState.activeScenario] || {};
  
  if (reportType === "executive_proposal") {
    report = `# Conceptual Design Proposal: ${projectState.name}
    
## 1. Project Specifications
* **Active Design Scenario:** ${scenario.name || "Default"}
* **Building Floor Count:** ${scenario.building?.floors || 4} Floors
* **Target Occupant Capacity:** ${projectState.employees} Employees
* **Recommended Occupancy Limit:** ${calculations.occupancyLimit} occupants max (based on total space)
* **Total Floor Area:** ${calculations.totalFloorArea.toFixed(1)} m²
* **Construction Timeline:** ${calculations.constructionDurationWeeks} weeks

## 2. Cost Analysis
* **Estimated Project Cost:** $${Math.round(calculations.totalProjectCost).toLocaleString()}
* **Materials Takeoff Cost:** $${Math.round(calculations.totalMaterialCost).toLocaleString()}`;
  } else if (reportType === "sustainability_report") {
    report = `# Sustainability & Environmental Audit
    
## 1. Carbon Footprint Profile
* **Total Embodied Carbon:** ${calculations.embodiedCarbonTons.toFixed(1)} Metric Tons CO2
* **Energy Efficiency Score:** ${calculations.energyEfficiencyScore} / 100

## 2. Recommendations
* Upgrade standard concrete to Low-Carbon Concrete to offset carbon.
* Increase solar panel element count on the canvas grid to improve operational energy offset.`;
  } else if (reportType === "risk_analysis") {
    report = `# Project Risk & Clearance Analysis
    
## 1. Spatial Clearances
* Ensure building footprint does not exceed site boundaries.
* Verify access road connectivity.

## 2. Logistic Constraints
* Monitor lead times closely (Current glazing lead time is 14 days).`;
  } else {
    report = `# Bill of Quantities (BOQ) Summary
    
| Material Category | Estimated Quantity | Conceptual Cost (USD) |
| --- | --- | --- |
| Concrete Volume | ${calculations.concreteVolume.toFixed(1)} m³ | $${Math.round(calculations.concreteVolume * 120).toLocaleString()} |
| Steel Reinforcement | ${(calculations.steelMass / 1000).toFixed(1)} Tons | $${Math.round((calculations.steelMass / 1000) * 850).toLocaleString()} |
| Glazing Glass | ${calculations.glazingArea.toFixed(1)} m² | $${Math.round(calculations.glazingArea * 250).toLocaleString()} |
| Red Clay Bricks | ${calculations.brickCount.toFixed(0)} units | $${Math.round(calculations.brickCount * 0.65).toLocaleString()} |
| Roofing Area | ${calculations.roofArea.toFixed(1)} m² | $${Math.round(calculations.roofArea * 45).toLocaleString()} |`;
  }
  return { report };
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Endpoint 1: Natural Language Command Palette Interpreter
app.post("/api/copilot/command", async (req, res) => {
  try {
    const { command, projectState } = req.body;

    if (!GROQ_API_KEY) {
      console.warn("GROQ_API_KEY missing. Using fallback parser.");
      return res.json(mockCommandParser(command, projectState));
    }

    const systemPrompt = `You are a conceptual BIM and architectural design Copilot.
Given a user command and the current project state, you must output a JSON list of actions to apply.
You must ONLY output valid JSON. Do not write any conversational text, explanations, or code blocks.
Supported action types:
- UPDATE_FLOORS (value: number)
- SET_EMPLOYEES (value: number)
- UPDATE_BUILDING_DIMENSIONS (length?: number, width?: number)
- SET_SCENARIO (value: "current" | "cost_optimized" | "sustainable" | "high_capacity" | "premium")
- REPLACE_MATERIAL (category: string, value: string)

Example output format:
{
  "actions": [
    { "type": "UPDATE_FLOORS", "value": 6 }
  ]
}`;

    const response = await fetch(GROQ_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-specdec",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Command: "${command}". Current State: ${JSON.stringify(projectState)}` },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      console.warn(`Groq API returned status ${response.status}. Using fallback parser.`);
      return res.json(mockCommandParser(command, projectState));
    }

    const data = (await response.json()) as any;
    const content = data.choices[0]?.message?.content;
    const actionsObj = JSON.parse(content || '{"actions":[]}');

    res.json(actionsObj);
  } catch (err: any) {
    console.warn("Exception during Groq request. Using fallback parser.", err);
    res.json(mockCommandParser(req.body.command, req.body.projectState));
  }
});

// Endpoint 2: Markdown Report Generator
app.post("/api/copilot/report", async (req, res) => {
  try {
    const { reportType, projectState, calculations } = req.body;

    if (!GROQ_API_KEY) {
      console.warn("GROQ_API_KEY missing. Using fallback report generator.");
      return res.json(mockReportGenerator(reportType, projectState, calculations));
    }

    const prompt = `You are a professional architectural planning and feasibility consultant.
Generate a comprehensive, detailed markdown report of type: "${reportType}" based on the following planning configuration:
Project: ${JSON.stringify(projectState)}
Calculations Summary: ${JSON.stringify(calculations)}

Draft the report professionally with tables, warnings auditing, and strategic suggestions.
Report Types guide:
- "executive_proposal": Summarize the project specs, cost, timeline, and design highlights.
- "sustainability_report": Assess the carbon footprint, energy efficiency score, and green space ratios.
- "risk_analysis": Detail zoning bounds risks, parking capacity constraints, fire clearances, and lead time logistics.
- "boq_summary": Provide a structured Bill of Quantities table summarizing materials, costs, and labor requirements.`;

    const response = await fetch(GROQ_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-specdec",
        messages: [
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.warn(`Groq API returned status ${response.status}. Using fallback report generator.`);
      return res.json(mockReportGenerator(reportType, projectState, calculations));
    }

    const data = (await response.json()) as any;
    const content = data.choices[0]?.message?.content || "No report generated.";

    res.json({ report: content });
  } catch (err: any) {
    console.warn("Exception during Groq request. Using fallback report generator.", err);
    res.json(mockReportGenerator(req.body.reportType, req.body.projectState, req.body.calculations));
  }
});

// Fallback deterministic layout generator when Groq is unavailable
function mockLayoutGenerator(prompt: string, siteLength: number, siteWidth: number, employees: number) {
  const lower = prompt.toLowerCase();

  // Detect scenario from keywords
  let scenario = "current";
  if (lower.includes("sustain") || lower.includes("green") || lower.includes("eco")) scenario = "sustainable";
  else if (lower.includes("cost") || lower.includes("budget") || lower.includes("cheap")) scenario = "cost_optimized";
  else if (lower.includes("max") || lower.includes("large") || lower.includes("high capacity") || lower.includes("dense")) scenario = "high_capacity";
  else if (lower.includes("premium") || lower.includes("luxury") || lower.includes("executive")) scenario = "premium";

  // Extract employee count from prompt if mentioned
  const empMatch = lower.match(/\b(\d{2,4})\s*(employee|person|people|staff|occupant)/);
  const resolvedEmployees = empMatch ? parseInt(empMatch[1]) : employees;

  // Extract floor count
  const floorMatch = lower.match(/\b(\d{1,2})\s*(floor|story|storey|level)/);
  const floors = floorMatch ? parseInt(floorMatch[1]) : (scenario === "high_capacity" ? 6 : scenario === "cost_optimized" ? 3 : 4);

  // Compute building footprint (roughly 10 m² per employee per floor)
  const targetFloorArea = (resolvedEmployees * 10) / floors;
  const bLen = Math.min(Math.round(Math.sqrt(targetFloorArea * 1.8)), Math.round(siteLength * 0.55));
  const bWid = Math.min(Math.round(targetFloorArea / bLen), Math.round(siteWidth * 0.55));
  const bX = Math.round((siteLength - bLen) / 2);
  const bY = Math.round((siteWidth - bWid) / 2);

  // Build element list based on detected keywords + scenario defaults
  const elements: any[] = [];

  // Always include main road
  elements.push({ type: "road", x: Math.round(siteLength * 0.08), y: Math.round(siteWidth / 2), width: 8, height: siteWidth, rotation: 0, name: "Main Access Road", locked: true, visible: true });

  // Parking
  const parkingCars = lower.match(/\b(\d+)\s*(car|parking|space)/);
  const parkingSpaces = parkingCars ? parseInt(parkingCars[1]) : Math.round(resolvedEmployees * 0.3);
  const parkingHeight = Math.min(Math.round(parkingSpaces * 0.6), Math.round(siteWidth * 0.7));
  elements.push({ type: "parking", x: Math.round(siteLength * 0.85), y: Math.round(siteWidth / 2), width: Math.round(siteLength * 0.12), height: parkingHeight, rotation: 0, name: `Staff Parking (${parkingSpaces} cars)`, locked: false, visible: true });

  // Sustainable / green scenario: add garden + solar panels + trees
  if (scenario === "sustainable" || lower.includes("garden") || lower.includes("solar") || lower.includes("green")) {
    elements.push({ type: "garden", x: Math.round(siteLength * 0.7), y: Math.round(siteWidth * 0.15), width: Math.round(siteLength * 0.12), height: Math.round(siteWidth * 0.15), rotation: 0, name: "Rooftop Garden", locked: false, visible: true });
    elements.push({ type: "solar_panel", x: Math.round(siteLength * 0.52), y: Math.round(siteWidth * 0.1), width: Math.round(siteLength * 0.1), height: Math.round(siteWidth * 0.08), rotation: 0, name: "Solar Array", locked: false, visible: true });
    elements.push({ type: "tree", x: Math.round(siteLength * 0.18), y: Math.round(siteWidth * 0.12), width: 4, height: 4, rotation: 0, name: "Oak Tree", locked: false, visible: true });
    elements.push({ type: "tree", x: Math.round(siteLength * 0.18), y: Math.round(siteWidth * 0.85), width: 4, height: 4, rotation: 0, name: "Oak Tree", locked: false, visible: true });
  } else {
    // Default: a few trees
    elements.push({ type: "tree", x: Math.round(siteLength * 0.7), y: Math.round(siteWidth * 0.12), width: 4, height: 4, rotation: 0, name: "Vegetation", locked: false, visible: true });
    elements.push({ type: "tree", x: Math.round(siteLength * 0.7), y: Math.round(siteWidth * 0.85), width: 4, height: 4, rotation: 0, name: "Vegetation", locked: false, visible: true });
  }

  // Utility hub
  elements.push({ type: "utility_hub", x: Math.round(siteLength * 0.22), y: Math.round(siteWidth * 0.88), width: 8, height: 8, rotation: 0, name: "Utility Station", locked: false, visible: true });

  // Lobby
  elements.push({ type: "lobby", x: bX - 4, y: bY + Math.round(bWid / 2), width: 6, height: 8, rotation: 0, name: "Main Lobby", locked: false, visible: true });

  // Derive a project name
  const adjective = scenario === "sustainable" ? "Green" : scenario === "cost_optimized" ? "Efficient" : scenario === "high_capacity" ? "High-Density" : "Corporate";
  const projectName = `${adjective} Office Campus`;

  return {
    projectName,
    employees: resolvedEmployees,
    scenario,
    building: { x: bX, y: bY, length: bLen, width: bWid, rotation: 0, floors },
    elements
  };
}

// Endpoint 3: Automated AI Layout Generator
app.post("/api/copilot/generate-layout", async (req, res) => {
  try {
    const { prompt, siteConstraints, employees } = req.body;
    const siteLength = siteConstraints?.length || 120;
    const siteWidth = siteConstraints?.width || 80;
    const resolvedEmployees = employees || 200;

    if (!GROQ_API_KEY) {
      console.warn("GROQ_API_KEY missing. Using fallback layout generator.");
      return res.json(mockLayoutGenerator(prompt, siteLength, siteWidth, resolvedEmployees));
    }

    const systemPrompt = `You are an expert architectural site planner and conceptual BIM engineer.
Given a natural language description, generate a complete office site layout as strict JSON.
ALL coordinates are in meters. The site is ${siteLength}m long x ${siteWidth}m wide.
Elements must fit within the site bounds. Building must be centered on the site.

Valid element types: "road" | "parking" | "tree" | "walkway" | "garden" | "solar_panel" | "lobby" | "window" | "door" | "utility_hub"
Valid scenarios: "current" | "cost_optimized" | "sustainable" | "high_capacity" | "premium"

Output ONLY valid JSON, no text, no markdown, no code block:
{
  "projectName": "string",
  "employees": number,
  "scenario": "current" | "cost_optimized" | "sustainable" | "high_capacity" | "premium",
  "building": { "x": number, "y": number, "length": number, "width": number, "rotation": number, "floors": number },
  "elements": [
    { "type": "road", "x": number, "y": number, "width": number, "height": number, "rotation": number, "name": "string", "locked": false, "visible": true }
  ]
}

Rules:
- Include at least one road element (width 8, full site height, near left edge)
- Include parking sized proportionally to employee count
- Building footprint: approximately (employees * 10 / floors) m² floor plate
- All element positions are their center x,y on the site grid
- Include between 5 and 10 elements total`;

    const response = await fetch(GROQ_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-specdec",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Design Prompt: "${prompt}". Site: ${siteLength}m x ${siteWidth}m. Employees: ${resolvedEmployees}.` },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      console.warn(`Groq API returned status ${response.status}. Using fallback layout generator.`);
      return res.json(mockLayoutGenerator(prompt, siteLength, siteWidth, resolvedEmployees));
    }

    const data = (await response.json()) as any;
    const content = data.choices[0]?.message?.content;

    try {
      const layout = JSON.parse(content || "{}");
      // Ensure required fields exist
      if (!layout.building || !layout.elements) {
        throw new Error("Incomplete layout from AI.");
      }
      res.json(layout);
    } catch {
      console.warn("Failed to parse Groq layout response. Using fallback.");
      res.json(mockLayoutGenerator(prompt, siteLength, siteWidth, resolvedEmployees));
    }
  } catch (err: any) {
    console.warn("Exception during layout generation. Using fallback.", err);
    res.json(mockLayoutGenerator(req.body.prompt || "", req.body.siteConstraints?.length || 120, req.body.siteConstraints?.width || 80, req.body.employees || 200));
  }
});

app.listen(PORT, () => {
  console.log(`BIM Platform server running on http://localhost:${PORT}`);
});

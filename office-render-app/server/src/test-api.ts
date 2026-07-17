import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log("=== STARTING AUTOMATED API INTEGRATION TESTS ===");
  let failed = false;

  // Test 1: GET /api/health
  try {
    console.log("\n[Test 1] GET /api/health - Verifying server health check...");
    const res = await fetch(`${BASE_URL}/api/health`);
    if (res.status !== 200) {
      throw new Error(`Expected status 200, got ${res.status}`);
    }
    const data = (await res.json()) as any;
    if (data.status !== "ok") {
      throw new Error(`Expected response { status: "ok" }, got ${JSON.stringify(data)}`);
    }
    console.log("✔ GET /api/health: PASS");
  } catch (err: any) {
    console.error("❌ GET /api/health: FAIL -", err.message);
    failed = true;
  }

  // Test 2: POST /api/copilot/command
  try {
    console.log("\n[Test 2] POST /api/copilot/command - Verifying AI command parsing...");
    const payload = {
      command: "Increase floors to 6",
      projectState: {
        id: "proj_default",
        name: "Test Corporate Campus",
        revision: "v1.0",
        created_at: new Date().toISOString(),
        employees: 400,
        site: { length: 120, width: 80 },
        activeScenario: "current",
        scenarios: {
          current: {
            id: "current",
            name: "Current Design",
            building: { x: 40, y: 35, length: 45, width: 25, rotation: 0, floors: 4 },
            elements: [],
            materials: {}
          }
        },
        settings: { gridSize: 1, snapToGrid: true }
      }
    };

    const res = await fetch(`${BASE_URL}/api/copilot/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.status !== 200) {
      throw new Error(`Expected status 200, got ${res.status}`);
    }
    const data = (await res.json()) as any;
    if (!data.actions || !Array.isArray(data.actions)) {
      throw new Error(`Expected actions array, got ${JSON.stringify(data)}`);
    }
    
    const updateFloorsAction = data.actions.find((a: any) => a.type === "UPDATE_FLOORS");
    if (!updateFloorsAction || Number(updateFloorsAction.value) !== 6) {
      throw new Error(`Expected UPDATE_FLOORS value 6 action, got ${JSON.stringify(data.actions)}`);
    }
    console.log("✔ POST /api/copilot/command: PASS");
  } catch (err: any) {
    console.error("❌ POST /api/copilot/command: FAIL -", err.message);
    failed = true;
  }

  // Test 3: POST /api/copilot/report
  try {
    console.log("\n[Test 3] POST /api/copilot/report - Verifying AI feasibility report compiler...");
    const payload = {
      reportType: "boq_summary",
      projectState: {
        id: "proj_default",
        name: "Test Corporate Campus",
        revision: "v1.0",
        created_at: new Date().toISOString(),
        employees: 400,
        site: { length: 120, width: 80 },
        activeScenario: "current",
        scenarios: {
          current: {
            id: "current",
            name: "Current Design",
            building: { x: 40, y: 35, length: 45, width: 25, rotation: 0, floors: 4 },
            elements: [],
            materials: {}
          }
        },
        settings: { gridSize: 1, snapToGrid: true }
      },
      calculations: {
        concreteVolume: 500,
        steelMass: 55000,
        glazingArea: 120,
        brickCount: 6000,
        roofArea: 1125,
        totalMaterialCost: 200000,
        totalProjectCost: 350000,
        constructionDurationWeeks: 24,
        embodiedCarbonTons: 120,
        energyEfficiencyScore: 75,
        occupancyLimit: 500
      }
    };

    const res = await fetch(`${BASE_URL}/api/copilot/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.status !== 200) {
      throw new Error(`Expected status 200, got ${res.status}`);
    }
    const data = (await res.json()) as any;
    if (!data.report || typeof data.report !== "string" || data.report.length < 50) {
      throw new Error(`Expected valid markdown report string, got ${JSON.stringify(data)}`);
    }
    console.log("✔ POST /api/copilot/report: PASS");
  } catch (err: any) {
    console.error("❌ POST /api/copilot/report: FAIL -", err.message);
    failed = true;
  }

  console.log("\n=== TESTS COMPLETE ===");
  if (failed) {
    console.error("SOME TESTS FAILED.");
    process.exit(1);
  } else {
    console.log("ALL TESTS COMPLETED SUCCESSFULLY.");
    process.exit(0);
  }
}

runTests();

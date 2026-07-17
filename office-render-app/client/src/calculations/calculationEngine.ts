import type { Project, Material } from "../types/project";
import { generateWindowPlacements, generateParkingSlots } from "../geometry/geometryEngine";

export interface CalculationResult {
  footprintArea: number;       // m2
  totalFloorArea: number;      // m2
  facadeArea: number;          // m2
  glazingArea: number;         // m2
  glazingRatio: number;        // percentage
  concreteVolume: number;      // m3
  steelMass: number;           // kg (or tons)
  brickCount: number;          // pieces
  paintArea: number;           // m2
  roofArea: number;            // m2
  parkingCapacity: number;     // slots
  occupancyLimit: number;      // employees
  constructionDurationWeeks: number;
  laborEstimateHours: number;
  totalMaterialCost: number;   // USD
  totalProjectCost: number;    // USD
  embodiedCarbonTons: number;  // Metric tons CO2
  energyEfficiencyScore: number; // 0-100 scale
}

/**
 * Deterministic Calculation Engine for Conceptual BIM Office Planning.
 * All formulas are conceptual planning estimates and not for structural certification.
 */
export function runEngineeringCalculations(project: Project, materials: Material[]): CalculationResult {
  const activeScenario = project.scenarios[project.activeScenario];
  const building = activeScenario.building;
  const elements = activeScenario.elements;

  // Material helpers
  const getMaterial = (category: string): Material | undefined => {
    const id = activeScenario.materials[category];
    return materials.find((m) => m.id === id);
  };

  const concreteMat = getMaterial("concrete");
  const steelMat = getMaterial("steel");
  const glassMat = getMaterial("glass");
  const brickMat = getMaterial("brick");
  const roofingMat = getMaterial("roofing");

  // 1. Basic Areas
  const footprintArea = building.length * building.width;
  const totalFloorArea = footprintArea * building.floors;
  
  // Facade height assuming 3.5m per floor
  const floorHeight = 3.5;
  const totalBuildingHeight = building.floors * floorHeight;
  const perimeter = 2 * (building.length + building.width);
  const facadeArea = perimeter * totalBuildingHeight;

  // 2. Glazing Ratio Math
  // Generate windows using geometry engine to compute absolute window count
  const windows = generateWindowPlacements(building);
  const windowHeight = 2.0; // standard conceptual window height
  const glazingArea = windows.length * windowHeight * 1.8; // windowWidth is 1.8
  const glazingRatio = facadeArea > 0 ? (glazingArea / facadeArea) * 100 : 0;

  // 3. Volumetric Structural Takeoffs
  // Concrete slab thickness estimated at 0.2m, columns/beams add ~25%
  const slabThickness = 0.2;
  const concreteVolume = footprintArea * slabThickness * building.floors * 1.25;
  
  // Steel mass: typical building rebar index is ~110kg per m3 of concrete
  const steelMass = concreteVolume * 110;

  // Bricks: assume exterior non-glass walls are standard red clay brick (50 bricks per m2)
  const brickCount = Math.max(0, facadeArea - glazingArea) * 50;

  // Paint Area: interior + exterior walls (excluding glass)
  const paintArea = Math.max(0, facadeArea - glazingArea) * 2;
  const roofArea = footprintArea;

  // 4. Parking Capacity
  // Sum slots from all parking element bounds on canvas
  let parkingCapacity = 0;
  elements.forEach((el) => {
    if (el.type === "parking") {
      const slots = generateParkingSlots(el);
      parkingCapacity += slots.length;
    }
  });

  // 5. Occupancy Limits (conceptual recommendation: 10m2 per employee)
  const occupancyLimit = Math.floor(totalFloorArea / 10);

  // 6. Cost Estimation (using database prices)
  const concreteCost = concreteVolume * (concreteMat?.cost || 120);
  // Steel standard cost is in tons
  const steelCost = (steelMass / 1000) * (steelMat?.cost || 850);
  const glassCost = glazingArea * (glassMat?.cost || 250);
  const brickCost = brickCount * (brickMat?.cost || 0.65);
  const roofingCost = roofArea * (roofingMat?.cost || 45);

  // Add structural framing, mechanical, electrical, and utilities estimations
  const MEP_Multiplier = 1.35; // +35% for HVAC, electrical, and plumbing conceptual allocation
  const baseMaterialCost = (concreteCost + steelCost + glassCost + steelCost + glassCost + brickCost + roofingCost);
  const totalMaterialCost = baseMaterialCost * MEP_Multiplier;
  
  // Labor is approximately 40% of the project total cost
  const laborCost = totalMaterialCost * 0.4;
  const totalProjectCost = totalMaterialCost + laborCost;

  // 7. Embodied Carbon Calculations (CO2 kg to metric tons conversion)
  const concreteCarbon = concreteVolume * 2400 * (concreteMat?.embodiedCarbon || 0.12); // density * factor
  const steelCarbon = steelMass * (steelMat?.embodiedCarbon || 1.9);
  const glassCarbon = glazingArea * 2500 * 0.008 * (glassMat?.embodiedCarbon || 0.85); // thickness 8mm
  const brickCarbon = brickCount * 2.3 * (brickMat?.embodiedCarbon || 0.22); // average brick weight 2.3kg
  const roofingCarbon = roofArea * (roofingMat?.embodiedCarbon || -0.15); // green roof offset

  const totalCarbonKg = concreteCarbon + steelCarbon + glassCarbon + brickCarbon + roofingCarbon;
  const embodiedCarbonTons = totalCarbonKg / 1000;

  // 8. Energy Efficiency Score (0-100 Conceptual Scale)
  // Higher R-values and green properties improve the score
  let baseScore = 50;

  // Glass performance bonus (Lower thermal conductivity is better)
  const glassUValue = glassMat?.thermalConductivity || 1.4;
  if (glassUValue < 1.0) baseScore += 10;
  else if (glassUValue < 1.5) baseScore += 5;

  // Wall insulation
  const brickU = brickMat?.thermalConductivity || 0.7;
  if (brickU < 0.5) baseScore += 10;
  else if (brickU < 0.8) baseScore += 5;

  // Roofing bonus
  if (roofingMat?.id === "roof_green") {
    baseScore += 15; // Eco green roof credit
  }

  // Solar offset
  const solarPanels = elements.filter((el) => el.type === "solar_panel");
  baseScore += Math.min(15, solarPanels.length * 0.5);

  const energyEfficiencyScore = Math.min(100, Math.max(0, baseScore));

  // 9. Duration and Manpower estimates
  // 1.5 man-hours per square meter
  const laborEstimateHours = totalFloorArea * 1.5;
  const averageWorkers = Math.max(10, Math.floor(totalFloorArea / 100));
  const constructionDurationWeeks = Math.ceil(laborEstimateHours / (averageWorkers * 40));

  return {
    footprintArea,
    totalFloorArea,
    facadeArea,
    glazingArea,
    glazingRatio,
    concreteVolume,
    steelMass,
    brickCount,
    paintArea,
    roofArea,
    parkingCapacity,
    occupancyLimit,
    constructionDurationWeeks,
    laborEstimateHours,
    totalMaterialCost,
    totalProjectCost,
    embodiedCarbonTons,
    energyEfficiencyScore,
  };
}

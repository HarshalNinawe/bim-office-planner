import type { Project, DesignWarning, Material } from "../types/project";
import { getRotatedBoundingBox, isContainedInSite, checkCollision } from "../geometry/geometryEngine";
import { runEngineeringCalculations } from "../calculations/calculationEngine";

/**
 * Constraint Engine
 * Validates building layouts, site limits, material consistency, and structural clearances.
 */
export function runConstraintValidation(project: Project, materials: Material[]): DesignWarning[] {
  const warnings: DesignWarning[] = [];
  const activeScenario = project.scenarios[project.activeScenario];
  const building = activeScenario.building;
  const elements = activeScenario.elements;
  const site = project.site;

  // Run calculations first to get computed specs (occupancy, areas, etc.)
  const calculations = runEngineeringCalculations(project, materials);

  // 1. Check if building is within site bounds
  const buildingBbox = getRotatedBoundingBox(
    building.x,
    building.y,
    building.length,
    building.width,
    building.rotation
  );

  if (!isContainedInSite(buildingBbox, site)) {
    warnings.push({
      id: "warn_building_out_of_site",
      code: "SITE_LIMIT_EXCEEDED",
      severity: "error",
      message: "The building footprint exceeds the site property line boundaries."
    });
  }

  // 2. Check each canvas element boundary
  elements.forEach((el) => {
    const elBbox = getRotatedBoundingBox(el.x, el.y, el.width, el.height, el.rotation);
    if (!isContainedInSite(elBbox, site)) {
      warnings.push({
        id: `warn_element_out_${el.id}`,
        code: "ELEMENT_OUT_OF_SITE",
        severity: "warning",
        message: `Object '${el.name}' is partially or fully outside the site boundary.`,
        targetId: el.id
      });
    }
  });

  // 3. Collision Checks: Building vs Roads/Parking
  elements.forEach((el) => {
    if (el.type === "road" || el.type === "parking") {
      const collides = checkCollision(
        building.x,
        building.y,
        building.length,
        building.width,
        building.rotation,
        el.x,
        el.y,
        el.width,
        el.height,
        el.rotation
      );

      if (collides) {
        warnings.push({
          id: `warn_collision_building_${el.id}`,
          code: "GEOMETRY_OVERLAP",
          severity: "error",
          message: `Building footprint overlaps with '${el.name}'.`,
          targetId: el.id
        });
      }
    }
  });

  // 4. Collision Checks: Elements vs Elements (excluding trees/garden overlap which is allowed)
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const elA = elements[i];
      const elB = elements[j];

      // Only check major structural overlaps (e.g. road vs parking, road vs utility hub)
      const shouldCheck = 
        (elA.type === "road" && elB.type === "parking") ||
        (elA.type === "parking" && elB.type === "road") ||
        (elA.type === "utility_hub" && (elB.type === "road" || elB.type === "parking")) ||
        ((elA.type === "road" || elA.type === "parking") && elB.type === "utility_hub");

      if (shouldCheck) {
        const collides = checkCollision(
          elA.x, elA.y, elA.width, elA.height, elA.rotation,
          elB.x, elB.y, elB.width, elB.height, elB.rotation
        );

        if (collides) {
          warnings.push({
            id: `warn_collision_${elA.id}_${elB.id}`,
            code: "GEOMETRY_OVERLAP",
            severity: "warning",
            message: `Layout clash detected: '${elA.name}' overlaps with '${elB.name}'.`,
            targetId: elA.id
          });
        }
      }
    }
  }

  // 5. Green Space Checking (conceptual threshold: 15% green area)
  // Calculate total garden area on canvas
  let totalGardenArea = 0;
  elements.forEach((el) => {
    if (el.type === "garden") {
      totalGardenArea += el.width * el.height;
    }
  });

  const siteArea = site.length * site.width;
  const greenRatio = siteArea > 0 ? (totalGardenArea / siteArea) * 100 : 0;
  if (greenRatio < 15) {
    warnings.push({
      id: "warn_insufficient_green_area",
      code: "ENVIRONMENT_VIOLATION",
      severity: "warning",
      message: `Green space is currently ${greenRatio.toFixed(1)}% of site area. Municipal codes typically require at least 15.0%.`
    });
  }

  // 6. Parking Ratio Checking (conceptual threshold: 1 slot per 5 employees)
  const requiredSlots = Math.ceil(project.employees / 5);
  if (calculations.parkingCapacity < requiredSlots) {
    warnings.push({
      id: "warn_insufficient_parking",
      code: "PARKING_DEFICIT",
      severity: "warning",
      message: `Insufficient parking capacity. Have ${calculations.parkingCapacity} slots, but ${requiredSlots} are recommended for ${project.employees} employees.`
    });
  }

  // 7. Safety: Fire Hydrant & Access Hub
  const hasUtilityHub = elements.some((el) => el.type === "utility_hub");
  if (!hasUtilityHub) {
    warnings.push({
      id: "warn_missing_utilities",
      code: "SAFETY_MISSING",
      severity: "warning",
      message: "No central utility or electrical/water hub has been mapped to the site plan."
    });
  }

  return warnings;
}

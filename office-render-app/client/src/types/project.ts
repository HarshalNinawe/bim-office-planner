export interface Site {
  length: number; // In meters
  width: number;  // In meters
}

export interface Building {
  id: string;
  x: number;        // Position of building center/corner on site
  y: number;
  length: number;   // Front dimension
  width: number;    // Side depth dimension
  rotation: number; // Angle in degrees (0 to 360)
  floors: number;   // Total floor count
}

export type ElementType =
  | 'road'
  | 'parking'
  | 'tree'
  | 'walkway'
  | 'garden'
  | 'solar_panel'
  | 'lobby'
  | 'window'
  | 'door'
  | 'utility_hub';

export interface DesignElement {
  id: string;
  type: ElementType;
  x: number;        // X coordinate (center relative to site)
  y: number;        // Y coordinate (center relative to site)
  width: number;    // Dimension in meters
  height: number;   // Dimension in meters
  rotation: number; // Angle in degrees
  locked: boolean;
  visible: boolean;
  name: string;
  materialId?: string;
}

export type MaterialCategory =
  | 'concrete'
  | 'steel'
  | 'glass'
  | 'brick'
  | 'wood'
  | 'insulation'
  | 'roofing'
  | 'hvac'
  | 'electrical';

export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  cost: number;                  // USD per unit
  unit: string;                  // 'm3', 'kg', 'm2', 'unit'
  density: number;               // kg/m3 (or equivalent)
  embodiedCarbon: number;        // kg CO2 per kg or unit
  thermalConductivity: number;   // W/mK
  fireRating: string;            // '30m', '1h', '2h', etc.
  acousticRating: string;        // STC value in dB
  maintenanceCost: number;       // Annual cost multiplier
  lifecycle: number;             // Expected years
  leadTime: number;              // In days
  availability: 'high' | 'medium' | 'low';
  supplier: string;
}

export type ScenarioType =
  | 'current'
  | 'cost_optimized'
  | 'sustainable'
  | 'high_capacity'
  | 'premium';

export interface ProjectScenario {
  id: ScenarioType;
  name: string;
  building: Omit<Building, 'id'>;
  elements: DesignElement[];
  materials: Record<string, string>; // Maps category -> materialId
}

export interface DesignWarning {
  id: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  targetId?: string; // Element ID if related to a specific object
}

export interface Project {
  id: string;
  name: string;
  revision: string;
  created_at: string;
  employees: number;
  site: Site;
  activeScenario: ScenarioType;
  scenarios: Record<ScenarioType, ProjectScenario>;
  settings: {
    gridSize: number; // In meters (e.g. 1m, 2m)
    snapToGrid: boolean;
  };
}

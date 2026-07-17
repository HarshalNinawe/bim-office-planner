import { create } from "zustand";
import type { Project, DesignElement, ScenarioType, Material, Building } from "../types/project";

// Default materials list
export const DEFAULT_MATERIALS: Material[] = [
  {
    id: "conc_std",
    name: "Concrete (Standard C30)",
    category: "concrete",
    cost: 120, // per m3
    unit: "m3",
    density: 2400, // kg/m3
    embodiedCarbon: 0.12, // kg CO2 / kg
    thermalConductivity: 1.8, // W/mK
    fireRating: "2 hours",
    acousticRating: "52", // dB
    maintenanceCost: 0.01,
    lifecycle: 60,
    leadTime: 2,
    availability: "high",
    supplier: "Global Aggregates Ltd"
  },
  {
    id: "conc_low",
    name: "Concrete (Low-Carbon)",
    category: "concrete",
    cost: 150, // per m3
    unit: "m3",
    density: 2400,
    embodiedCarbon: 0.05,
    thermalConductivity: 1.6,
    fireRating: "2 hours",
    acousticRating: "52",
    maintenanceCost: 0.01,
    lifecycle: 60,
    leadTime: 5,
    availability: "medium",
    supplier: "Eco-Crete Solutions"
  },
  {
    id: "steel_std",
    name: "Structural Steel (Rebar)",
    category: "steel",
    cost: 850, // per ton
    unit: "ton",
    density: 7850,
    embodiedCarbon: 1.9,
    thermalConductivity: 50,
    fireRating: "1 hour",
    acousticRating: "45",
    maintenanceCost: 0.005,
    lifecycle: 80,
    leadTime: 7,
    availability: "high",
    supplier: "Apex Alloys"
  },
  {
    id: "glass_lowe",
    name: "Low-E Double Glazing",
    category: "glass",
    cost: 250, // per m2
    unit: "m2",
    density: 2500,
    embodiedCarbon: 0.85,
    thermalConductivity: 1.4,
    fireRating: "30 mins",
    acousticRating: "38",
    maintenanceCost: 0.02,
    lifecycle: 25,
    leadTime: 14,
    availability: "high",
    supplier: "ClearView Glass"
  },
  {
    id: "brick_clay",
    name: "Red Clay Brick",
    category: "brick",
    cost: 0.65, // per unit
    unit: "unit",
    density: 1800,
    embodiedCarbon: 0.22,
    thermalConductivity: 0.7,
    fireRating: "4 hours",
    acousticRating: "48",
    maintenanceCost: 0.01,
    lifecycle: 100,
    leadTime: 3,
    availability: "high",
    supplier: "Heritage Bricks"
  },
  {
    id: "roof_green",
    name: "Sedum Green Roof",
    category: "roofing",
    cost: 45, // per m2
    unit: "m2",
    density: 300,
    embodiedCarbon: -0.15, // Carbon negative due to offset
    thermalConductivity: 0.3,
    fireRating: "1 hour",
    acousticRating: "42",
    maintenanceCost: 0.08,
    lifecycle: 35,
    leadTime: 10,
    availability: "medium",
    supplier: "NatureRoof Systems"
  }
];

// Initial mock project
const INITIAL_PROJECT: Project = {
  id: "proj_default",
  name: "New Corporate Campus",
  revision: "v1.0",
  created_at: new Date().toISOString(),
  employees: 400,
  site: {
    length: 120,
    width: 80
  },
  activeScenario: "current",
  scenarios: {
    current: {
      id: "current",
      name: "Current Design",
      building: {
        x: 40,
        y: 35,
        length: 45,
        width: 25,
        rotation: 0,
        floors: 4
      },
      elements: [
        {
          id: "elem_road_1",
          type: "road",
          x: 10,
          y: 40,
          width: 8,
          height: 80,
          rotation: 0,
          locked: true,
          visible: true,
          name: "Main Access Road"
        },
        {
          id: "elem_parking_1",
          type: "parking",
          x: 95,
          y: 40,
          width: 15,
          height: 50,
          rotation: 0,
          locked: false,
          visible: true,
          name: "Visitor Parking"
        },
        {
          id: "elem_tree_1",
          type: "tree",
          x: 80,
          y: 15,
          width: 4,
          height: 4,
          rotation: 0,
          locked: false,
          visible: true,
          name: "Oak Tree"
        },
        {
          id: "elem_tree_2",
          type: "tree",
          x: 80,
          y: 65,
          width: 4,
          height: 4,
          rotation: 0,
          locked: false,
          visible: true,
          name: "Oak Tree"
        }
      ],
      materials: {
        concrete: "conc_std",
        steel: "steel_std",
        glass: "glass_lowe",
        brick: "brick_clay",
        roofing: "roof_green"
      }
    },
    cost_optimized: {
      id: "cost_optimized",
      name: "Cost Optimized",
      building: { x: 40, y: 35, length: 45, width: 25, rotation: 0, floors: 3 },
      elements: [],
      materials: {}
    },
    sustainable: {
      id: "sustainable",
      name: "Green Sustainable",
      building: { x: 40, y: 35, length: 45, width: 25, rotation: 0, floors: 4 },
      elements: [],
      materials: {}
    },
    high_capacity: {
      id: "high_capacity",
      name: "Max Occupancy",
      building: { x: 40, y: 35, length: 45, width: 25, rotation: 0, floors: 6 },
      elements: [],
      materials: {}
    },
    premium: {
      id: "premium",
      name: "Premium Office Layout",
      building: { x: 40, y: 35, length: 45, width: 25, rotation: 0, floors: 4 },
      elements: [],
      materials: {}
    }
  },
  settings: {
    gridSize: 1,
    snapToGrid: true
  }
};

// Fill empty scenario blueprints with cloned elements to start
INITIAL_PROJECT.scenarios.cost_optimized.elements = JSON.parse(JSON.stringify(INITIAL_PROJECT.scenarios.current.elements));
INITIAL_PROJECT.scenarios.cost_optimized.materials = { ...INITIAL_PROJECT.scenarios.current.materials };
INITIAL_PROJECT.scenarios.sustainable.elements = JSON.parse(JSON.stringify(INITIAL_PROJECT.scenarios.current.elements));
INITIAL_PROJECT.scenarios.sustainable.materials = { ...INITIAL_PROJECT.scenarios.current.materials };
INITIAL_PROJECT.scenarios.high_capacity.elements = JSON.parse(JSON.stringify(INITIAL_PROJECT.scenarios.current.elements));
INITIAL_PROJECT.scenarios.high_capacity.materials = { ...INITIAL_PROJECT.scenarios.current.materials };
INITIAL_PROJECT.scenarios.premium.elements = JSON.parse(JSON.stringify(INITIAL_PROJECT.scenarios.current.elements));
INITIAL_PROJECT.scenarios.premium.materials = { ...INITIAL_PROJECT.scenarios.current.materials };

export interface GeneratedLayout {
  projectName: string;
  employees: number;
  scenario: ScenarioType;
  building: Omit<Building, "id">;
  elements: Omit<DesignElement, "id">[];
}

interface ProjectStore {
  project: Project;
  materials: Material[];
  selectedElementId: string | null;
  history: Project[];
  historyIndex: number;
  
  // History Undo/Redo
  pushHistory: (newProject: Project) => void;
  undo: () => void;
  redo: () => void;

  // Actions
  loadProject: (project: Project) => void;
  updateProjectDetails: (details: Partial<Project>) => void;
  updateBuildingDetails: (building: Partial<Building>) => void;
  updateElement: (id: string, element: Partial<DesignElement>) => void;
  addElement: (element: Omit<DesignElement, "id">) => void;
  removeElement: (id: string) => void;
  setSelectedElementId: (id: string | null) => void;
  setScenario: (scenario: ScenarioType) => void;
  updateMaterialPrice: (id: string, price: number) => void;
  updateActiveScenarioMaterials: (materials: Record<string, string>) => void;
  applyGeneratedLayout: (layout: GeneratedLayout) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: INITIAL_PROJECT,
  materials: DEFAULT_MATERIALS,
  selectedElementId: null,
  history: [INITIAL_PROJECT],
  historyIndex: 0,

  pushHistory: (newProject) => {
    const { history, historyIndex } = get();
    const cleanHistory = history.slice(0, historyIndex + 1);
    set({
      history: [...cleanHistory, newProject],
      historyIndex: cleanHistory.length,
      project: newProject
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      set({
        historyIndex: historyIndex - 1,
        project: history[historyIndex - 1],
        selectedElementId: null
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({
        historyIndex: historyIndex + 1,
        project: history[historyIndex + 1],
        selectedElementId: null
      });
    }
  },

  loadProject: (project) => {
    set({
      project,
      selectedElementId: null,
      history: [project],
      historyIndex: 0
    });
  },

  updateProjectDetails: (details) => {
    const { project } = get();
    const updated = { ...project, ...details };
    get().pushHistory(updated);
  },

  updateBuildingDetails: (buildingUpdate) => {
    const { project } = get();
    const active = project.activeScenario;
    const scenario = project.scenarios[active];
    
    const updatedProject = {
      ...project,
      scenarios: {
        ...project.scenarios,
        [active]: {
          ...scenario,
          building: {
            ...scenario.building,
            ...buildingUpdate
          }
        }
      }
    };
    get().pushHistory(updatedProject);
  },

  updateElement: (id, elementUpdate) => {
    const { project } = get();
    const active = project.activeScenario;
    const scenario = project.scenarios[active];
    
    const updatedElements = scenario.elements.map((el) =>
      el.id === id ? { ...el, ...elementUpdate } : el
    );

    const updatedProject = {
      ...project,
      scenarios: {
        ...project.scenarios,
        [active]: {
          ...scenario,
          elements: updatedElements
        }
      }
    };
    get().pushHistory(updatedProject);
  },

  addElement: (elementSpec) => {
    const { project } = get();
    const active = project.activeScenario;
    const scenario = project.scenarios[active];
    
    const newElement: DesignElement = {
      ...elementSpec,
      id: `elem_${Date.now()}`
    };

    const updatedProject = {
      ...project,
      scenarios: {
        ...project.scenarios,
        [active]: {
          ...scenario,
          elements: [...scenario.elements, newElement]
        }
      }
    };
    get().pushHistory(updatedProject);
  },

  removeElement: (id) => {
    const { project, selectedElementId } = get();
    const active = project.activeScenario;
    const scenario = project.scenarios[active];

    const updatedElements = scenario.elements.filter((el) => el.id !== id);

    const updatedProject = {
      ...project,
      scenarios: {
        ...project.scenarios,
        [active]: {
          ...scenario,
          elements: updatedElements
        }
      }
    };
    
    set({
      selectedElementId: selectedElementId === id ? null : selectedElementId
    });
    get().pushHistory(updatedProject);
  },

  setSelectedElementId: (id) => {
    set({ selectedElementId: id });
  },

  setScenario: (scenario) => {
    const { project } = get();
    set({
      project: {
        ...project,
        activeScenario: scenario
      },
      selectedElementId: null
    });
  },

  updateMaterialPrice: (id, price) => {
    const { materials } = get();
    const updated = materials.map((m) =>
      m.id === id ? { ...m, cost: price } : m
    );
    set({ materials: updated });
    
    // Trigger history push of current project to force dependents updates
    const { project } = get();
    get().pushHistory({ ...project });
  },

  updateActiveScenarioMaterials: (materialsUpdate) => {
    const { project } = get();
    const active = project.activeScenario;
    const scenario = project.scenarios[active];

    const updatedProject = {
      ...project,
      scenarios: {
        ...project.scenarios,
        [active]: {
          ...scenario,
          materials: {
            ...scenario.materials,
            ...materialsUpdate
          }
        }
      }
    };
    get().pushHistory(updatedProject);
  },

  applyGeneratedLayout: (layout) => {
    const { project } = get();
    const targetScenario = layout.scenario;
    const existingScenario = project.scenarios[targetScenario];

    // Stamp unique IDs on incoming elements
    const stamped = layout.elements.map((el, i) => ({
      ...el,
      id: `gen_${Date.now()}_${i}`
    }));

    const updatedProject: Project = {
      ...project,
      name: layout.projectName,
      employees: layout.employees,
      activeScenario: targetScenario,
      scenarios: {
        ...project.scenarios,
        [targetScenario]: {
          ...existingScenario,
          building: { ...layout.building },
          elements: stamped
        }
      }
    };
    set({ selectedElementId: null });
    get().pushHistory(updatedProject);
  }
}));

# System Architecture: ConceptBIM AI

ConceptBIM AI uses a decoupled, unidirectional architecture designed to separate mathematical calculations from user interface rendering.

## Architectural Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Project Model (Zustand Store)        │
└────────────────────────────────────┬────────────────────┘
                                     │
                                     ▼
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
  Geometry Engine             Constraint Engine           Calculation Engine
  - Vector intersections      - Building bounds checks    - Concrete slab takeoff
  - SAT Collision checks      - HVAC efficiency limits    - Embodied CO2 scores
  - Snapping coordinates      - Safety fire clearance     - BOQ cost estimations
         └───────────────────────────┬───────────────────────────┘
                                     │
                                     ▼
                   ┌─────────────────┴─────────────────┐
                   ▼                                   ▼
          SVG Layout Canvas                    Recharts Dashboard
          - Drag, rotate handles               - Scenario comparisons
          - Blueprint grid                     - Material cost charts
```

### 1. Client Core state
The central state is managed by the Zustand store ([`projectStore.ts`](file:///d:/2. Projects and compititions/4th year/office-render-app/office-render-app/client/src/stores/projectStore.ts)). This store coordinates:
* Active project metadata
* Scenarios stack (Current, Cost Optimized, Sustainable, High Capacity, Premium)
* Active selection indices
* Command transaction undo/redo stacks

### 2. Math & Calculation Engines
These engines are written in pure TypeScript with zero external dependencies to ensure fast execution and support unit testing:
* **Geometry Engine:** Vector geometry, distance projections, grid alignment, and 2D rotations.
* **Calculation Engine:** Translates spatial shapes into raw material estimates.
* **Constraint Engine:** Audits layout elements against building regulations.

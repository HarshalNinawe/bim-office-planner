# Geometry Engine

The Geometry Engine ([`geometryEngine.ts`](file:///d:/2. Projects and compititions/4th year/office-render-app/office-render-app/client/src/geometry/geometryEngine.ts)) manages canvas layout math, grid snapping, and collision checks.

## Math Details

### 1. Separating Axis Theorem (SAT) Collision
To prevent building footprint and parking bay overlaps, the engine projects oriented rectangles onto local axes to detect intersections:
* **Inputs:** Rectangles with positions $(x, y)$, dimensions $(w, h)$, and rotation angles.
* **Output:** Boolean overlap indicator.

### 2. Snap-To-Grid
Aligns drag coordinates to grid lines based on active config:
```typescript
export function snapToGrid(val: number, size: number, enabled: boolean): number {
  if (!enabled) return val;
  return Math.round(val / size) * size;
}
```

import type { Building, DesignElement, Site } from "../types/project";

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

/**
 * Geometry Engine
 * Handles all spatial operations, bounding boxes, collision detection, and procedural generations.
 */

/**
 * Snaps a value to a grid increment.
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Rotates a 2D point around a pivot point.
 */
export function rotatePoint(point: Vector2D, pivot: Vector2D, angleDegrees: number): Vector2D {
  const angleRad = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;

  return {
    x: pivot.x + (dx * cos - dy * sin),
    y: pivot.y + (dx * sin + dy * cos),
  };
}

/**
 * Calculates the bounding box of a rotated rectangle.
 */
export function getRotatedBoundingBox(
  x: number,
  y: number,
  width: number,
  height: number,
  rotationDegrees: number
): BoundingBox {
  const halfW = width / 2;
  const halfH = height / 2;
  const pivot = { x, y };

  const corners: Vector2D[] = [
    { x: x - halfW, y: y - halfH },
    { x: x + halfW, y: y - halfH },
    { x: x + halfW, y: y + halfH },
    { x: x - halfW, y: y + halfH },
  ];

  const rotatedCorners = corners.map((corner) => rotatePoint(corner, pivot, rotationDegrees));

  const xs = rotatedCorners.map((c) => c.x);
  const ys = rotatedCorners.map((c) => c.y);

  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

/**
 * Determines if a bounding box is fully contained within the site boundaries.
 */
export function isContainedInSite(bbox: BoundingBox, site: Site): boolean {
  return bbox.minX >= 0 && bbox.maxX <= site.length && bbox.minY >= 0 && bbox.maxY <= site.width;
}

/**
 * Separating Axis Theorem (SAT) to detect overlap between two oriented/rotated rectangles.
 */
export function checkCollision(
  aX: number,
  aY: number,
  aW: number,
  aH: number,
  aRot: number,
  bX: number,
  bY: number,
  bW: number,
  bH: number,
  bRot: number
): boolean {
  const getCorners = (x: number, y: number, w: number, h: number, rot: number): Vector2D[] => {
    const hw = w / 2;
    const hh = h / 2;
    const pivot = { x, y };
    return [
      rotatePoint({ x: x - hw, y: y - hh }, pivot, rot),
      rotatePoint({ x: x + hw, y: y - hh }, pivot, rot),
      rotatePoint({ x: x + hw, y: y + hh }, pivot, rot),
      rotatePoint({ x: x - hw, y: y + hh }, pivot, rot),
    ];
  };

  const cornersA = getCorners(aX, aY, aW, aH, aRot);
  const cornersB = getCorners(bX, bY, bW, bH, bRot);

  const getAxes = (corners: Vector2D[]): Vector2D[] => {
    const axes: Vector2D[] = [];
    for (let i = 0; i < corners.length; i++) {
      const p1 = corners[i];
      const p2 = corners[(i + 1) % corners.length];
      const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
      const normal = { x: -edge.y, y: edge.x };
      const len = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
      axes.push({ x: normal.x / len, y: normal.y / len });
    }
    return axes;
  };

  const axes = [...getAxes(cornersA), ...getAxes(cornersB)];

  const project = (corners: Vector2D[], axis: Vector2D) => {
    let min = Infinity;
    let max = -Infinity;
    for (const p of corners) {
      const val = p.x * axis.x + p.y * axis.y;
      if (val < min) min = val;
      if (val > max) max = val;
    }
    return { min, max };
  };

  for (const axis of axes) {
    const projA = project(cornersA, axis);
    const projB = project(cornersB, axis);
    if (projA.max < projB.min || projB.max < projA.min) {
      return false; // Found separating axis, no collision
    }
  }

  return true; // Overlap on all axes
}

/**
 * Generates parking slots coordinates procedurally inside a parking zone.
 * Standard slot is 2.5m wide by 5.0m long.
 */
export interface ParkingSlot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export function generateParkingSlots(parkingZone: DesignElement): ParkingSlot[] {
  const slots: ParkingSlot[] = [];
  const slotWidth = 2.5;
  const slotLength = 5.0;
  
  // Calculate slots along the width direction (columns) and length direction (rows)
  const cols = Math.floor(parkingZone.width / slotWidth);
  const rows = Math.floor(parkingZone.height / slotLength);

  if (cols === 0 || rows === 0) return [];

  const pivot = { x: parkingZone.x, y: parkingZone.y };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Local offset relative to center of parkingZone
      const localX = (c + 0.5) * slotWidth - parkingZone.width / 2;
      const localY = (r + 0.5) * slotLength - parkingZone.height / 2;

      // Absolute unrotated point
      const unrotatedPoint = {
        x: parkingZone.x + localX,
        y: parkingZone.y + localY,
      };

      // Rotated point
      const rotated = rotatePoint(unrotatedPoint, pivot, parkingZone.rotation);

      slots.push({
        id: `${parkingZone.id}_slot_${r}_${c}`,
        x: rotated.x,
        y: rotated.y,
        width: slotWidth,
        height: slotLength,
        rotation: parkingZone.rotation,
      });
    }
  }

  return slots;
}

/**
 * Places windows procedurally along the building perimeter.
 */
export interface WindowPlacement {
  id: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
  side: "front" | "back" | "left" | "right";
}

export function generateWindowPlacements(building: Omit<Building, "id">, windowSpacing = 3.0, windowWidth = 1.8): WindowPlacement[] {
  const placements: WindowPlacement[] = [];
  const pivot = { x: building.x, y: building.y };

  // Helper to place on a specific side wall
  const placeOnWall = (
    side: "front" | "back" | "left" | "right",
    wallLength: number,
    angleOffset: number // Angle offset relative to building rotation
  ) => {
    const count = Math.floor((wallLength - 1.0) / windowSpacing);
    if (count <= 0) return;

    for (let i = 0; i < count; i++) {
      // Spaced evenly along wall length
      const offsetOnWall = (i + 0.5) * (wallLength / count) - wallLength / 2;

      let localX = 0;
      let localY = 0;

      if (side === "front") {
        localX = offsetOnWall;
        localY = building.width / 2; // Bottom side relative to center
      } else if (side === "back") {
        localX = offsetOnWall;
        localY = -building.width / 2;
      } else if (side === "left") {
        localX = -building.length / 2;
        localY = offsetOnWall;
      } else if (side === "right") {
        localX = building.length / 2;
        localY = offsetOnWall;
      }

      const unrotated = {
        x: building.x + localX,
        y: building.y + localY,
      };

      const rotated = rotatePoint(unrotated, pivot, building.rotation);

      placements.push({
        id: `window_${side}_${i}`,
        x: rotated.x,
        y: rotated.y,
        width: windowWidth,
        rotation: building.rotation + angleOffset,
        side,
      });
    }
  };

  placeOnWall("back", building.length, 0);
  placeOnWall("front", building.length, 180);
  placeOnWall("left", building.width, 90);
  placeOnWall("right", building.width, 270);

  return placements;
}

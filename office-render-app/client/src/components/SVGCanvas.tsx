import React, { useState, useRef, useEffect } from "react";
import { useProjectStore } from "../stores/projectStore";
import { generateParkingSlots, generateWindowPlacements, snapToGrid } from "../geometry/geometryEngine";
import type { DesignElement } from "../types/project";

export const SVGCanvas: React.FC = () => {
  const { project, selectedElementId, setSelectedElementId, updateBuildingDetails, updateElement } = useProjectStore();
  const activeScenario = project.scenarios[project.activeScenario];
  const building = activeScenario.building;
  const elements = activeScenario.elements;
  const site = project.site;
  const snap = project.settings.snapToGrid;
  const gridSize = project.settings.gridSize;

  const [zoom, setZoom] = useState(4); // Default pixels per meter
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Element interaction states
  const [activeDrag, setActiveDrag] = useState<{
    id: string | "building";
    type: "move" | "resize" | "rotate";
    initialX: number;
    initialY: number;
    initialWidth: number;
    initialHeight: number;
    initialRotation: number;
    startX: number; // Page coordinates
    startY: number;
  } | null>(null);

  const canvasRef = useRef<SVGSVGElement>(null);

  // Convert screen coordinates to canvas space (meters)
  const getCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  // Zoom handling (Mouse wheel)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const nextZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    // Cap zoom
    if (nextZoom < 1 || nextZoom > 30) return;

    // Zoom centered on mouse cursor
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newPanX = mouseX - (mouseX - pan.x) * (nextZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (nextZoom / zoom);

      setZoom(nextZoom);
      setPan({ x: newPanX, y: newPanY });
    }
  };

  // Pan handling (Middle click or Space + drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    // If middle click or if target is the background canvas
    if (e.button === 1 || e.target === canvasRef.current || (e.target as SVGElement).id === "canvas-bg") {
      e.preventDefault();
      setIsPanning(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStart({ ...pan });
    }
  };

  // Mouse move router (Handles moves, drags, resizes, rotates)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan({
        x: panStart.x + dx,
        y: panStart.y + dy,
      });
      return;
    }

    if (!activeDrag) return;

    e.preventDefault();
    const currentCoords = getCanvasCoords(e.clientX, e.clientY);
    const startCanvasCoords = getCanvasCoords(activeDrag.startX, activeDrag.startY);
    const dCanvasX = currentCoords.x - startCanvasCoords.x;
    const dCanvasY = currentCoords.y - startCanvasCoords.y;

    if (activeDrag.type === "move") {
      let targetX = activeDrag.initialX + dCanvasX;
      let targetY = activeDrag.initialY + dCanvasY;

      if (snap) {
        targetX = snapToGrid(targetX, gridSize);
        targetY = snapToGrid(targetY, gridSize);
      }

      if (activeDrag.id === "building") {
        updateBuildingDetails({ x: targetX, y: targetY });
      } else {
        updateElement(activeDrag.id, { x: targetX, y: targetY });
      }
    } else if (activeDrag.type === "resize") {
      // Simple scaling logic (symmetric expansion from center)
      let targetW = activeDrag.initialWidth + dCanvasX * 2;
      let targetH = activeDrag.initialHeight + dCanvasY * 2;

      // Restrict minimum size
      targetW = Math.max(2, targetW);
      targetH = Math.max(2, targetH);

      if (snap) {
        targetW = snapToGrid(targetW, gridSize);
        targetH = snapToGrid(targetH, gridSize);
      }

      if (activeDrag.id === "building") {
        updateBuildingDetails({ length: targetW, width: targetH });
      } else {
        updateElement(activeDrag.id, { width: targetW, height: targetH });
      }
    } else if (activeDrag.type === "rotate") {
      // Calculate angle from center to current mouse
      const center = { x: activeDrag.initialX, y: activeDrag.initialY };
      const rad = Math.atan2(currentCoords.y - center.y, currentCoords.x - center.x);
      let angle = (rad * 180) / Math.PI - 90; // offset by 90 degrees for standard handle alignment
      if (angle < 0) angle += 360;

      if (snap) {
        angle = snapToGrid(angle, 15); // snap rotation to 15 degree increments
      }

      if (activeDrag.id === "building") {
        updateBuildingDetails({ rotation: angle });
      } else {
        updateElement(activeDrag.id, { rotation: angle });
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setActiveDrag(null);
  };

  // Bind mouseUp/mouseMove globally to prevent dragging lockups outside canvas bounds
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      setActiveDrag(null);
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // Helper to start dragging / transforming
  const startTransform = (
    e: React.MouseEvent,
    id: string | "building",
    type: "move" | "resize" | "rotate",
    initials: { x: number; y: number; w: number; h: number; r: number }
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedElementId(id);
    setActiveDrag({
      id,
      type,
      initialX: initials.x,
      initialY: initials.y,
      initialWidth: initials.w,
      initialHeight: initials.h,
      initialRotation: initials.r,
      startX: e.clientX,
      startY: e.clientY,
    });
  };

  // Generate procedural elements
  const windows = generateWindowPlacements(building);

  return (
    <div className="w-full h-full relative overflow-hidden bg-blueprint-bg">
      <svg
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Background Click Handler */}
        <rect
          id="canvas-bg"
          width="100%"
          height="100%"
          fill="transparent"
          onClick={() => setSelectedElementId(null)}
        />

        {/* Global Transform Group for Pan & Zoom */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          
          {/* Site Property Outline */}
          <rect
            x={0}
            y={0}
            width={site.length}
            height={site.width}
            fill="none"
            stroke="var(--color-blueprint-line)"
            strokeWidth={0.8}
            strokeDasharray="6 4"
          />
          <text
            x={2}
            y={-2}
            fontSize={2.5}
            fill="var(--color-blueprint-line)"
            fontFamily="monospace"
          >
            PROPERTY LINE: {site.length}m x {site.width}m
          </text>

          {/* Render Elements (Roads, Gardens, Walkways, Parking) */}
          {elements.map((el) => {
            if (!el.visible) return null;
            
            // Draw specific layers
            if (el.type === "road") {
              return (
                <g key={el.id}>
                  <rect
                    x={el.x - el.width / 2}
                    y={el.y - el.height / 2}
                    width={el.width}
                    height={el.height}
                    transform={`rotate(${el.rotation}, ${el.x}, ${el.y})`}
                    fill="#334155"
                    opacity={0.8}
                    stroke="var(--color-blueprint-line-dim)"
                    strokeWidth={0.3}
                    onClick={(e) => startTransform(e, el.id, "move", { x: el.x, y: el.y, w: el.width, h: el.height, r: el.rotation })}
                  />
                  {/* Road Center Stripe */}
                  <line
                    x1={el.x}
                    y1={el.y - el.height / 2}
                    x2={el.x}
                    y2={el.y + el.height / 2}
                    transform={`rotate(${el.rotation}, ${el.x}, ${el.y})`}
                    stroke="#e2e8f0"
                    strokeWidth={0.2}
                    strokeDasharray="1.5 1"
                  />
                </g>
              );
            }

            if (el.type === "garden") {
              return (
                <rect
                  key={el.id}
                  x={el.x - el.width / 2}
                  y={el.y - el.height / 2}
                  width={el.width}
                  height={el.height}
                  transform={`rotate(${el.rotation}, ${el.x}, ${el.y})`}
                  fill="rgba(74, 222, 128, 0.15)"
                  stroke="var(--color-blueprint-success)"
                  strokeWidth={0.3}
                  onClick={(e) => startTransform(e, el.id, "move", { x: el.x, y: el.y, w: el.width, h: el.height, r: el.rotation })}
                />
              );
            }

            if (el.type === "parking") {
              const slots = generateParkingSlots(el);
              return (
                <g key={el.id}>
                  {/* Parking Bounds */}
                  <rect
                    x={el.x - el.width / 2}
                    y={el.y - el.height / 2}
                    width={el.width}
                    height={el.height}
                    transform={`rotate(${el.rotation}, ${el.x}, ${el.y})`}
                    fill="none"
                    stroke="var(--color-blueprint-line)"
                    strokeWidth={0.4}
                    strokeDasharray="3 1.5"
                    onClick={(e) => startTransform(e, el.id, "move", { x: el.x, y: el.y, w: el.width, h: el.height, r: el.rotation })}
                  />
                  {/* Render Procedural Parking Slots */}
                  {slots.map((slot) => (
                    <rect
                      key={slot.id}
                      x={slot.x - slot.width / 2}
                      y={slot.y - slot.height / 2}
                      width={slot.width}
                      height={slot.height}
                      transform={`rotate(${slot.rotation}, ${slot.x}, ${slot.y})`}
                      fill="none"
                      stroke="var(--color-blueprint-line-dim)"
                      strokeWidth={0.15}
                    />
                  ))}
                </g>
              );
            }

            if (el.type === "tree") {
              return (
                <circle
                  key={el.id}
                  cx={el.x}
                  cy={el.y}
                  r={el.width / 2}
                  fill="rgba(34, 197, 94, 0.4)"
                  stroke="rgba(34, 197, 94, 0.8)"
                  strokeWidth={0.3}
                  onClick={(e) => startTransform(e, el.id, "move", { x: el.x, y: el.y, w: el.width, h: el.height, r: el.rotation })}
                />
              );
            }

            if (el.type === "solar_panel") {
              return (
                <rect
                  key={el.id}
                  x={el.x - el.width / 2}
                  y={el.y - el.height / 2}
                  width={el.width}
                  height={el.height}
                  transform={`rotate(${el.rotation}, ${el.x}, ${el.y})`}
                  fill="rgba(59, 130, 246, 0.3)"
                  stroke="var(--color-blueprint-line)"
                  strokeWidth={0.3}
                  onClick={(e) => startTransform(e, el.id, "move", { x: el.x, y: el.y, w: el.width, h: el.height, r: el.rotation })}
                />
              );
            }

            if (el.type === "utility_hub") {
              return (
                <rect
                  key={el.id}
                  x={el.x - el.width / 2}
                  y={el.y - el.height / 2}
                  width={el.width}
                  height={el.height}
                  transform={`rotate(${el.rotation}, ${el.x}, ${el.y})`}
                  fill="rgba(242, 166, 90, 0.15)"
                  stroke="var(--color-blueprint-accent)"
                  strokeWidth={0.4}
                  strokeDasharray="4 2"
                  onClick={(e) => startTransform(e, el.id, "move", { x: el.x, y: el.y, w: el.width, h: el.height, r: el.rotation })}
                />
              );
            }

            return null;
          })}

          {/* 3. Main Building Footprint */}
          <g>
            <rect
              x={building.x - building.length / 2}
              y={building.y - building.width / 2}
              width={building.length}
              height={building.width}
              transform={`rotate(${building.rotation}, ${building.x}, ${building.y})`}
              fill="rgba(127, 209, 232, 0.15)"
              stroke="var(--color-blueprint-line)"
              strokeWidth={0.8}
              onClick={(e) =>
                startTransform(e, "building", "move", {
                  x: building.x,
                  y: building.y,
                  w: building.length,
                  h: building.width,
                  r: building.rotation,
                })
              }
            />

            {/* Rendering Procedural Windows along facade */}
            {windows.map((win) => (
              <line
                key={win.id}
                x1={win.x - win.width / 2}
                y1={win.y}
                x2={win.x + win.width / 2}
                y2={win.y}
                transform={`rotate(${win.rotation}, ${win.x}, ${win.y})`}
                stroke="rgba(239, 68, 68, 0.9)"
                strokeWidth={0.5}
              />
            ))}

            {/* Inner label */}
            <text
              x={building.x}
              y={building.y}
              transform={`rotate(${building.rotation}, ${building.x}, ${building.y})`}
              fontSize={3}
              fill="var(--color-blueprint-line)"
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="monospace"
              className="pointer-events-none"
            >
              OFFICE BASE ({building.floors} FLOORS)
            </text>
          </g>

          {/* 4. Selection Outlines & Interactive Transform Handles */}
          {selectedElementId && (() => {
            const isBuilding = selectedElementId === "building";
            const target = isBuilding
              ? building
              : elements.find((el) => el.id === selectedElementId);

            if (!target) return null;

            const w = isBuilding ? building.length : (target as DesignElement).width;
            const h = isBuilding ? building.width : (target as DesignElement).height;
            const x = target.x;
            const y = target.y;
            const r = target.rotation;

            // Draw bounding selection outline
            return (
              <g>
                <rect
                  x={x - w / 2}
                  y={y - h / 2}
                  width={w}
                  height={h}
                  transform={`rotate(${r}, ${x}, ${y})`}
                  fill="none"
                  stroke="var(--color-blueprint-accent)"
                  strokeWidth={0.3}
                  strokeDasharray="1.5 1"
                  className="pointer-events-none"
                />

                {/* Resize Handle (bottom right corner) */}
                <g transform={`rotate(${r}, ${x}, ${y})`}>
                  <rect
                    x={x + w / 2 - 1.2}
                    y={y + h / 2 - 1.2}
                    width={2.4}
                    height={2.4}
                    fill="var(--color-blueprint-accent)"
                    stroke="#fff"
                    strokeWidth={0.2}
                    className="cursor-se-resize"
                    onMouseDown={(e) => startTransform(e, selectedElementId, "resize", { x, y, w, h, r })}
                  />
                  
                  {/* Rotation Handle (lollipop at top center) */}
                  <line
                    x1={x}
                    y1={y - h / 2}
                    x2={x}
                    y2={y - h / 2 - 4}
                    stroke="var(--color-blueprint-accent)"
                    strokeWidth={0.3}
                  />
                  <circle
                    cx={x}
                    cy={y - h / 2 - 4}
                    r={1.2}
                    fill="var(--color-blueprint-accent)"
                    stroke="#fff"
                    strokeWidth={0.2}
                    className="cursor-alias"
                    onMouseDown={(e) => startTransform(e, selectedElementId, "rotate", { x, y, w, h, r })}
                  />
                </g>
              </g>
            );
          })()}
        </g>
      </svg>
      
      {/* Zoom / Pan Help Overlay */}
      <div className="absolute bottom-4 left-4 p-2 bg-blueprint-panel border border-blueprint-line-dim/40 text-[10px] font-mono rounded text-blueprint-text-dim pointer-events-none">
        [Scroll] Zoom | [Middle-Click + Drag] Pan | [Click] Select | [Drag Object] Move | [Lollipop Handle] Rotate
      </div>
    </div>
  );
};

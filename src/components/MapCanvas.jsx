import { Stage, Layer, Line, Circle, Text, Group, Rect } from "react-konva";
import { useEffect, useRef, useState } from "react";

export default function MapCanvas({
  state,
  tags = [],
  onMouseWorldChange,
  onAddWall,
  onSetPendingWallStart,
  onAddAnchor,
  onMoveAnchor,
  onUpdateAnchor,
  onPanChange,
  onSelectEntity,
}) {
  const { walls, anchors, ui, mapMeta } = state;

  const stageRef = useRef(null);
  const containerRef = useRef(null);

  const SNAP_STEP = 0.5;
  const currentScale = ui.pan?.scale ?? 1;

  const [viewport, setViewport] = useState({
    width: 1000,
    height: 700,
  });

  useEffect(() => {
    const updateViewport = () => {
      const container = containerRef.current;

      if (!container) {
        setViewport({
          width: window.innerWidth,
          height: window.innerHeight,
        });
        return;
      }

      setViewport({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateViewport();

    const resizeObserver = new ResizeObserver(updateViewport);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    window.addEventListener("resize", updateViewport);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  const toPxX = (m) => m * mapMeta.scale;
  const toPxY = (m) => m * mapMeta.scale;

  const panX = ui.pan?.x ?? 0;
  const panY = ui.pan?.y ?? 0;

  function screenPointToWorld(point, snap = true) {
    const rawX = (point.x - panX) / (currentScale * mapMeta.scale);
    const rawY = (point.y - panY) / (currentScale * mapMeta.scale);

    if (!snap) {
      return { x: rawX, y: rawY };
    }

    return {
      x: Math.round(rawX / SNAP_STEP) * SNAP_STEP,
      y: Math.round(rawY / SNAP_STEP) * SNAP_STEP,
    };
  }

  function pointerToWorld() {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };

    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };

    return screenPointToWorld(pointer, true);
  }

  const visibleTopLeft = screenPointToWorld({ x: 0, y: 0 }, false);
  const visibleBottomRight = screenPointToWorld(
    { x: viewport.width, y: viewport.height },
    false
  );

  const paddingMeters = 3;

  const gridStartX = Math.floor((visibleTopLeft.x - paddingMeters) / SNAP_STEP) * SNAP_STEP;
  const gridStartY = Math.floor((visibleTopLeft.y - paddingMeters) / SNAP_STEP) * SNAP_STEP;
  const gridEndX = Math.ceil((visibleBottomRight.x + paddingMeters) / SNAP_STEP) * SNAP_STEP;
  const gridEndY = Math.ceil((visibleBottomRight.y + paddingMeters) / SNAP_STEP) * SNAP_STEP;

  const verticalLines = [];
  for (let x = gridStartX; x <= gridEndX; x += SNAP_STEP) {
    verticalLines.push(x);
  }

  const horizontalLines = [];
  for (let y = gridStartY; y <= gridEndY; y += SNAP_STEP) {
    horizontalLines.push(y);
  }

  function isMajorGridLine(value) {
    return Math.abs(value - Math.round(value)) < 0.0001;
  }

  function handleStagePan(e) {
    onPanChange?.({
      ...ui.pan,
      x: e.target.x(),
      y: e.target.y(),
      scale: currentScale,
    });
  }

  return (
    <div ref={containerRef} className="map-canvas-viewport">
      <Stage
        ref={stageRef}
        width={viewport.width}
        height={viewport.height}
        x={panX}
        y={panY}
        scaleX={currentScale}
        scaleY={currentScale}
        draggable={ui.activeTool === "pan"}
        onDragMove={handleStagePan}
        onDragEnd={handleStagePan}
        onMouseMove={() => onMouseWorldChange?.(pointerToWorld())}
        onMouseDown={(e) => {
          if (ui.activeTool === "pan") return;

          const isBackground =
            e.target === e.target.getStage() ||
            e.target.name() === "background";

          if (!isBackground) return;

          const world = pointerToWorld();

          if (ui.activeTool === "wall") {
            if (!ui.pendingWallStart) {
              onSetPendingWallStart?.(world);
            } else {
              onAddWall?.({
                x1: ui.pendingWallStart.x,
                y1: ui.pendingWallStart.y,
                x2: world.x,
                y2: world.y,
              });
              onSetPendingWallStart?.(null);
            }
          }

          if (ui.activeTool === "anchor") {
            onAddAnchor?.(world);
          }

          if (ui.activeTool === "select") {
            onSelectEntity?.(null);
          }
        }}
      >
        <Layer>
          {/* Dynamic white background covering the visible world area */}
          <Rect
            x={toPxX(gridStartX)}
            y={toPxY(gridStartY)}
            width={toPxX(gridEndX - gridStartX)}
            height={toPxY(gridEndY - gridStartY)}
            fill="#ffffff"
            name="background"
          />

          {/* Dynamic grid */}
          {verticalLines.map((x) => (
            <Line
              key={`v-${x}`}
              points={[
                toPxX(x),
                toPxY(gridStartY),
                toPxX(x),
                toPxY(gridEndY),
              ]}
              stroke={isMajorGridLine(x) ? "#cbd5e1" : "#f1f5f9"}
              strokeWidth={1 / currentScale}
              listening={false}
            />
          ))}

          {horizontalLines.map((y) => (
            <Line
              key={`h-${y}`}
              points={[
                toPxX(gridStartX),
                toPxY(y),
                toPxX(gridEndX),
                toPxY(y),
              ]}
              stroke={isMajorGridLine(y) ? "#cbd5e1" : "#f1f5f9"}
              strokeWidth={1 / currentScale}
              listening={false}
            />
          ))}

          {/* Walls */}
          {walls.allIds.map((id) => {
            const wall = walls.byId[id];
            const isSelected = ui.selectedEntity?.id === id;

            return (
              <Line
                key={id}
                points={[
                  toPxX(wall.x1),
                  toPxY(wall.y1),
                  toPxX(wall.x2),
                  toPxY(wall.y2),
                ]}
                stroke={isSelected ? "#ef4444" : "#1e293b"}
                strokeWidth={8 / currentScale}
                lineCap="round"
                onClick={(e) => {
                  e.cancelBubble = true;
                  onSelectEntity?.({ type: "wall", id });
                }}
              />
            );
          })}

          {/* Anchors / ESP nodes */}
          {anchors.allIds.map((id) => {
            const anchor = anchors.byId[id];
            const isSelected = ui.selectedEntity?.id === id;

            return (
              <Group
                key={id}
                x={toPxX(anchor.x)}
                y={toPxY(anchor.y)}
                draggable={ui.activeTool === "select"}
                onDragEnd={(e) => {
                  const node = e.target;

                  const newX =
                    Math.round(node.x() / mapMeta.scale / SNAP_STEP) *
                    SNAP_STEP;
                  const newY =
                    Math.round(node.y() / mapMeta.scale / SNAP_STEP) *
                    SNAP_STEP;

                  const updater = onMoveAnchor || onUpdateAnchor;
                  updater?.(id, { x: newX, y: newY });
                }}
                onClick={(e) => {
                  e.cancelBubble = true;
                  onSelectEntity?.({ type: "anchor", id });
                }}
              >
                <Rect
                  width={18 / currentScale}
                  height={18 / currentScale}
                  offsetX={9 / currentScale}
                  offsetY={9 / currentScale}
                  fill={isSelected ? "#ef4444" : "#3b82f6"}
                  rotation={45}
                  stroke="#ffffff"
                  strokeWidth={2 / currentScale}
                />

                <Text
                  text={anchor.name}
                  y={16 / currentScale}
                  width={100 / currentScale}
                  offsetX={50 / currentScale}
                  align="center"
                  fontSize={12 / currentScale}
                  fill="#1e293b"
                  fontStyle="bold"
                />
              </Group>
            );
          })}

          {/* Tags */}
          {tags.map((tag) => {
            const x = tag.x ?? 0;
            const y = tag.y ?? 0;
            const tagId = tag.id ?? tag.tag_mac;
            const isSelected = ui.selectedEntity?.id === tagId;

            return (
              <Group
                key={tagId}
                x={toPxX(x)}
                y={toPxY(y)}
                onClick={(e) => {
                  e.cancelBubble = true;
                  onSelectEntity?.({ type: "tag", id: tagId });
                }}
              >
                <Circle
                  radius={12 / currentScale}
                  fill="#f7c551"
                  stroke="#ffffff"
                  strokeWidth={2 / currentScale}
                />

                <Text
                  text={`${x.toFixed(2)}m, ${y.toFixed(2)}m`}
                  fontSize={(isSelected ? 13 : 10) / currentScale}
                  fill={isSelected ? "#111827" : "#64748b"}
                  align="center"
                  width={120 / currentScale}
                  offsetX={60 / currentScale}
                  y={16 / currentScale}
                  fontStyle={isSelected ? "bold" : "normal"}
                />
              </Group>
            );
          })}

          {/* Wall preview */}
          {ui.pendingWallStart && ui.activeTool === "wall" && (
            <Line
              points={[
                toPxX(ui.pendingWallStart.x),
                toPxY(ui.pendingWallStart.y),
                toPxX(ui.mouseWorld.x),
                toPxY(ui.mouseWorld.y),
              ]}
              stroke="#10b981"
              strokeWidth={2 / currentScale}
              dash={[5, 5]}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}

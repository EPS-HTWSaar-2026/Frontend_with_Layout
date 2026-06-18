import { Stage, Layer, Line, Circle, Text, Group, Rect } from "react-konva";
import { useRef, useState, useEffect } from "react";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function MapCanvas({
  state,
  tags = [],
  onMouseWorldChange,
  onAddWall,
  onUpdateWall,
  onSetPendingWallStart,
  onAddAnchor,
  onUpdateAnchor,
  onSelectEntity,
}) {
  const { walls, anchors, ui, mapMeta } = state;
  const stageRef = useRef(null);

  const SNAP_STEP = 0.5;
  const currentScale = ui.pan.scale || 1;

  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toPxX = (m) => m * mapMeta.scale;
  const toPxY = (m) => m * mapMeta.scale;

  const screenToWorld = () => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };

    const transform = stage.getAbsoluteTransform().copy().invert();
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };

    const relPos = transform.point(pointer);

    const worldX =
      Math.round(relPos.x / mapMeta.scale / SNAP_STEP) * SNAP_STEP;
    const worldY =
      Math.round(relPos.y / mapMeta.scale / SNAP_STEP) * SNAP_STEP;

    return {
      x: worldX,
      y: worldY,
    };
  };

  const stage = stageRef.current;
  let gridStartX = 0;
  let gridStartY = 0;
  let gridEndX = viewport.width / mapMeta.scale;
  let gridEndY = viewport.height / mapMeta.scale;

  if (stage) {
    const transform = stage.getAbsoluteTransform().copy().invert();
    const topLeft = transform.point({ x: 0, y: 0 });
    const bottomRight = transform.point({
      x: viewport.width,
      y: viewport.height,
    });

    gridStartX = Math.floor(topLeft.x / SNAP_STEP) * SNAP_STEP;
    gridStartY = Math.floor(topLeft.y / SNAP_STEP) * SNAP_STEP;
    gridEndX = Math.ceil(bottomRight.x / SNAP_STEP) * SNAP_STEP;
    gridEndY = Math.ceil(bottomRight.y / SNAP_STEP) * SNAP_STEP;
  }

  return (
    <div
      style={{
        background: "#0f172a",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Stage
        ref={stageRef}
        width={viewport.width}
        height={viewport.height}
        scaleX={currentScale}
        scaleY={currentScale}
        onMouseMove={() => onMouseWorldChange(screenToWorld())}
        onMouseDown={(e) => {
          if (ui.activeTool === "pan") return;

          const isBackground =
            e.target === e.target.getStage() ||
            e.target.name() === "background";

          if (!isBackground) return;

          const world = screenToWorld();

          if (ui.activeTool === "wall") {
            if (!ui.pendingWallStart) {
              onSetPendingWallStart(world);
            } else {
              onAddWall({
                x1: ui.pendingWallStart.x,
                y1: ui.pendingWallStart.y,
                x2: world.x,
                y2: world.y,
              });
              onSetPendingWallStart(null);
            }
          } else if (ui.activeTool === "anchor") {
            onAddAnchor(world);
          } else if (ui.activeTool === "select") {
            onSelectEntity(null);
          }
        }}
      >
        <Layer>

          {/* BACKGROUND */}
          <Rect
            x={0}
            y={0}
            width={viewport.width / currentScale}
            height={viewport.height / currentScale}
            fill="#ffffff"
            name="background"
          />

          {/* GRID DINÁMICO (INFINITO VISUAL) */}
          {Array.from({
            length: Math.ceil((gridEndX - gridStartX) / SNAP_STEP),
          }).map((_, i) => {
            const x = gridStartX + i * SNAP_STEP;
            const isMajor = x % 1 === 0;

            return (
              <Line
                key={`v-${i}`}
                points={[
                  toPxX(x),
                  toPxY(gridStartY),
                  toPxX(x),
                  toPxY(gridEndY),
                ]}
                stroke={isMajor ? "#cbd5e1" : "#f1f5f9"}
                strokeWidth={1 / currentScale}
                listening={false}
              />
            );
          })}

          {Array.from({
            length: Math.ceil((gridEndY - gridStartY) / SNAP_STEP),
          }).map((_, i) => {
            const y = gridStartY + i * SNAP_STEP;
            const isMajor = y % 1 === 0;

            return (
              <Line
                key={`h-${i}`}
                points={[
                  toPxX(gridStartX),
                  toPxY(y),
                  toPxX(gridEndX),
                  toPxY(y),
                ]}
                stroke={isMajor ? "#cbd5e1" : "#f1f5f9"}
                strokeWidth={1 / currentScale}
                listening={false}
              />
            );
          })}

          {/* WALLS */}
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
                  onSelectEntity({ type: "wall", id });
                }}
              />
            );
          })}

          {/* ANCHORS */}
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

                  onUpdateAnchor(id, { x: newX, y: newY });
                }}
                onClick={(e) => {
                  e.cancelBubble = true;
                  onSelectEntity({ type: "anchor", id });
                }}
              >
                <Rect
                  width={18 / currentScale}
                  height={18 / currentScale}
                  offsetX={9 / currentScale}
                  offsetY={9 / currentScale}
                  fill={isSelected ? "#ef4444" : "#3b82f6"}
                  rotation={45}
                  stroke="#fff"
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


        
          {/* TAGS */}
          {tags.map((tag) => {
            const x = tag.x ?? 0;
            const y = tag.y ?? 0;

            const isSelected = ui.selectedEntity?.id === tag.id;
            const isOut = false; 

            return (
              <Group
                key={tag.id}
                x={toPxX(x)}
                y={toPxY(y)}
                onClick={(e) => {
                  e.cancelBubble = true;
                  onSelectEntity({ type: "tag", id: tag.id });
                }}
              >
                {/* TAG POINT */}
                <Circle
                  radius={12 / currentScale}
                  fill="#f7c551"
                  stroke="#fff"
                  strokeWidth={2 / currentScale}
                />

                {/* COORDENATES */}
                <Text
                  text={`${x.toFixed(2)}m, ${y.toFixed(2)}m`}
                  fontSize={(isSelected ? 13 : 10) / currentScale}
                  fill={isSelected ? "#fff" : (isOut ? "#fbbf24" : "#64748b")}
                  align="center"
                  width={110 / currentScale}
                  offsetX={55 / currentScale}
                  y={isSelected ? 6 / currentScale : 0}
                  fontStyle={isSelected ? "bold" : "normal"}
                />
              </Group>
            );
          })}

          {/* WALL PREVIEW */}
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
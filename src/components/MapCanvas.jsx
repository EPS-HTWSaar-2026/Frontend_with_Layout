import { Stage, Layer, Line, Circle, Text, Group, Rect } from "react-konva";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function MapCanvas({
  state,
  onMouseWorldChange,
  onAddWall,
  onSetPendingWallStart,
  onAddAnchor,
  onSelectEntity,
  onMoveAnchor,
  onPanChange,
}) {
  const { mapMeta, walls, anchors, ui } = state;
  const widthPx = mapMeta.width * mapMeta.scale;
  const heightPx = mapMeta.height * mapMeta.scale;

  function snapValue(value) {
    if (!ui.snapToGrid) return value;
    const step = mapMeta.gridSize;
    return Math.round(value / step) * step;
  }

  function screenToWorld(point) {
    const x = clamp((point.x - ui.pan.x) / mapMeta.scale, 0, mapMeta.width);
    const y = clamp((point.y - ui.pan.y) / mapMeta.scale, 0, mapMeta.height);

    return {
      x: snapValue(x),
      y: snapValue(y),
    };
  }

  function handleMouseMove(e) {
    const pointer = e.target.getStage()?.getPointerPosition();
    if (!pointer) return;

    const world = screenToWorld(pointer);
    onMouseWorldChange(world);
  }

  function handleBackgroundClick(e) {
    if (ui.activeTool === "pan") return;

    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;

    const world = screenToWorld(pointer);

    if (ui.activeTool === "select") {
      onSelectEntity(null);
      return;
    }

    if (ui.activeTool === "anchor") {
      onAddAnchor(world);
      return;
    }

    if (ui.activeTool === "wall") {
      if (!ui.pendingWallStart) {
        onSetPendingWallStart(world);
      } else {
        const start = ui.pendingWallStart;
        if (start.x !== world.x || start.y !== world.y) {
          onAddWall({
            x1: start.x,
            y1: start.y,
            x2: world.x,
            y2: world.y,
          });
        } else {
          onSetPendingWallStart(null);
        }
      }
    }
  }

  const gridLines = [];
  if (ui.showGrid) {
    for (let x = 0; x <= mapMeta.width; x += mapMeta.gridSize) {
      gridLines.push(
        <Line
          key={`gx-${x}`}
          points={[x * mapMeta.scale, 0, x * mapMeta.scale, heightPx]}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      );
    }

    for (let y = 0; y <= mapMeta.height; y += mapMeta.gridSize) {
      gridLines.push(
        <Line
          key={`gy-${y}`}
          points={[0, y * mapMeta.scale, widthPx, y * mapMeta.scale]}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      );
    }
  }

  return (
    <div className="canvas-wrapper">
      <Stage
        width={widthPx}
        height={heightPx}
        x={ui.pan.x}
        y={ui.pan.y}
        draggable={ui.activeTool === "pan"}
        onDragEnd={(e) => {
          onPanChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onMouseMove={handleMouseMove}
        className="canvas-stage"
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={widthPx}
            height={heightPx}
            fill="#ffffff"
            onClick={handleBackgroundClick}
          />

          {gridLines}

          {walls.allIds.map((id) => {
            const wall = walls.byId[id];
            const selected =
              ui.selectedEntity?.type === "wall" && ui.selectedEntity?.id === id;

            return (
              <Line
                key={id}
                points={[
                  wall.x1 * mapMeta.scale,
                  wall.y1 * mapMeta.scale,
                  wall.x2 * mapMeta.scale,
                  wall.y2 * mapMeta.scale,
                ]}
                stroke={selected ? "#ef4444" : "#111827"}
                strokeWidth={Math.max(3, wall.thickness * mapMeta.scale)}
                hitStrokeWidth={16}
                lineCap="round"
                onClick={(e) => {
                  if (ui.activeTool === "pan") return;
                  e.cancelBubble = true;
                  onSelectEntity({ type: "wall", id });
                }}
              />
            );
          })}

          {anchors.allIds.map((id) => {
            const anchor = anchors.byId[id];
            const selected =
              ui.selectedEntity?.type === "anchor" && ui.selectedEntity?.id === id;

            return (
              <Group
                key={id}
                x={anchor.x * mapMeta.scale}
                y={anchor.y * mapMeta.scale}
                draggable={ui.activeTool === "select"}
                onDragEnd={(e) => {
                  const pos = e.target.position();
                  const world = screenToWorld({
                    x: pos.x + ui.pan.x,
                    y: pos.y + ui.pan.y,
                  });
                  onMoveAnchor(id, world);
                }}
                onClick={(e) => {
                  if (ui.activeTool === "pan") return;
                  e.cancelBubble = true;
                  onSelectEntity({ type: "anchor", id });
                }}
              >
                <Circle
                  radius={12}
                  fill={anchor.color}
                  stroke={selected ? "#ef4444" : "#ffffff"}
                  strokeWidth={selected ? 4 : 2}
                  opacity={anchor.isActive ? 1 : 0.4}
                />
                <Text
                  text={anchor.name}
                  x={16}
                  y={-8}
                  fontSize={12}
                  fill="#111827"
                />
              </Group>
            );
          })}

          {ui.pendingWallStart ? (
            <>
              <Circle
                x={ui.pendingWallStart.x * mapMeta.scale}
                y={ui.pendingWallStart.y * mapMeta.scale}
                radius={5}
                fill="#ef4444"
              />
              <Line
                points={[
                  ui.pendingWallStart.x * mapMeta.scale,
                  ui.pendingWallStart.y * mapMeta.scale,
                  ui.mouseWorld.x * mapMeta.scale,
                  ui.mouseWorld.y * mapMeta.scale,
                ]}
                stroke="#ef4444"
                dash={[6, 4]}
                strokeWidth={2}
              />
            </>
          ) : null}
        </Layer>
      </Stage>
    </div>
  );
}
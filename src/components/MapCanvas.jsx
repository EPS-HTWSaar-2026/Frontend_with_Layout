import { Stage, Layer, Line, Circle, Text, Group, Rect } from "react-konva";
import { useRef } from "react";

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
  onPanChange,
}) {
  const { mapMeta, walls, anchors, ui } = state;
  const stageRef = useRef(null);

  // --- 校准参数 ---
  const MAP_W = mapMeta.width;
  const MAP_H = mapMeta.height;
  const SNAP_STEP = 0.5;
  const UNIT_CONVERSION = 0.01;

  // 这里的数值已根据显示反馈归零
  const OFFSET_X = 48;
  const OFFSET_Y = 2488;

  const widthPx = MAP_W * mapMeta.scale;
  const heightPx = MAP_H * mapMeta.scale;
  const currentScale = ui.pan.scale || 1;

  const toPxX = (m) => m * mapMeta.scale;
  const toPxY = (m) => m * mapMeta.scale;

  const screenToWorld = () => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };
    const relPos = transform.point(pointer);
    let worldX = Math.round((relPos.x / mapMeta.scale) / SNAP_STEP) * SNAP_STEP;
    let worldY = Math.round((relPos.y / mapMeta.scale) / SNAP_STEP) * SNAP_STEP;
    return { x: clamp(worldX, 0, MAP_W), y: clamp(worldY, 0, MAP_H) };
  };

  return (
    <div style={{ background: "#0f172a", width: "100%", height: "100vh", overflow: "hidden" }}>
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        x={ui.pan.x}
        y={ui.pan.y}
        scaleX={currentScale}
        scaleY={currentScale}
        draggable={ui.activeTool === "pan"}
        onWheel={(e) => {
          e.evt.preventDefault();
          const stage = stageRef.current;
          const oldScale = stage.scaleX();
          const pointer = stage.getPointerPosition();
          const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
          const speed = 1.15;
          const newScale = clamp(e.evt.deltaY < 0 ? oldScale * speed : oldScale / speed, 0.1, 20);
          const newPos = { x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale };
          stage.scale({ x: newScale, y: newScale });
          stage.position(newPos);
          onPanChange({ ...newPos, scale: newScale });
        }}
        onMouseMove={() => onMouseWorldChange(screenToWorld())}
        onMouseDown={(e) => {
          if (ui.activeTool === "pan") return;
          const isBackground = e.target === e.target.getStage() || e.target.name() === "background";
          if (!isBackground) return;
          const world = screenToWorld();
          if (ui.activeTool === "wall") {
            if (!ui.pendingWallStart) onSetPendingWallStart(world);
            else {
              onAddWall({ x1: ui.pendingWallStart.x, y1: ui.pendingWallStart.y, x2: world.x, y2: world.y });
              onSetPendingWallStart(null);
            }
          } else if (ui.activeTool === "anchor") onAddAnchor(world);
          else if (ui.activeTool === "select") onSelectEntity(null);
        }}
      >
        <Layer>
          {/* 地图背景 */}
          <Rect width={widthPx} height={heightPx} fill="#ffffff" name="background" shadowBlur={10} shadowOpacity={0.1} />

          {/* 网格线 */}
          {(() => {
            const lines = [];
            for (let i = 0; i <= MAP_W; i += 0.5) {
              const isMajor = i % 1 === 0;
              const color = isMajor ? "#cbd5e1" : "#f1f5f9";
              lines.push(
                <Line key={`v-${i}`} points={[toPxX(i), 0, toPxX(i), heightPx]} stroke={color} strokeWidth={1 / currentScale} listening={false} />,
                <Line key={`h-${i}`} points={[0, toPxY(i), widthPx, toPxY(i)]} stroke={color} strokeWidth={1 / currentScale} listening={false} />
              );
            }
            return lines;
          })()}

          {/* 墙体 */}
          {walls.allIds.map((id) => {
            const wall = walls.byId[id];
            const isSelected = ui.selectedEntity?.id === id;
            return (
              <Line
                key={id}
                points={[toPxX(wall.x1), toPxY(wall.y1), toPxX(wall.x2), toPxY(wall.y2)]}
                stroke={isSelected ? "#ef4444" : "#1e293b"}
                strokeWidth={8 / currentScale}
                lineCap="round"
                onClick={(e) => { e.cancelBubble = true; onSelectEntity({ type: "wall", id }); }}
              />
            );
          })}

          {/* ESP 基站 (可移动) */}
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
                  const newX = clamp(Math.round((node.x() / mapMeta.scale) / SNAP_STEP) * SNAP_STEP, 0, MAP_W);
                  const newY = clamp(Math.round((node.y() / mapMeta.scale) / SNAP_STEP) * SNAP_STEP, 0, MAP_H);
                  onUpdateAnchor(id, { x: newX, y: newY });
                }}
                onClick={(e) => { e.cancelBubble = true; onSelectEntity({ type: "anchor", id }); }}
              >
                <Rect width={18 / currentScale} height={18 / currentScale} offsetX={9 / currentScale} offsetY={9 / currentScale} fill={isSelected ? "#ef4444" : "#3b82f6"} rotation={45} stroke="#fff" strokeWidth={2 / currentScale} />
                <Text text={anchor.name} y={16 / currentScale} width={100 / currentScale} offsetX={50 / currentScale} align="center" fontSize={12 / currentScale} fill="#1e293b" fontStyle="bold" />
              </Group>
            );
          })}

          {/* 实时 Tags (显示当前归零后的坐标) */}
          {tags.map((tag) => {
            // 归零逻辑计算
            const calX = tag.x ?? 0;
            const calY = tag.y ?? 0;

            const isOut = calX < 0 || calX > MAP_W || calY < 0 || calY > MAP_H;
            const safeX = clamp(calX, 0, MAP_W);
            const safeY = clamp(calY, 0, MAP_H);
            const isSelected = ui.selectedEntity?.id === tag.id;

            return (
              <Group
                key={tag.id}
                x={toPxX(safeX)}
                y={toPxY(safeY)}
                onClick={(e) => { e.cancelBubble = true; onSelectEntity({ type: "tag", id: tag.id }); }}
              >
                {isSelected && (
                  <Circle radius={22 / currentScale} fill="rgba(244, 63, 94, 0.1)" stroke="#f43f5e" strokeWidth={1 / currentScale} />
                )}
                <Circle radius={isSelected ? 9 / currentScale : 7 / currentScale} fill={isOut ? "#fbbf24" : "#f43f5e"} stroke="#fff" strokeWidth={2 / currentScale} />

                <Group y={isSelected ? 22 / currentScale : 14 / currentScale}>
                  {isSelected && (
                    <Rect x={-55 / currentScale} width={110 / currentScale} height={26 / currentScale} fill="rgba(15, 23, 42, 0.9)" cornerRadius={4 / currentScale} />
                  )}
                  <Text
                    text={`${calX.toFixed(2)}m, ${calY.toFixed(2)}m`}
                    fontSize={(isSelected ? 13 : 10) / currentScale}
                    fill={isSelected ? "#fff" : (isOut ? "#fbbf24" : "#64748b")}
                    align="center" width={110 / currentScale} offsetX={55 / currentScale}
                    y={isSelected ? 6 / currentScale : 0}
                    fontStyle={isSelected ? "bold" : "normal"}
                  />
                </Group>
              </Group>
            );
          })}

          {ui.pendingWallStart && ui.activeTool === "wall" && (
            <Line points={[toPxX(ui.pendingWallStart.x), toPxY(ui.pendingWallStart.y), toPxX(ui.mouseWorld.x), toPxY(ui.mouseWorld.y)]} stroke="#10b981" strokeWidth={2 / currentScale} dash={[5, 5]} />
          )}
        </Layer>
      </Stage>
    </div>
  );
}

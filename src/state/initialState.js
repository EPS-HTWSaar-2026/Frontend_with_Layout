function makeId(prefix = "id") {
  const randomPart = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 10);
  return `${prefix}_${randomPart}`;
}

export function createDefaultState() {
  return {
    version: 1,
    mapMeta: {
      mapId: makeId("map"),
      name: "Mine Layout",
      width: 20,
      height: 10,
      unit: "m",
      gridSize: 0.5,
      scale: 50,
    },
    environmentProfiles: {
      byId: {
        tunnel_standard: {
          profileId: "tunnel_standard",
          name: "Tunnel Standard",
          nValue: 2.3,
          rssiBaseDefault: -48,
        },
      },
      allIds: ["tunnel_standard"],
    },
    walls: { byId: {}, allIds: [] },
    anchors: { byId: {}, allIds: [] },
    ui: {
      activeTool: "select",
      selectedEntity: null,
      showGrid: true,
      snapToGrid: true,
      pendingWallStart: null,
      mouseWorld: { x: 0, y: 0 },
      pan: { x: 0, y: 0 },
    },
  };
}
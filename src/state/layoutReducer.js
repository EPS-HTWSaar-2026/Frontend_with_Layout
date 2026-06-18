import { createDefaultState } from "./initialState";

function makeId(prefix = "id") {
  const randomPart =
    globalThis.crypto?.randomUUID?.() ||
    Math.random().toString(36).slice(2, 10);
  return `${prefix}_${randomPart}`;
}

function removeId(array, id) {
  return array.filter((item) => item !== id);
}

export function layoutReducer(state, action) {
  switch (action.type) {
    case "SET_TOOL":
      return {
        ...state,
        ui: {
          ...state.ui,
          activeTool: action.payload,
          pendingWallStart: action.payload === "wall" ? state.ui.pendingWallStart : null,
        },
      };

    case "SET_MOUSE_WORLD":
      return {
        ...state,
        ui: {
          ...state.ui,
          mouseWorld: action.payload,
        },
      };

    case "SET_PENDING_WALL_START":
      return {
        ...state,
        ui: {
          ...state.ui,
          pendingWallStart: action.payload,
        },
      };

    case "SET_SELECTED_ENTITY":
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedEntity: action.payload,
        },
      };

    case "TOGGLE_GRID":
      return {
        ...state,
        ui: {
          ...state.ui,
          showGrid: !state.ui.showGrid,
        },
      };

    case "TOGGLE_SNAP":
      return {
        ...state,
        ui: {
          ...state.ui,
          snapToGrid: !state.ui.snapToGrid,
        },
      };

    case "SET_PAN":
      return {
        ...state,
        ui: {
          ...state.ui,
          pan: action.payload,
        },
      };

    case "UPDATE_MAP_META":
      return {
        ...state,
        mapMeta: {
          ...state.mapMeta,
          ...action.payload,
        },
      };

    case "ADD_WALL": {
      const id = makeId("wall");
      const wall = {
        id,
        x1: action.payload.x1,
        y1: action.payload.y1,
        x2: action.payload.x2,
        y2: action.payload.y2,
        thickness: 0.15,
        material: "concrete",
        name: `Wall ${state.walls.allIds.length + 1}`, 
      };

      return {
        ...state,
        walls: {
          byId: {
            ...state.walls.byId,
            [id]: wall,
          },
          allIds: [...state.walls.allIds, id],
        },
        ui: {
          ...state.ui,
          selectedEntity: { type: "wall", id },
          pendingWallStart: null,
        },
      };
    }

    case "UPDATE_WALL": {
      const { id, changes } = action.payload;
      if (!state.walls.byId[id]) return state;

      return {
        ...state,
        walls: {
          ...state.walls,
          byId: {
            ...state.walls.byId,
            [id]: {
              ...state.walls.byId[id],
              ...changes,
            },
          },
        },
      };
    }

    case "ADD_ANCHOR": {

      if (state.anchors.allIds.length >= 3) {
      return state;
      }

  const id = makeId("anchor");

      const defaultProfileId = state.environmentProfiles.allIds[0];
      const defaultProfile = state.environmentProfiles.byId[defaultProfileId];

      const anchor = {
        id: id, // 
        anchorId: id,
        name: `ESP ${state.anchors.allIds.length + 1}`,
        x: action.payload.x,
        y: action.payload.y,
        z: 1.8,
        environmentProfile: defaultProfileId,
        nValue: defaultProfile.nValue,
        rssiBase: defaultProfile.rssiBaseDefault,
        isActive: true,
        color: "#2563eb",
        notes: "",
      };

      return {
        ...state,
        anchors: {
          byId: {
            ...state.anchors.byId,
            [id]: anchor,
          },
          allIds: [...state.anchors.allIds, id],
        },
        ui: {
          ...state.ui,
          selectedEntity: { type: "anchor", id },
        },
      };
    }

    case "UPDATE_ANCHOR": {
      const { id, changes } = action.payload;
      if (!state.anchors.byId[id]) return state;

      return {
        ...state,
        anchors: {
          ...state.anchors,
          byId: {
            ...state.anchors.byId,
            [id]: {
              ...state.anchors.byId[id],
              ...changes,
            },
          },
        },
      };
    }

  
    case "DELETE_ENTITY": {
      const { type, id } = action.payload;
      const targetKey = type === "anchor" ? "anchors" : "walls";

      const newById = { ...state[targetKey].byId };
      delete newById[id];

      return {
        ...state,
        [targetKey]: {
          byId: newById,
          allIds: state[targetKey].allIds.filter((entityId) => entityId !== id),
        },
        ui: {
          ...state.ui,
          selectedEntity: null, 
        },
      };
    }


    case "DELETE_SELECTED": {
      const selected = state.ui.selectedEntity;
      if (!selected) return state;

      const targetKey = selected.type === "anchor" ? "anchors" : "walls";
      const newById = { ...state[targetKey].byId };
      delete newById[selected.id];

      return {
        ...state,
        [targetKey]: {
          byId: newById,
          allIds: state[targetKey].allIds.filter((id) => id !== selected.id),
        },
        ui: {
          ...state.ui,
          selectedEntity: null,
        },
      };
    }

    case "RESET_LAYOUT":
      return createDefaultState();

    case "LOAD_LAYOUT": {
      const incoming = action.payload;
      return {
        ...incoming,
        ui: {
          activeTool: "select",
          selectedEntity: null,
          showGrid: incoming.ui?.showGrid ?? true,
          snapToGrid: incoming.ui?.snapToGrid ?? true,
          pendingWallStart: null,
          mouseWorld: { x: 0, y: 0 },
          pan: incoming.ui?.pan ?? { x: 0, y: 0 },
        },
      };
    }

    default:
      return state;
  }
}
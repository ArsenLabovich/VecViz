import { create } from "zustand";
import type { SearchResponse } from "@/types/search";

export type CameraAction =
  | "move-left" | "move-right"
  | "move-up"   | "move-down"
  | "move-forward" | "move-backward"
  | "zoom-in"   | "zoom-out"
  | "reset"
  | null;

interface SceneState {
  // Selection
  hoveredPointId: string | null;
  selectedPointId: string | null;

  // Search
  searchResult: SearchResponse | null;
  isSearchAnimating: boolean;

  // Camera target (for fly-to)
  cameraTarget: [number, number, number] | null;

  // Camera action (from controls overlay)
  cameraAction: CameraAction;

  setHovered: (id: string | null) => void;
  setSelected: (id: string | null) => void;
  setSearchResult: (result: SearchResponse | null) => void;
  setSearchAnimating: (v: boolean) => void;
  setCameraTarget: (target: [number, number, number] | null) => void;
  setCameraAction: (action: CameraAction) => void;
  clearSearch: () => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  hoveredPointId: null,
  selectedPointId: null,
  searchResult: null,
  isSearchAnimating: false,
  cameraTarget: null,
  cameraAction: null,

  setHovered: (id) => set({ hoveredPointId: id }),
  setSelected: (id) => set({ selectedPointId: id }),
  setSearchResult: (result) => set({ searchResult: result, isSearchAnimating: !!result }),
  setSearchAnimating: (v) => set({ isSearchAnimating: v }),
  setCameraTarget: (target) => set({ cameraTarget: target }),
  setCameraAction: (action) => set({ cameraAction: action }),
  clearSearch: () => set({ searchResult: null, isSearchAnimating: false }),
}));

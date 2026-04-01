import { create } from "zustand";
import type { SearchResponse } from "@/types/search";

interface SceneState {
  // Selection
  hoveredPointId: string | null;
  selectedPointId: string | null;

  // Search
  searchResult: SearchResponse | null;
  isSearchAnimating: boolean;

  // Filters
  activeClusterId: number | null;
  activeDocumentId: string | null;

  // Camera target (for fly-to)
  cameraTarget: [number, number, number] | null;

  setHovered: (id: string | null) => void;
  setSelected: (id: string | null) => void;
  setSearchResult: (result: SearchResponse | null) => void;
  setSearchAnimating: (v: boolean) => void;
  setActiveCluster: (id: number | null) => void;
  setActiveDocument: (id: string | null) => void;
  setCameraTarget: (target: [number, number, number] | null) => void;
  clearSearch: () => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  hoveredPointId: null,
  selectedPointId: null,
  searchResult: null,
  isSearchAnimating: false,
  activeClusterId: null,
  activeDocumentId: null,
  cameraTarget: null,

  setHovered: (id) => set({ hoveredPointId: id }),
  setSelected: (id) => set({ selectedPointId: id }),
  setSearchResult: (result) => set({ searchResult: result, isSearchAnimating: !!result }),
  setSearchAnimating: (v) => set({ isSearchAnimating: v }),
  setActiveCluster: (id) => set({ activeClusterId: id }),
  setActiveDocument: (id) => set({ activeDocumentId: id }),
  setCameraTarget: (target) => set({ cameraTarget: target }),
  clearSearch: () => set({ searchResult: null, isSearchAnimating: false }),
}));

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  theme: "dark" | "light";
  sidebarOpen: boolean;
  detailPanelOpen: boolean;
  activeCollection: string | null;
  uploadProgress: number | null; // 0-100 or null
  uploadStage: string | null;
  autoCameraEnabled: boolean;

  setTheme: (t: "dark" | "light") => void;
  toggleTheme: () => void;
  setSidebarOpen: (v: boolean) => void;
  toggleAutoCamera: () => void;
  setDetailPanelOpen: (v: boolean) => void;
  setActiveCollection: (name: string | null) => void;
  setUploadProgress: (p: number | null, stage?: string | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      sidebarOpen: true,
      detailPanelOpen: false,
      activeCollection: null,
      uploadProgress: null,
      uploadStage: null,
      autoCameraEnabled: false,

      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      toggleAutoCamera: () => set((s) => ({ autoCameraEnabled: !s.autoCameraEnabled })),
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      setDetailPanelOpen: (v) => set({ detailPanelOpen: v }),
      setActiveCollection: (name) => set({ activeCollection: name }),
      setUploadProgress: (p, stage = null) => set({ uploadProgress: p, uploadStage: stage }),
    }),
    {
      name: "vecviz-ui",
      partialize: (s) => ({ theme: s.theme, activeCollection: s.activeCollection }),
    }
  )
);

import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { DetailPanel } from "./DetailPanel";
import { SceneCanvas } from "@/components/scene/SceneCanvas";
import { StatsOverlay } from "@/components/ui/StatsOverlay";
import { SceneControls } from "@/components/ui/SceneControls";

export function AppShell() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      background: "#020814",
      color: "rgba(255,255,255,0.88)",
    }}>
      <TopBar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar />
        <main style={{ position: "relative", flex: 1, overflow: "hidden" }}>
          <SceneCanvas />
          <StatsOverlay />
          <SceneControls />
        </main>
        <DetailPanel />
      </div>
    </div>
  );
}

import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { DetailPanel } from "./DetailPanel";
import { SceneCanvas } from "@/components/scene/SceneCanvas";
import { StatsOverlay } from "@/components/ui/StatsOverlay";

export function AppShell() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#050510] text-white">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="relative flex-1 overflow-hidden">
          <SceneCanvas />
          <StatsOverlay />
        </main>
        <DetailPanel />
      </div>
    </div>
  );
}

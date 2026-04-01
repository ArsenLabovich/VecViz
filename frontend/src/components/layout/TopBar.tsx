import { SearchBar } from "@/components/ui/SearchBar";
import { useUIStore } from "@/stores/uiStore";

export function TopBar() {
  const toggle = useUIStore((s) => s.toggleTheme);
  const theme = useUIStore((s) => s.theme);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <header className="relative z-20 flex items-center gap-4 border-b border-white/8 bg-black/40 px-4 py-2.5 backdrop-blur-md">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="text-white/40 hover:text-white transition text-lg leading-none"
        title="Toggle sidebar"
      >
        ☰
      </button>

      <span className="text-sm font-semibold text-white/80 tracking-tight whitespace-nowrap">
        VecViz
      </span>

      <div className="flex-1 flex justify-center">
        <SearchBar />
      </div>

      <button
        onClick={toggle}
        className="text-white/30 hover:text-white/70 transition text-sm"
        title="Toggle theme"
      >
        {theme === "dark" ? "☀" : "☾"}
      </button>
    </header>
  );
}

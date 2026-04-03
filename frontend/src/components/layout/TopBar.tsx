import { SearchBar } from "@/components/ui/SearchBar";
import { useUIStore } from "@/stores/uiStore";

export function TopBar() {
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <header style={{
      height: 48,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "0 14px",
      background: "rgba(2,8,20,0.94)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      position: "relative",
      zIndex: 20,
      flexShrink: 0,
    }}>
      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title="Toggle sidebar"
        style={{
          width: 30, height: 30,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 7,
          background: sidebarOpen ? "rgba(59,130,246,0.13)" : "transparent",
          border: `1px solid ${sidebarOpen ? "rgba(59,130,246,0.28)" : "rgba(255,255,255,0.09)"}`,
          color: sidebarOpen ? "rgba(99,160,255,0.9)" : "rgba(255,255,255,0.32)",
          cursor: "pointer",
          transition: "all 0.15s",
          flexShrink: 0,
        }}
      >
        <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
          <rect width="14" height="1.6" rx="0.8" fill="currentColor"/>
          <rect y="4.7" width="9" height="1.6" rx="0.8" fill="currentColor"/>
          <rect y="9.4" width="14" height="1.6" rx="0.8" fill="currentColor"/>
        </svg>
      </button>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0, userSelect: "none" }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: "linear-gradient(135deg, #2563eb 0%, #6366f1 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 12px rgba(99,102,241,0.35)",
        }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="3.5" cy="3.5" r="1.8" fill="white" fillOpacity="0.95"/>
            <circle cx="9.5" cy="3" r="1.2" fill="white" fillOpacity="0.65"/>
            <circle cx="6.5" cy="9" r="1.4" fill="white" fillOpacity="0.8"/>
            <circle cx="2" cy="9.5" r="0.9" fill="white" fillOpacity="0.4"/>
            <circle cx="10.5" cy="8" r="1" fill="white" fillOpacity="0.5"/>
          </svg>
        </div>
        <span style={{
          fontFamily: '"Outfit", sans-serif',
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: "0.04em",
          color: "rgba(255,255,255,0.88)",
        }}>VecViz</span>
        <span style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9,
          fontWeight: 400,
          letterSpacing: "0.12em",
          color: "rgba(99,130,255,0.55)",
          textTransform: "uppercase",
          paddingTop: 1,
        }}>3D</span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />

      {/* Search */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <SearchBar />
      </div>

      {/* Docs link / version badge */}
      <div style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 9,
        letterSpacing: "0.1em",
        color: "rgba(255,255,255,0.18)",
        flexShrink: 0,
        userSelect: "none",
      }}>v0.5</div>
    </header>
  );
}

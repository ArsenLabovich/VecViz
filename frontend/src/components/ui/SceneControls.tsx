import { useCallback } from "react";
import { useSceneStore, type CameraAction } from "@/stores/sceneStore";
import { useUIStore } from "@/stores/uiStore";

const BTN: React.CSSProperties = {
  width: 34,
  height: 34,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(4,12,28,0.78)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 7,
  color: "rgba(255,255,255,0.50)",
  cursor: "pointer",
  fontSize: 14,
  transition: "all 0.13s",
  userSelect: "none",
  flexShrink: 0,
};

function IconZoomIn() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ pointerEvents: "none" }}>
      <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 9L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5.5 3.5V7.5M3.5 5.5H7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconZoomOut() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ pointerEvents: "none" }}>
      <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 9L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M3.5 5.5H7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconAuto() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ pointerEvents: "none" }}>
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6.5 4v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HoldBtn({
  action,
  children,
  title,
  onStart,
  onEnd,
}: {
  action: CameraAction;
  children: React.ReactNode;
  title?: string;
  onStart: (a: CameraAction) => void;
  onEnd: () => void;
}) {
  return (
    <button
      title={title}
      style={BTN}
      onMouseDown={(e) => {
        e.stopPropagation();
        onStart(action);
        const stop = () => { onEnd(); document.removeEventListener("mouseup", stop); };
        document.addEventListener("mouseup", stop);
      }}
      onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); onStart(action); }}
      onTouchEnd={(e) => { e.stopPropagation(); onEnd(); }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(59,130,246,0.18)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(59,130,246,0.35)";
        (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.85)";
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(4,12,28,0.78)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.10)";
        (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.50)";
      }}
    >
      {children}
    </button>
  );
}

export function SceneControls() {
  const setCameraAction = useSceneStore((s) => s.setCameraAction);
  const autoCamera = useUIStore((s) => s.autoCameraEnabled);
  const toggleAutoCamera = useUIStore((s) => s.toggleAutoCamera);

  const start = useCallback((a: CameraAction) => setCameraAction(a), [setCameraAction]);
  const stop = useCallback(() => setCameraAction(null), [setCameraAction]);

  return (
    <div style={{
      position: "absolute",
      bottom: 20,
      right: 16,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
      zIndex: 15,
    }}>
      {/* Zoom buttons */}
      <div style={{ display: "flex", gap: 4 }}>
        <HoldBtn action="zoom-in" title="Zoom in" onStart={start} onEnd={stop}>
          <IconZoomIn />
        </HoldBtn>
        <HoldBtn action="zoom-out" title="Zoom out" onStart={start} onEnd={stop}>
          <IconZoomOut />
        </HoldBtn>
      </div>

      {/* Separator */}
      <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.06)", margin: "2px 0" }} />

      {/* Auto camera toggle */}
      <button
        title={autoCamera ? "Disable auto camera" : "Enable auto camera"}
        onClick={toggleAutoCamera}
        style={{
          ...BTN,
          width: "100%",
          background: autoCamera ? "rgba(59,130,246,0.18)" : "rgba(4,12,28,0.78)",
          border: `1px solid ${autoCamera ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.10)"}`,
          color: autoCamera ? "rgba(99,160,255,0.9)" : "rgba(255,255,255,0.40)",
          gap: 5,
          fontSize: 10,
          fontFamily: '"JetBrains Mono", monospace',
          letterSpacing: "0.04em",
        }}
      >
        <IconAuto />
        AUTO
      </button>
    </div>
  );
}

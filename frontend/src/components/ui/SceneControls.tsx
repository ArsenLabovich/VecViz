import { useCallback } from "react";
import { useSceneStore, type CameraAction } from "@/stores/sceneStore";
import { useUIStore } from "@/stores/uiStore";

const BTN = {
  width: 34, height: 34,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "rgba(4,12,28,0.78)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 7,
  color: "rgba(255,255,255,0.50)",
  cursor: "pointer",
  fontSize: 14,
  transition: "all 0.13s",
  userSelect: "none" as const,
  flexShrink: 0,
};

function Btn({
  action, children, title, onStart, onEnd,
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
      onMouseDown={(e) => { e.stopPropagation(); console.log("[CamCtrl] start:", action); onStart(action); }}
      onMouseUp={(e) => { e.stopPropagation(); console.log("[CamCtrl] stop"); onEnd(); }}
      onMouseLeave={(e) => { e.stopPropagation(); onEnd(); }}
      onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); onStart(action); }}
      onTouchEnd={(e) => { e.stopPropagation(); onEnd(); }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(59,130,246,0.18)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(59,130,246,0.35)";
        (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.85)";
      }}
      onMouseOut={e => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(4,12,28,0.78)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.10)";
        (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.50)";
      }}
    >
      {children}
    </button>
  );
}

function IconArrowUp() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 10V2M6 2L2.5 5.5M6 2L9.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
function IconArrowDown() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 2V10M6 10L2.5 6.5M6 10L9.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
function IconArrowLeft() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M10 6H2M2 6L5.5 2.5M2 6L5.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
function IconArrowRight() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 6H10M10 6L6.5 2.5M10 6L6.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
function IconZoomIn() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M9 9L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M5.5 3.5V7.5M3.5 5.5H7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>;
}
function IconZoomOut() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M9 9L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M3.5 5.5H7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>;
}
function IconForward() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M6.5 11L6.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M3 5.5L6.5 2L10 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 8.5L9 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
  </svg>;
}
function IconBackward() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M6.5 2L6.5 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M3 7.5L6.5 11L10 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 4.5L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
  </svg>;
}
function IconReset() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 6.5A4.5 4.5 0 0 1 6.5 2a4.5 4.5 0 0 1 4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M11 2V5H8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11 6.5A4.5 4.5 0 0 1 6.5 11 4.5 4.5 0 0 1 2 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.45"/>
  </svg>;
}

function IconAuto() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M6.5 4v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

export function SceneControls() {
  const setCameraAction = useSceneStore((s) => s.setCameraAction);
  const autoCamera      = useUIStore((s) => s.autoCameraEnabled);
  const toggleAutoCamera = useUIStore((s) => s.toggleAutoCamera);

  const start = useCallback((a: CameraAction) => setCameraAction(a), [setCameraAction]);
  const stop  = useCallback(() => setCameraAction(null), [setCameraAction]);

  const wrap: React.CSSProperties = {
    position: "absolute",
    bottom: 20,
    right: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    zIndex: 15,
  };

  const row: React.CSSProperties = {
    display: "flex", gap: 4,
  };

  return (
    <div style={wrap}>
      {/* Zoom + depth row */}
      <div style={{ ...row, marginBottom: 2 }}>
        <Btn action="zoom-in"      title="Zoom in"       onStart={start} onEnd={stop}><IconZoomIn /></Btn>
        <Btn action="zoom-out"     title="Zoom out"      onStart={start} onEnd={stop}><IconZoomOut /></Btn>
        <Btn action="move-forward" title="Move forward"  onStart={start} onEnd={stop}><IconForward /></Btn>
        <Btn action="move-backward"title="Move backward" onStart={start} onEnd={stop}><IconBackward /></Btn>
      </div>

      {/* Separator */}
      <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.06)", margin: "2px 0" }} />

      {/* Up */}
      <div style={row}>
        <Btn action="move-up"    title="Move up"    onStart={start} onEnd={stop}><IconArrowUp /></Btn>
      </div>
      {/* Left / Reset / Right */}
      <div style={row}>
        <Btn action="move-left"  title="Move left"  onStart={start} onEnd={stop}><IconArrowLeft /></Btn>
        <Btn action="reset"      title="Reset view" onStart={start} onEnd={stop}><IconReset /></Btn>
        <Btn action="move-right" title="Move right" onStart={start} onEnd={stop}><IconArrowRight /></Btn>
      </div>
      {/* Down */}
      <div style={row}>
        <Btn action="move-down"  title="Move down"  onStart={start} onEnd={stop}><IconArrowDown /></Btn>
      </div>

      {/* Auto camera toggle */}
      <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
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

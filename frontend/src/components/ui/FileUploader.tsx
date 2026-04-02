import { useRef, useState } from "react";
import { useUpload } from "@/hooks/useUpload";
import { useUIStore } from "@/stores/uiStore";

export function FileUploader() {
  const collection = useUIStore((s) => s.activeCollection);
  const uploadProgress = useUIStore((s) => s.uploadProgress);
  const uploadStage = useUIStore((s) => s.uploadStage);
  const { upload, error } = useUpload(collection);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const isUploading = uploadProgress !== null;

  const handleFiles = (files: FileList | null) => {
    if (!files?.length || !collection) return;
    upload(files[0]);
  };

  return (
    <div style={{ padding: "12px 10px" }}>
      {/* Section label */}
      <div style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.28)",
        padding: "0 4px",
        marginBottom: 8,
      }}>Upload</div>

      <div
        onClick={() => !isUploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          border: `1.5px dashed ${dragging ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.12)"}`,
          background: dragging ? "rgba(59,130,246,0.07)" : "rgba(255,255,255,0.02)",
          padding: isUploading ? "14px 12px" : "18px 12px",
          cursor: !collection || isUploading ? "default" : "pointer",
          opacity: !collection ? 0.35 : 1,
          pointerEvents: !collection ? "none" : "auto",
          transition: "all 0.2s",
          minHeight: 80,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.pdf"
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />

        {isUploading ? (
          <div style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", textTransform: "capitalize" }}>
                {uploadStage ?? "processing"}…
              </span>
              <span style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10,
                color: "rgba(59,130,246,0.8)",
              }}>
                {uploadProgress}%
              </span>
            </div>
            {/* Track */}
            <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${uploadProgress}%`,
                background: "linear-gradient(90deg, #3b82f6, #6366f1)",
                borderRadius: 2,
                transition: "width 0.3s ease",
                boxShadow: "0 0 8px rgba(59,130,246,0.5)",
              }} />
            </div>
          </div>
        ) : (
          <>
            {/* Upload icon */}
            <div style={{
              width: 34, height: 34,
              borderRadius: 8,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 9,
            }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M7.5 1L7.5 10M7.5 1L4.5 4M7.5 1L10.5 4" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 11V13H13V11" stroke="rgba(255,255,255,0.25)" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.50)", marginBottom: 3 }}>
              Drop file here
            </p>
            <p style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9,
              color: "rgba(255,255,255,0.22)",
              letterSpacing: "0.05em",
            }}>
              .txt · .md · .pdf
            </p>
          </>
        )}
      </div>

      {error && (
        <p style={{
          marginTop: 6,
          fontSize: 11,
          color: "rgba(248,113,113,0.85)",
          textAlign: "center",
        }}>{error}</p>
      )}
    </div>
  );
}

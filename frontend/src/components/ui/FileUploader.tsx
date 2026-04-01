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
    <div className="p-3">
      <div
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-5 text-center transition cursor-pointer
          ${dragging ? "border-blue-400 bg-blue-500/10" : "border-white/15 hover:border-white/30"}
          ${!collection ? "opacity-40 pointer-events-none" : ""}
        `}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {isUploading ? (
          <div className="w-full">
            <p className="text-xs text-white/60 mb-2 capitalize">{uploadStage ?? "processing"}…</p>
            <div className="h-1.5 w-full rounded-full bg-white/10">
              <div
                className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <p className="text-2xl mb-1">📄</p>
            <p className="text-xs text-white/50">Drop .txt / .md / .pdf</p>
            <p className="text-xs text-white/25 mt-0.5">or click to browse</p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}

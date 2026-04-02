import { motion, AnimatePresence } from "motion/react";
import { CollectionList } from "@/components/ui/CollectionList";
import { FileUploader } from "@/components/ui/FileUploader";
import { useUIStore } from "@/stores/uiStore";

export function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          key="sidebar"
          initial={{ x: -260, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -260, opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 32 }}
          style={{
            position: "relative",
            zIndex: 10,
            width: 240,
            display: "flex",
            flexDirection: "column",
            background: "rgba(3,10,24,0.90)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRight: "1px solid rgba(255,255,255,0.07)",
            overflowY: "auto",
            overflowX: "hidden",
            flexShrink: 0,
          }}
        >
          <CollectionList />
          <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <FileUploader />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

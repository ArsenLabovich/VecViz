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
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -280, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative z-10 flex w-64 flex-col border-r border-white/8 bg-black/50 backdrop-blur-md overflow-y-auto"
        >
          <CollectionList />
          <div className="border-t border-white/8 mt-auto">
            <FileUploader />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

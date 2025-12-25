import { useEffect, useRef, useState } from "react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "./ui/context-menu";
import { NoteData } from "../stores/noteStore";

interface NoteContextMenuProps {
  children: React.ReactNode;
  note: NoteData;
  onDuplicate: () => void;
  onTogglePin: () => void;
  onCopyTitle: () => void;
  onCopyContent: () => void;
  onDelete: () => void;
  onNewNote?: () => void; // Optional for now
}

export function NoteContextMenu({
  children,
  note,
  onDuplicate,
  onTogglePin,
  onCopyTitle,
  onCopyContent,
  onDelete,
  onNewNote,
}: NoteContextMenuProps) {
  const [menuDimensions, setMenuDimensions] = useState({
    width: "12rem",
    maxHeight: "24rem",
  });
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate responsive width (clamp between 12rem and 16rem)
      const responsiveWidth = Math.max(
        192,
        Math.min(256, Math.floor(viewportWidth * 0.8))
      );

      // Calculate responsive max-height (35% of viewport, min 12rem)
      const responsiveMaxHeight = Math.max(
        192,
        Math.floor(viewportHeight * 0.35)
      );

      setMenuDimensions({
        width: `${responsiveWidth}px`,
        maxHeight: `${responsiveMaxHeight}px`,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent
        ref={contentRef}
        className="rounded-2xl !p-4 bg-white/95 backdrop-blur-sm shadow-xl border-none flex flex-col gap-2 overflow-y-auto"
        style={{
          width: menuDimensions.width,
          maxHeight: menuDimensions.maxHeight,
        }}
      >
        {onNewNote && (
          <ContextMenuItem
            onClick={onNewNote}
            className="rounded-md !p-1 text-[13px] font-medium text-slate-700 focus:bg-slate-200 focus:text-slate-900 cursor-pointer"
          >
            New Note
          </ContextMenuItem>
        )}

        {/* Placeholder for Hide Note to match image */}
        <ContextMenuItem
          disabled
          className="rounded-md !p-1 text-[12px] font-medium text-slate-400 focus:bg-slate-200 cursor-not-allowed"
        >
          Hide Note
        </ContextMenuItem>

        <ContextMenuItem
          onClick={onTogglePin}
          className="rounded-md !p-1 text-[13px] font-medium text-slate-700 focus:bg-slate-200 focus:text-slate-900 cursor-pointer"
        >
          {note.pinned ? "Unpin Note" : "Pin Note"}
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-slate-200" />
        <ContextMenuItem
          onClick={onDelete}
          className="rounded-md !p-1  text-[13px] font-medium text-red-500 focus:bg-red-100 focus:text-red-700 cursor-pointer"
        >
          Delete Note
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

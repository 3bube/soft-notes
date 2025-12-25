import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { NoteData, useNoteStore } from "../stores/noteStore";
import { invoke } from "@tauri-apps/api/core";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { TopMenu } from "./TopMenu";
import { NoteContextMenu } from "./NoteContextMenu";
import "./Note.css";

interface NoteProps {
  note: NoteData;
}

export function Note({ note }: NoteProps) {
  const [title, setTitle] = useState(note.title || "");
  const [content, setContent] = useState(note.content);
  const [isHovering, setIsHovering] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const colorUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  const {
    focusedNoteId,
    hoveredNoteId,
    setFocusedNoteId,
    setHoveredNoteId,
    setControlPanelNoteId,
    updateNote,
    notes,
  } = useNoteStore();

  // Get the current note from store to reflect real-time updates
  const currentNote = notes.find((n) => n.id === note.id) || note;

  const isFocused = focusedNoteId === note.id;
  const isHovered = hoveredNoteId === note.id;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuTriggerRef.current &&
        !menuTriggerRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    const newTimestamp = new Date().toISOString();
    setTitle(newTitle);
    updateNote(note.id, { title: newTitle, updated_at: newTimestamp });

    const timer = setTimeout(async () => {
      try {
        await invoke("update_note", {
          note: {
            ...note,
            title: newTitle,
            updated_at: newTimestamp,
          },
        });
      } catch (error) {
        console.error("Failed to update note title:", error);
      }
    }, 500);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const newTimestamp = new Date().toISOString();
    setContent(newContent);
    updateNote(note.id, { content: newContent, updated_at: newTimestamp });

    setTimeout(async () => {
      try {
        await invoke("update_note", {
          note: {
            ...note,
            content: newContent,
            updated_at: newTimestamp,
          },
        });
      } catch (error) {
        console.error("Failed to update note:", error);
      }
    }, 500);
  };

  const handleDelete = async () => {
    try {
      await invoke("delete_note", { id: note.id });
      useNoteStore.getState().removeNote(note.id);
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const handleColorChange = async (newColor: string) => {
    updateNote(note.id, { color: newColor });
    try {
      await invoke("update_note", {
        note: {
          ...note,
          color: newColor,
          updated_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Failed to update note color:", error);
    }
    setControlPanelNoteId(null);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleNewNote = async () => {
    const newNoteId = `note-${Date.now()}`;
    const newNote: NoteData = {
      id: newNoteId,
      title: "",
      content: "",
      x: currentNote.x + 20,
      y: currentNote.y + 20,
      width: 230,
      height: 300,
      color: "yellow",
      text_color: "#3d3d3d",
      pinned: false,
      has_checkboxes: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await invoke("create_note", {
        id: newNoteId,
        title: newNote.title,
        content: newNote.content,
        color: newNote.color,
        x: newNote.x,
        y: newNote.y,
      });
      useNoteStore.getState().addNote(newNote);
    } catch (error) {
      console.error("Failed to create new note:", error);
    }
  };

  const handleDuplicateNote = async () => {
    const newNoteId = `note-${Date.now()}`;
    const newNote: NoteData = {
      ...currentNote,
      id: newNoteId,
      title: `${currentNote.title} (copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await invoke("create_note", {
        id: newNoteId,
        title: newNote.title,
        content: newNote.content,
        color: newNote.color,
        x: currentNote.x + 20,
        y: currentNote.y + 20,
      });
      useNoteStore.getState().addNote(newNote);
    } catch (error) {
      console.error("Failed to duplicate note:", error);
    }
  };

  const handleTogglePin = async () => {
    const newPinnedState = !currentNote.pinned;
    updateNote(note.id, { pinned: newPinnedState });

    try {
      await invoke("update_note", {
        note: {
          ...currentNote,
          pinned: newPinnedState,
          updated_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error("Failed to copy content:", error);
    }
  };

  const handleCopyTitle = async () => {
    try {
      await navigator.clipboard.writeText(title);
    } catch (error) {
      console.error("Failed to copy title:", error);
    }
  };

  const formatTime = (date: string) => {
    const noteDate = new Date(date);
    const now = new Date();
    const diff = now.getTime() - noteDate.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Edited just now";
    if (minutes < 60) return `Edited ${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Edited ${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `Edited ${days}d ago`;
  };

  // Check if color is a hex value (custom color) or preset name
  const isCustomColor = currentNote.color.startsWith("#");
  const textColor =
    currentNote.textColor || currentNote.text_color || "#3d3d3d";
  const noteStyle = isCustomColor
    ? {
        backgroundColor: currentNote.color,
        width: "100%",
        height: "100%",
      }
    : {
        width: "100%",
        height: "100%",
      };

  const textStyle = {
    color: textColor,
  };

  return (
    <NoteContextMenu
      note={currentNote}
      onDuplicate={handleDuplicateNote}
      onTogglePin={handleTogglePin}
      onCopyTitle={handleCopyTitle}
      onCopyContent={handleCopyContent}
      onDelete={() => {
        try {
          invoke("delete_note", { id: note.id });
          useNoteStore.getState().removeNote(note.id);
        } catch (error) {
          console.error("Failed to delete note:", error);
        }
      }}
      onNewNote={handleNewNote}
    >
      <div
        className={`note ${!isCustomColor ? `note--${currentNote.color}` : ""} ${isFocused ? "note--focused" : ""}`}
        style={noteStyle}
        onMouseEnter={() => {
          setIsHovering(true);
          setHoveredNoteId(note.id);
        }}
        onMouseLeave={() => {
          setIsHovering(false);
          setHoveredNoteId(null);
        }}
      >
        {/* Draggable header */}
        <div className="note__header" data-tauri-drag-region>
          <div className="note__drag-handle" />
          {(isHovering || isHovered) && (
            <button
              ref={menuTriggerRef}
              className="note__menu-trigger"
              title="More options"
              onClick={handleMenuClick}
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
            </button>
          )}
        </div>

        {showMenu && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: 32,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <TopMenu
              note={currentNote}
              onColorChange={(color) => {
                updateNote(note.id, { color });

                if (colorUpdateTimeoutRef.current) {
                  clearTimeout(colorUpdateTimeoutRef.current);
                }

                colorUpdateTimeoutRef.current = setTimeout(() => {
                  invoke("update_note", {
                    note: {
                      ...currentNote,
                      color,
                      updated_at: new Date().toISOString(),
                    },
                  }).catch((e) => console.error("Failed to update color:", e));
                }, 300);
              }}
              onTextColorChange={(text_color) => {
                updateNote(note.id, { textColor: text_color, text_color });

                if (colorUpdateTimeoutRef.current) {
                  clearTimeout(colorUpdateTimeoutRef.current);
                }

                colorUpdateTimeoutRef.current = setTimeout(() => {
                  invoke("update_note", {
                    note: {
                      ...currentNote,
                      text_color,
                      updated_at: new Date().toISOString(),
                    },
                  }).catch((e) =>
                    console.error("Failed to update text color:", e)
                  );
                }, 300);
              }}
              onCheckboxToggle={async () => {
                // Checkbox toggle no longer needed with Yoopta Editor
                // Users can use the editor's built-in list features
              }}
              onDelete={async () => {
                try {
                  await invoke("delete_note", { id: note.id });
                  useNoteStore.getState().removeNote(note.id);
                } catch (error) {
                  console.error("Failed to delete note:", error);
                }
              }}
              onClose={() => setShowMenu(false)}
            />
          </motion.div>
        )}

        <div className="note__body">
          <input
            ref={titleInputRef}
            className="note__title"
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled"
            style={textStyle}
          />
          <textarea
            ref={textareaRef}
            className="note__textarea"
            value={content}
            onChange={handleContentChange}
            onMouseDown={() => setFocusedNoteId(note.id)}
            onBlur={() => setFocusedNoteId(null)}
            placeholder="Start typing..."
            style={textStyle}
          />

          <div className="note__footer">
            <span className="note__timestamp">
              {formatTime(currentNote.updated_at)}
            </span>
          </div>
        </div>
      </div>
    </NoteContextMenu>
  );
}

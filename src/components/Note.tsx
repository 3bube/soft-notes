import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { NoteData, useNoteStore } from "../stores/noteStore";
import { invoke } from "@tauri-apps/api/core";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { TopMenu } from "./TopMenu";
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
    if (isFocused && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isFocused]);

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

    const timer = setTimeout(async () => {
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

  const handleCheckboxChange = (index: number, checked: boolean) => {
    const lines = content.split("\n");
    const line = lines[index];

    if (checked) {
      lines[index] = line.replace(/^- \[ \] /, "- [x] ");
    } else {
      lines[index] = line.replace(/^- \[x\] /, "- [ ] ");
    }

    const newContent = lines.join("\n");
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
        console.error("Failed to update checkbox:", error);
      }
    }, 300);
  };

  const handleCheckboxTextChange = (index: number, text: string) => {
    const lines = content.split("\n");
    const line = lines[index];
    const isChecked = line.startsWith("- [x] ");
    lines[index] = `- [${isChecked ? "x" : " "}] ${text}`;

    const newContent = lines.join("\n");
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
        console.error("Failed to update checkbox text:", error);
      }
    }, 500);
  };

  const handleCheckboxKeyDown = async (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const lines = content.split("\n");
    const currentLine = lines[index];
    const text = (e.target as HTMLInputElement).value;
    const isCheckboxLine =
      currentLine.startsWith("- [ ]") || currentLine.startsWith("- [x]");

    // Handle Enter - add new line or convert checkbox to text
    if (e.key === "Enter" && !e.ctrlKey) {
      e.preventDefault();

      if (isCheckboxLine && text === "") {
        // If on empty checkbox, convert to regular text line
        lines[index] = "";
        const newContent = lines.join("\n");
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
            console.error("Failed to convert checkbox:", error);
          }
        }, 300);
      } else if (isCheckboxLine) {
        // If on checkbox with text, add new checkbox
        lines.splice(index + 1, 0, "- [ ] ");
        const newContent = lines.join("\n");
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
            console.error("Failed to add checkbox:", error);
          }
        }, 300);
      } else {
        // On regular text line, add new text line
        lines.splice(index + 1, 0, "");
        const newContent = lines.join("\n");
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
            console.error("Failed to add text line:", error);
          }
        }, 300);
      }
    }

    // Handle Ctrl+Enter - always add new checkbox
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      lines.splice(index + 1, 0, "- [ ] ");
      const newContent = lines.join("\n");
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
          console.error("Failed to add checkbox:", error);
        }
      }, 300);
    }

    // Handle Backspace - delete line if empty
    if (e.key === "Backspace" && text === "") {
      e.preventDefault();
      lines.splice(index, 1);
      const newContent = lines.join("\n");
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
          console.error("Failed to delete line:", error);
        }
      }, 300);
    }
  };

  const parseCheckboxContent = () => {
    const lines = content.split("\n");
    return lines.map((line, index) => {
      const checkedMatch = line.match(/^- \[x\] (.*)$/);
      const uncheckedMatch = line.match(/^- \[ \] (.*)$/);

      if (checkedMatch) {
        return {
          type: "checkbox",
          checked: true,
          text: checkedMatch[1],
          index,
        };
      } else if (uncheckedMatch) {
        return {
          type: "checkbox",
          checked: false,
          text: uncheckedMatch[1],
          index,
        };
      }
      return { type: "text", text: line, index };
    });
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
              const newCheckboxState = !currentNote.has_checkboxes;
              let newContent = content;

              // If enabling checkboxes and content is empty or doesn't have checkboxes, add initial empty ones
              if (
                newCheckboxState &&
                (!content.trim() || !content.includes("- [ ]"))
              ) {
                newContent = "- [ ] \n- [ ] \n- [ ] ";
                setContent(newContent);
              }

              updateNote(note.id, {
                has_checkboxes: newCheckboxState,
                content: newContent,
                updated_at: new Date().toISOString(),
              });

              try {
                await invoke("update_note", {
                  note: {
                    ...currentNote,
                    has_checkboxes: newCheckboxState,
                    content: newContent,
                    updated_at: new Date().toISOString(),
                  },
                });
              } catch (error) {
                console.error("Failed to update checkbox state:", error);
              }
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
        {currentNote.has_checkboxes ? (
          <div className="note__checkbox-list">
            {parseCheckboxContent().map((item) => (
              <div key={item.index}>
                {item.type === "checkbox" ? (
                  <div className="note__checkbox-item">
                    <input
                      type="checkbox"
                      className="note__checkbox"
                      checked={item.checked}
                      onChange={(e) =>
                        handleCheckboxChange(item.index, e.target.checked)
                      }
                      style={{ accentColor: textColor }}
                    />
                    <input
                      type="text"
                      className={`note__checkbox-text ${item.checked ? "checked" : ""}`}
                      value={item.text}
                      onChange={(e) =>
                        handleCheckboxTextChange(item.index, e.target.value)
                      }
                      onKeyDown={(e) => handleCheckboxKeyDown(item.index, e)}
                      placeholder="New task..."
                      style={textStyle}
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    className="note__text-line"
                    value={item.text}
                    onChange={(e) => {
                      const lines = content.split("\n");
                      lines[item.index] = e.target.value;
                      const newContent = lines.join("\n");
                      const newTimestamp = new Date().toISOString();
                      setContent(newContent);
                      updateNote(note.id, {
                        content: newContent,
                        updated_at: newTimestamp,
                      });

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
                          console.error("Failed to update text line:", error);
                        }
                      }, 500);
                    }}
                    onKeyDown={(e) => handleCheckboxKeyDown(item.index, e)}
                    placeholder="Type text..."
                    style={textStyle}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
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
        )}

        <div className="note__footer">
          <span className="note__timestamp">
            {formatTime(currentNote.updated_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

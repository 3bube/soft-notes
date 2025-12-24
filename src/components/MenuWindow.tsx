import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrent } from "@tauri-apps/api/window";
import { HugeiconsIcon } from "@hugeicons/react";
import { Trash2Icon } from "@hugeicons/react";

const COLORS = ["yellow", "blue", "pink", "green", "purple", "peach"];

export function MenuWindow() {
  const [noteId, setNoteId] = useState<string>("");
  const [noteColor, setNoteColor] = useState<string>("yellow");

  useEffect(() => {
    // Get the note ID from window data or query params
    const getWindowData = async () => {
      const window = getCurrent();
      const label = window.label;
      console.log("MenuWindow - label:", label);
      const id = label.replace("menu-", "");
      console.log("MenuWindow - extracted ID:", id);
      setNoteId(id);

      // Fetch current note color from parent
      try {
        const notes = (await invoke("fetch_all_notes")) as Array<{
          id: string;
          color: string;
        }>;
        console.log("MenuWindow - fetched notes:", notes);
        const note = notes.find((n) => n.id === id);
        if (note) {
          console.log("MenuWindow - found note with color:", note.color);
          setNoteColor(note.color);
        }
      } catch (err) {
        console.error("Failed to fetch note color:", err);
      }
    };

    getWindowData();
  }, []);

  const handleColorChange = async (color: string) => {
    setNoteColor(color);

    try {
      // Get the parent note window and update its color
      const notes = (await invoke("fetch_all_notes")) as Array<any>;
      const note = notes.find((n) => n.id === noteId);
      if (note) {
        const updated = { ...note, color };
        await invoke("update_note", { note: updated });

        // Close this menu window
        const window = getCurrent();
        await window.close();
      }
    } catch (err) {
      console.error("Failed to update note color:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await invoke("delete_note", { id: noteId });

      // Close this menu window
      const window = getCurrent();
      await window.close();
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  return (
    <div className="menu-window">
      <div className="menu-window__colors">
        {COLORS.map((color) => (
          <button
            key={color}
            className={`menu-window__color-swatch menu-window__color-swatch--${color} ${
              noteColor === color ? "menu-window__color-swatch--active" : ""
            }`}
            onClick={() => handleColorChange(color)}
            title={color}
          />
        ))}
      </div>
      <button
        className="menu-window__delete"
        onClick={handleDelete}
        title="Delete"
      >
        <HugeiconsIcon icon={Trash2Icon} size={14} />
      </button>
    </div>
  );
}

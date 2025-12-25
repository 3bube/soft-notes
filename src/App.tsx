import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useNoteStore, NoteData } from "./stores/noteStore";
import "./App.css";
import { Note } from "./components/Note";

function App() {
  const [note, setNote] = useState<NoteData | null>(null);

  useEffect(() => {
    const loadNote = async () => {
      try {
        const window = getCurrentWindow();
        const windowLabel = window.label;

        const notes = await invoke<NoteData[]>("fetch_all_notes");

        if (!notes || notes.length === 0) {
          console.warn("No notes found in database, creating initial note");
          // Create a default note if none exist
          const defaultNote: NoteData = {
            id: `default-${Date.now()}`,
            title: "Welcome to SoftNotes",
            content: "Start typing here...",
            x: 100,
            y: 100,
            width: 230,
            height: 300,
            color: "yellow",
            text_color: "#3d3d3d",
            pinned: false,
            has_checkboxes: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setNote(defaultNote);
          useNoteStore.getState().addNote(defaultNote);
          return;
        }

        const currentNote = notes.find((n) => `note-${n.id}` === windowLabel);

        if (currentNote) {
          setNote(currentNote);
          useNoteStore.getState().addNote(currentNote);
        } else {
          // If no matching note found, use the first note
          console.warn(`No note found for window label: ${windowLabel}`);
          console.warn(
            `Available notes:`,
            notes.map((n) => `note-${n.id}`)
          );

          if (notes.length > 0) {
            setNote(notes[0]);
            useNoteStore.getState().addNote(notes[0]);
          }
        }
      } catch (error) {
        console.error("Failed to load note:", error);
        // Create a fallback note on error
        const fallbackNote: NoteData = {
          id: `fallback-${Date.now()}`,
          title: "SoftNotes",
          content: "Welcome! Your notes will appear here.",
          x: 100,
          y: 100,
          width: 230,
          height: 300,
          color: "yellow",
          text_color: "#3d3d3d",
          pinned: false,
          has_checkboxes: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setNote(fallbackNote);
        useNoteStore.getState().addNote(fallbackNote);
      }
    };

    loadNote();
  }, []);

  if (!note) {
    return null; // Don't render until note is loaded
  }

  return (
    <div className="app">
      <Note note={note} />
    </div>
  );
}

export default App;

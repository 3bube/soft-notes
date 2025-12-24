import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useNoteStore, NoteData } from "./stores/noteStore";
import "./App.css";
import { Note } from "./components/Note";

function App() {
  const [note, setNote] = useState<NoteData | null>(null);
  const { updateNote, removeNote } = useNoteStore();

  useEffect(() => {
    const loadNote = async () => {
      try {
        const window = getCurrentWindow();
        const windowLabel = window.label;

        const notes = await invoke<NoteData[]>("fetch_all_notes");
        const currentNote = notes.find((n) => `note-${n.id}` === windowLabel);
        if (currentNote) {
          setNote(currentNote);
          useNoteStore.getState().addNote(currentNote);
        }
      } catch (error) {
        console.error("Failed to load note:", error);
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

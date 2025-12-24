import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNoteStore, NoteData } from "../stores/noteStore";

export function useNotes() {
  const { setNotes } = useNoteStore();

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const notes = await invoke<NoteData[]>("fetch_all_notes");
        setNotes(notes);
      } catch (error) {
        console.error("Failed to fetch notes:", error);
      }
    };

    fetchNotes();
  }, [setNotes]);
}

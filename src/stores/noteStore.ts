import { create } from "zustand";

export interface NoteData {
  id: string;
  title: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  textColor?: string;
  text_color?: string;
  pinned: boolean;
  has_checkboxes: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoteStore {
  notes: NoteData[];
  focusedNoteId: string | null;
  hoveredNoteId: string | null;
  controlPanelNoteId: string | null;

  // Actions
  setNotes: (notes: NoteData[]) => void;
  addNote: (note: NoteData) => void;
  updateNote: (id: string, updates: Partial<NoteData>) => void;
  removeNote: (id: string) => void;
  setFocusedNoteId: (id: string | null) => void;
  setHoveredNoteId: (id: string | null) => void;
  setControlPanelNoteId: (id: string | null) => void;
}

export const useNoteStore = create<NoteStore>((set) => ({
  notes: [],
  focusedNoteId: null,
  hoveredNoteId: null,
  controlPanelNoteId: null,

  setNotes: (notes) => set({ notes }),

  addNote: (note) =>
    set((state) => ({
      notes: [note, ...state.notes],
    })),

  updateNote: (id, updates) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, ...updates } : note
      ),
    })),

  removeNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
    })),

  setFocusedNoteId: (id) => set({ focusedNoteId: id }),

  setHoveredNoteId: (id) => set({ hoveredNoteId: id }),

  setControlPanelNoteId: (id) => set({ controlPanelNoteId: id }),
}));

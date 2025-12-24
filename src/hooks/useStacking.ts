import { useMemo } from "react";
import { NoteData } from "../stores/noteStore";

interface NoteStack {
  noteIds: string[];
  isStacked: boolean;
}

const OVERLAP_THRESHOLD = 0.25; // 25% overlap

function calculateOverlapPercentage(note1: NoteData, note2: NoteData): number {
  const x1 = note1.x;
  const y1 = note1.y;
  const x2 = x1 + note1.width;
  const y2 = y1 + note1.height;

  const x3 = note2.x;
  const y3 = note2.y;
  const x4 = x3 + note2.width;
  const y4 = y3 + note2.height;

  // Calculate intersection
  const xIntersect = Math.max(0, Math.min(x2, x4) - Math.max(x1, x3));
  const yIntersect = Math.max(0, Math.min(y2, y4) - Math.max(y1, y3));
  const intersectArea = xIntersect * yIntersect;

  // Calculate percentage of note1 that overlaps
  const note1Area = note1.width * note1.height;
  return intersectArea / note1Area;
}

export function useStacking(notes: NoteData[]): Map<string, NoteStack> {
  return useMemo(() => {
    const stacks = new Map<string, NoteStack>();
    const visited = new Set<string>();

    // Initialize each note as its own stack
    notes.forEach((note) => {
      stacks.set(note.id, {
        noteIds: [note.id],
        isStacked: false,
      });
    });

    // Find overlapping notes and group them into stacks
    for (let i = 0; i < notes.length; i++) {
      if (visited.has(notes[i].id)) continue;

      const stack: string[] = [notes[i].id];
      visited.add(notes[i].id);

      for (let j = i + 1; j < notes.length; j++) {
        if (visited.has(notes[j].id)) continue;

        const overlapPercent = calculateOverlapPercentage(notes[i], notes[j]);
        if (overlapPercent >= OVERLAP_THRESHOLD) {
          stack.push(notes[j].id);
          visited.add(notes[j].id);
        }
      }

      if (stack.length > 1) {
        stack.forEach((noteId) => {
          stacks.set(noteId, {
            noteIds: stack,
            isStacked: true,
          });
        });
      }
    }

    return stacks;
  }, [notes]);
}

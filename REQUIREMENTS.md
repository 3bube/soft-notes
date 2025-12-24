# SoftNotes: Product Requirements

**A minimalist, desktop-native sticky notes app.**

---

## Overview

SoftNotes is a calm, aesthetic, always-on-top sticky notes application for Windows and macOS. Users can create and manage sticky notes that live directly on their desktop, appearing and disappearing on demand without the friction of traditional app windows.

The app prioritizes **invisibility by default**: controls appear only when needed, and the user should never feel like they're "managing" an application.

### Non-Goals (Out of Scope)

- Todo app (no checkboxes, no task management)
- Notion clone (no databases, relations, or hierarchies)
- Dashboard-based application
- Rich text editor (plain text only)
- Collaboration or cloud sync (v1 is local-only)

---

## Core Features

### 1. Sticky Notes (Basic Unit)

Each note is an editable, draggable, resizable window on the desktop.

**Properties stored:**

- Content (plain text)
- Position (x, y)
- Size (width, height)
- Color (from pastel palette)
- Created timestamp
- Last modified timestamp
- Z-order (for stacking)

**Behavior:**

- Always appears on top of other windows
- Editable inline (text is cursor-focused by default when note is focused)
- Draggable by any non-text area
- Resizable from bottom-right corner
- Remembers state across app restart
- No required title (content can start with any text)

**Keyboard interaction (when note is focused):**

- Tab: blur focus
- Escape: blur focus
- Ctrl/Cmd+S: explicit save (optional, usually auto-save)
- Delete (or trash action): delete note

---

### 2. Controls (Hover-Based)

Controls are **invisible by default** and appear on hover.

**On Note Hover:**

- **Pin icon** (top-right corner)
  - Click to pin/unpin note
  - Pinned notes have subtle visual indicator (pin icon fills)
  - Unpinned notes can be hidden via "Hide all" command

- **More menu icon** (⋯, top-right corner, right of pin)
  - Click to open floating control panel

**Floating Control Panel (triggered by ⋯):**

- Position: above the note, center-aligned
- Shape: pill-shaped container
- Contents:
  - **Color swatches** (5-6 pastel colors arranged horizontally)
    - Click to change note color
    - Currently selected color is highlighted
  - **Trash icon** (right side of pill)
    - Click to delete note (confirm with dialog or immediate + undo)
- **Interaction:**
  - Disappears on outside click / ESC / action taken
  - No labels (icons only)
  - Smooth fade-in/out transition

---

### 3. Stacking

When notes overlap by **≥ 25% of their area**, they automatically group into a stack.

**Stack Behavior:**

- **Visual representation:**
  - Cards offset slightly (2-3px) from each other
  - Subtle shadow cascade to show depth
  - Most recent note on top

- **Large stacks (≥4 notes):**
  - Show "+N" badge on top card (e.g., "+2" for 5-note stack)
  - Badge displays remaining notes count

- **Interaction:**
  - Hover over stack: fan out briefly to show all cards
  - Click on a card in the fan: bring it to front
  - Click-and-hold: scrubbing mode (cycle through cards in stack)
  - Drag any card away from stack: dissolve stack, move only that card

- **Computation:**
  - Stacks computed in-memory from current positions
  - Never persisted to database
  - Recomputed on window move/resize

**Edge Case:**

- If a large stack exists and user clicks "show more" without selecting: show implicit titles (first line of each note, max 30 chars) in a temporary hover popup

---

### 4. Persistence

All note state is stored in a local SQLite database.

**Schema:**

```sql
-- notes table
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  color TEXT NOT NULL DEFAULT 'yellow',
  pinned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- app_settings table
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

**Write Behavior:**

- **Debounced writes** for typing (500ms debounce)
- **Immediate writes** for destructive actions (delete, color change, pin/unpin)
- **Position updates** debounced on drag (300ms)

**App Load:**

1. Read all notes from database
2. Restore positions, sizes, colors
3. Restore visibility state (hidden/shown)
4. Restore any open control panels (none by default)

---

### 5. Keyboard Shortcuts

**Global shortcuts** (work anytime, even if app is not focused):

| Shortcut             | Action                                                                           |
| -------------------- | -------------------------------------------------------------------------------- |
| Ctrl/Cmd + Shift + N | Create new note at default position (center of screen)                           |
| Ctrl/Cmd + Shift + H | Toggle hide/show all unpinned notes                                              |
| Ctrl/Cmd + Shift + L | Show temporary overview of all notes (see [Command Palette](#6-command-palette)) |
| Ctrl/Cmd + Shift + P | Open command palette                                                             |
| Ctrl/Cmd + ,         | Open settings (hidden by default)                                                |

**Note-focused shortcuts:**

- Escape: unfocus note
- Tab: move to next note (or blur if no more)
- Delete: delete note (with confirm)

---

### 6. Command Palette

**Floating, keyboard-first interface** for power users.

**Behavior:**

- Triggered by: Ctrl+Shift+P
- Floating window, center of screen
- Search input field
- Filtered list of commands
- Arrow keys to navigate, Enter to select
- ESC to close

**Initial Command Set:**

- New note
- Delete this note
- Change color
- Pin / Unpin
- Hide all notes
- Show all notes
- Settings
- Quit app

**Design:**

- Minimal, no permanent UI
- Disappears after command execution
- Dark background, light text (respects OS theme)
- No descriptions initially (KISS)

---

### 7. Temporary Overview (Ctrl+Shift+L)

Shows a temporary grid or list of all notes **without opening a manager window**.

**Behavior:**

- Floating overlay (modal-like, but not blocking)
- Displays thumbnails or lines of each note
- Shows implicit title (first line, max 30 chars) + color indicator
- Click on a note to bring it to front and close overview
- ESC to close overview
- Disappears automatically after 10 seconds of inactivity (optional)

**Purpose:** Quick glance at what notes exist without a persistent dashboard.

---

### 8. System Tray / Menu Bar

Provides one-click access to core commands.

**Menu Items:**

- New Note
- Show / Hide All Notes
- Start on Boot (checkbox, toggles via settings)
- Settings
- Quit SoftNotes

**Icon:**

- Minimal, calm aesthetic
- Slightly different when notes are hidden (e.g., grayed out)

---

### 9. Hidden Settings

Triggered by: **Ctrl+Shift+,**

**Available Settings:**

- Theme: Auto / Dark / Light
- Start on boot: On / Off
- Note default size: Small / Medium / Large
- Default color: (dropdown, pastel palette)
- Debounce timing (advanced): default values visible but tweakable

**UI:**

- Floating dialog, minimal layout
- No tabs or complex structure
- Dismissible by clicking outside or hitting ESC
- Settings saved immediately

---

### 10. Notes Lifecycle

**Creation:**

- Ctrl+Shift+N creates note at center of screen or default position
- Automatically focused for text input
- Default color from settings (or system default: soft yellow)

**Editing:**

- Click note → focus
- Type/delete content
- Content saved on blur with debounce

**Moving & Resizing:**

- Click and drag note title bar to move
- Click and drag bottom-right corner to resize
- Min size: 150x80px
- Max size: 600x400px (or full screen)

**Deletion:**

- Click trash in control panel → confirm dialog or immediate + undo
- Or press Delete key when note is focused

**Hiding:**

- Unpinned notes hidden via Ctrl+Shift+H (toggle)
- Pinned notes always visible
- Hidden state stored in `app_settings` table

---

## File Structure Reference

```
src-tauri/
  src/
    main.rs          → Window setup, tray menu
    lib.rs           → Tauri commands (CRUD, settings)
  tauri.conf.json    → App config, tray icon

src/
  components/
    Note.tsx         → Single note component
    NoteStack.tsx    → Stack detection & rendering
    ControlPanel.tsx → Floating control (color + trash)
    CommandPalette.tsx
    Overview.tsx
    SettingsDialog.tsx
  stores/
    noteStore.ts     → Zustand store (notes + ui state)
  hooks/
    useNotes.ts      → Fetch/sync with Tauri
    useStacking.ts   → Stack computation
  App.tsx            → Main layout
  main.tsx           → Entry point
```

---

## Implementation Roadmap (Suggested)

### Phase 1: MVP

- [ ] Note CRUD (create, read, update, delete)
- [ ] Basic persistence (SQLite)
- [ ] Dragging & resizing
- [ ] Hover controls (pin + menu)
- [ ] Basic color change
- [ ] System tray (minimal)

### Phase 2: Interactions

- [ ] Stacking detection & visual feedback
- [ ] Keyboard shortcuts (Ctrl+Shift+N, etc.)
- [ ] Hide/show toggle
- [ ] Better control panel UX

### Phase 3: Polish & Extras

- [ ] Command palette
- [ ] Temporary overview
- [ ] Hidden settings
- [ ] Start on boot
- [ ] Dark mode & theme system

### Phase 4: v1.1 & Beyond

- Advanced search
- Note categories or tags
- Export options
- Collaboration ready (architecture, not implementation)

---

## Design Language

### Colors

- **Background:** Off-white (light) / Deep charcoal (dark)
- **Note palette:** Soft pastels (yellow, blue, pink, green, lavender, peach)
- **UI controls:** Subtle grays, light highlights
- **Text:** High contrast, readable (dark on light, light on dark)

### Typography

- Font: System default (SF Pro Display on macOS, Segoe UI on Windows)
- Body: 13-14px
- Titles/headings: 16-18px

### Spacing

- Minimal, breathing room
- Shadows: subtle, avoid harsh blacks
- Transitions: smooth 200-300ms

---

## Success Criteria

✅ User can create/edit/delete notes in <2 seconds
✅ App restarts with all notes in correct positions
✅ No visible settings or menus on launch
✅ Keyboard shortcuts are instant and discoverable
✅ Stacking feels automatic, not confusing
✅ App uses <50MB memory at rest
✅ Zero jank on drag/resize

---

**Document Version:** 1.0  
**Last Updated:** December 24, 2025

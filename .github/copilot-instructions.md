# SoftNotes: Copilot Instructions for Code Generation

**SoftNotes** is a minimalist, desktop-native sticky notes app built with Tauri + React + TypeScript.

> **Core Philosophy**: Notes live on the desktop. The UI is invisible by default; controls appear only when needed. Never feel like you're "managing" an app.

---

## Architecture Overview

### Three-Layer System

```
┌─────────────────────────────────────┐
│  React Frontend (src/)              │  ← UI components, React hooks, Zustand state
├─────────────────────────────────────┤
│  Tauri IPC Layer                    │  ← Thin command bridge (invoke/listen)
├─────────────────────────────────────┤
│  Rust Backend (src-tauri/src/)      │  ← Window mgmt, SQLite, system tray
└─────────────────────────────────────┘
```

**Why this structure:**

- React handles UI/interaction (what users see)
- Rust handles system integration (windows, DB, OS integration)
- Thin IPC boundary = minimal serialization overhead, clear responsibilities

### Frontend State Management (Zustand)

Store lives in `src/stores/noteStore.ts` (to be created):

```typescript
create((set) => ({
  notes: [],
  ui: { hiddenNotes: false, focusedNoteId: null },
  actions: {
    setNotes: (notes) => set({ notes }),
    focusNote: (id) => set((s) => ({ ui: { ...s.ui, focusedNoteId: id } })),
  },
}));
```

**Rules:**

- Store is for **UI state only** (which note is focused, overlay visibility)
- Note CRUD happens via Tauri commands → fetch → update store
- No complex reducers or action payloads
- Use `set()` directly with shallow merges

### Tauri Commands (IPC Bridge)

Commands in `src-tauri/src/lib.rs`:

```rust
#[tauri::command]
fn create_note(content: String, color: String) -> Note {
  // Minimal logic: validate input, insert into DB, return new note
}

#[tauri::command]
fn update_note(id: String, content: String) -> Result<(), String> {
  // Direct DB update, return status
}
```

**Rules:**

- One function = one action (don't bundle)
- Keep signatures simple (strings, numbers, simple structs)
- Return `Result<T, String>` for errors (easier serialization than custom Error types)
- All DB I/O happens here, not in React

### Database Schema (SQLite)

Located in `src-tauri/src/init.rs` (to be created):

```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  x INTEGER, y INTEGER,          -- Position
  width INTEGER, height INTEGER, -- Size
  color TEXT DEFAULT 'yellow',   -- Pastel palette color
  pinned INTEGER DEFAULT 0,      -- Pin state
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

**Access pattern:**

- Tauri commands query/update → return data → React fetches on app init
- Debounce writes for performance (500ms for edits, immediate for deletes)

---

## Key Files & Their Responsibilities

| File                              | Purpose                                             | Scope                            |
| --------------------------------- | --------------------------------------------------- | -------------------------------- |
| `src/App.tsx`                     | Root layout, note rendering loop                    | Mount all `<Note />` components  |
| `src/components/Note.tsx`         | Single note UI (text, drag, resize, hover controls) | Isolated note behavior           |
| `src/components/ControlPanel.tsx` | Color picker + trash (floating pill above note)     | Appears on menu icon click       |
| `src/stores/noteStore.ts`         | Zustand store (notes array, UI state)               | Single source of truth           |
| `src/hooks/useNotes.ts`           | Fetch/sync with Tauri, dispatch to store            | Handles async init               |
| `src-tauri/src/lib.rs`            | All Tauri commands + tray setup                     | IPC + system integration         |
| `src-tauri/src/init.rs`           | SQLite schema + DB initialization                   | Called on app startup            |
| `vite.config.ts`                  | Dev server config (port 1420, ignore src-tauri/)    | Build configuration              |
| `src-tauri/tauri.conf.json`       | App config (window size, tray, bundle settings)     | Window decorations, app identity |

---

## Development Workflow

### Running the App

```bash
# Terminal 1: Start Vite dev server (auto-reloads React)
bun run dev          # or: npm run dev

# Terminal 2: Start Tauri dev mode (watches Rust + frontend)
bun run tauri dev    # or: npm run tauri -- dev
```

**Why two terminals:**

- Vite rebuilds React on file change → hot module reload (HMR)
- Tauri watches for Rust changes → rebuilds backend
- Together = full-stack dev experience

### Building for Production

```bash
bun run build        # Compiles TypeScript + Vite, then Tauri builds the bundle
```

Tauri runs this via `beforeBuildCommand` in `tauri.conf.json`.

### Debugging

- **React**: DevTools in Tauri window (Ctrl+Shift+I in dev mode)
- **Rust**: Add `println!` or use `dbg!()` macro in commands, check console
- **SQLite**: Commands return `Result<T, String>` → check error messages in React

---

## Code Patterns & Conventions

### Component Structure (React)

Keep components small, functional, hooks-based:

```tsx
// src/components/Note.tsx
interface NoteProps {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  focused: boolean;
  onFocus: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export function Note({ id, content, focused, onFocus, ...props }: NoteProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      className={`note note--${props.color} ${focused ? "note--focused" : ""}`}
      onMouseDown={() => onFocus(id)}
      onMouseEnter={() => setHovering(true)}
    >
      {/* Controls appear only on hover */}
      {hovering && <HoverControls onDelete={() => onDelete(id)} />}
    </div>
  );
}
```

**Rules:**

- Props are immutable input contracts
- State is for **transient UI** (hover, drag, temp. UI visibility)
- Callbacks handle side effects (update store, call Tauri)
- No business logic in components

### Tauri Command Pattern

```rust
// src-tauri/src/lib.rs

#[tauri::command]
fn fetch_all_notes() -> Vec<Note> {
    // Open connection, query, return
}

#[tauri::command]
async fn delete_note(id: String) -> Result<(), String> {
    // Validate, delete from DB, close connection
    // Return Err("...") if failure
}
```

**Rules:**

- Commands are async-ready (use `async` if DB access needed)
- Validate input at boundary
- Return simple types: `T`, `Vec<T>`, `Result<T, String>`
- No middleware or complex patterns

### Naming Conventions

- **React**: PascalCase for components, camelCase for hooks/utils
- **Rust**: snake_case for functions, commands are lowercase_with_underscores
- **CSS/Classes**: BEM-style: `.note`, `.note--focused`, `.note__content`
- **Store**: `noteStore` file, `useNoteStore()` hook to access

### Error Handling

**React → Tauri:**

```typescript
const result = await invoke<Note>("create_note", {
  content,
  color,
});
// If command fails, invoke throws automatically
// Wrap in try/catch for user-facing errors
```

**Tauri → React:**

```typescript
try {
  await deleteNote(id);
  store.removeNote(id);
  // Success
} catch (err) {
  console.error("Failed to delete:", err);
  // Show user feedback (toast, error banner)
}
```

---

## Feature Boundaries (What Goes Where)

### React Only (UI Layer)

- Rendering notes, controls
- Hover/focus states
- Drag/resize interactions
- Floating overlays (command palette, control panel)
- Local animation/transition states

### Tauri Commands (Business Logic)

- Create/update/delete notes
- Fetch all notes on app init
- Save settings
- Window management (always-on-top)

### Rust Only (System Layer)

- SQLite connection pool
- System tray menu
- Window event listeners
- File I/O for settings
- OS integration (dark mode detection, etc.)

**Example: User updates note content**

1. User types in `<Note />` component (React handles keystroke)
2. Component calls `onUpdate(id, newContent)` callback
3. Callback invokes `update_note(id, newContent)` Tauri command
4. Command updates SQLite
5. React refetches and updates store (or Tauri emits event to React)

---

## Incremental Development Roadmap

### Phase 1: MVP (Foundation)

- [x] Tauri + React scaffold
- [ ] Basic note CRUD (create, read, update, delete)
- [ ] Simple SQLite schema + init
- [ ] Note component with text input
- [ ] Drag & resize (basic)
- [ ] System tray with "New Note" button

**Key milestone**: App persists notes across restarts

### Phase 2: Interactions

- [ ] Hover controls (pin, menu icons)
- [ ] Color picker in floating panel
- [ ] Delete confirmation
- [ ] Keyboard shortcuts (Ctrl+Shift+N, etc.)
- [ ] Hide/show toggle

**Key milestone**: Full CRUD with intuitive controls

### Phase 3: Polish & Advanced

- [ ] Stacking detection & rendering
- [ ] Command palette
- [ ] Temporary overview
- [ ] Settings dialog
- [ ] Start on boot
- [ ] Dark mode / theme support

**Key milestone**: Feature-complete v1.0

### Defer to v1.1+

- Search/filter
- Export formats
- Custom themes
- Note linking
- Analytics

---

## Critical Edge Cases & Gotchas

### Stacking Logic

- Compute in-memory, never store in DB
- Overlap threshold: ≥25% of note area
- When notes move, recompute stacks every frame (debounce?)
- Large stacks (≥4): show "+N" indicator
- **Gotcha**: Don't store z-order in DB; derive from creation time + interaction

### Window Management

- Always-on-top window can conflict with other apps
- On Windows: test with Explorer, VS Code open
- Remember state on crash (read from DB on init)
- **Gotcha**: Tauri doesn't auto-save window state; must handle manually

### Debouncing & Persistence

- **Typing**: Debounce 500ms before writing to DB
- **Position/size**: Debounce 300ms on drag/resize
- **Destructive actions**: Write immediately (delete, color change)
- **Gotcha**: Don't let debounce cause lost data on app close; flush pending writes on shutdown

### Performance

- Keep Zustand store flat (avoid deep nesting)
- Don't render all notes if user has 100+ notes (consider windowing)
- SQLite queries should be indexed on `id`, `created_at`
- **Gotcha**: Each note on desktop = 1 OS window; 50+ notes = lag

---

## Testing & Quality

### What to Test

- Tauri commands return correct data types
- SQLite schema migration on first run
- React components render without errors
- Drag/resize doesn't corrupt note state
- Delete + refresh shows note is gone

### What NOT to Test (Yet)

- Stacking edge cases (defer to Phase 3)
- Advanced accessibility features
- Performance with 1000+ notes

**Approach**: Write minimal tests for business logic (Tauri commands), manual testing for UI interactions.

---

## Common Tasks

### Adding a New Note Property

1. Add field to SQLite schema (`ALTER TABLE notes ADD COLUMN ...`)
2. Update Tauri `Note` struct
3. Update Tauri commands that return notes
4. Update React `<Note />` component props
5. Update Zustand store if needed
6. Add UI control in `<ControlPanel />` or note itself

### Adding a Keyboard Shortcut

1. Add listener in `src-tauri/src/lib.rs` or React component
2. Call appropriate Tauri command
3. Document in `.copilot-instructions`

### Debugging "Note Won't Save"

1. Check Tauri console for command errors
2. Verify SQLite table exists with `sqlite3` CLI
3. Check debounce timing (is write happening?)
4. Look for `Result<(), String>` errors in command

---

## Links & References

- [Tauri Docs](https://tauri.app) – Windows, commands, plugins
- [React 19 Docs](https://react.dev) – Latest React features
- [Zustand Docs](https://github.com/pmndrs/zustand) – Lightweight state
- [SQLite Docs](https://www.sqlite.org) – Query reference
- Product Vision: See `REQUIREMENTS.md`
- Philosophy: See `.copilot-instructions` (product-level guidance)

---

**Document Version**: 1.0  
**Last Updated**: December 24, 2025  
**Maintained by**: Development Team

# D3: World of Bits

## Game Design Vision

Collect digital "bits" around the globe and fuse equal-value tokens together to craft higher and higher values. Move around a map (and later the real world) to reach new cells and find enough materials to craft a huge token.

## Technologies

- TypeScript for game logic
- Leaflet for interactive map rendering
- Vite + Deno build system from starter template
- GitHub Actions + GitHub Pages for automatic deployment

## Assignments

### D3.a: Core mechanics (token collection and crafting)

Key technical challenge: map-based UI using Leaflet.
Key gameplay challenge: collect nearby tokens and craft a high-value token.

#### Steps

- [x] Read and understand starter code (Leaflet + luck hashing).
- [x] Copy `src/main.ts` to `src/reference-main.ts` for reference.
- [x] Delete contents of `src/main.ts` and start fresh.
- [x] Initialize Leaflet map centered on classroom coordinates.
- [x] Draw one grid cell polygon on the map.
- [x] Generalize to draw a full grid of cells around the player.
- [x] Implement deterministic token spawning using `luck` for each cell.
- [x] Visualize cell contents (empty vs token + numeric value).
- [x] Track player inventory (0 or 1 token) in game state.
- [x] Implement “pick up token” when clicking a nearby cell with a token.
- [x] Restrict interaction to cells within 3 grid steps of player.
- [x] Implement crafting: placing token on equal-value token → double value.
- [x] Detect win condition when held token >= target value and show win message.
- [x] Cleanup pass: remove dead code, console logs, and do a cleanup-only commit.

### **D3.b.1 — Player State + Marker**

- [x] Add player grid coordinate state (`player.i`, `player.j`)
- [x] Convert grid → lat/lng helper
- [x] Add Leaflet marker for player
- [x] Marker appears at correct world location

### **D3.b.2 — Movement UI**

- [x] Add movement buttons (N, S, E, W)
- [x] Each button updates player's grid coordinates
- [x] Smoothly update marker position
- [x] Recalculate which cells are interactable

### **D3.b.3 — Interaction Uses _Real_ Player Location**

- [x] Restrict pickup/crafting based on **player grid**, not classroom
- [x] All interactions update correctly as player moves

### **D3.b.4 — Auto-scroll Camera**

- [x] Map recenters whenever player moves
- [x] Smooth camera movement

### **D3.b.5 — Cleanup Commit**

- [x] Remove debug logs
- [x] Final review of D3.b

### **D3.c.1 — Flyweight Cell Storage**

- [ ] Introduce `modifiedCells` map for persistent modified cell memory
- [ ] Introduce `ephemeralCells` map for visible-on-screen cell objects
- [ ] Remove permanent storage of unmodified cell data
- [ ] Ensure only modified cells remain in memory after scrolling

### **D3.c.2 — Memento Restore System**

- [ ] Save modified cell state into `modifiedCells` whenever player alters a cell
- [ ] Restore cell state from `modifiedCells` when the cell re-enters view
- [ ] If no modified state exists, generate token using deterministic `luck()`
- [ ] Verify restored cells behave exactly the same before/after leaving visibility

### **D3.c.3 — RenderGrid Rewrite**

- [ ] Clear `ephemeralCells` every time `renderGrid` runs
- [ ] Rebuild all visible cells fresh from:
  - `modifiedCells` (persistent state)
  - **OR** `luck()` (unmodified state)
- [ ] Ensure grid spans entire map while keeping memory small
- [ ] Keep interaction logic consistent with new flyweight model

### **D3.c.1 — Flyweight Cell Storage**

- [x] Introduce `modifiedCells` map for persistent modified cell memory
- [x] Introduce `ephemeralCells` map for visible-on-screen cell objects
- [x] Remove permanent storage of unmodified cell data
- [x] Ensure only modified cells remain in memory after scrolling

### **D3.c.2 — Memento Restore System**

- [x] Save modified cell state into `modifiedCells` whenever player alters a cell
- [x] Restore cell state from `modifiedCells` when the cell re-enters view
- [x] If no modified state exists, generate token using deterministic `luck()`
- [x] Verify restored cells behave exactly the same before/after leaving visibility

### **D3.c.3 — RenderGrid Rewrite**

- [x] Clear `ephemeralCells` every time `renderGrid` runs
- [x] Rebuild all visible cells fresh from:
  - `modifiedCells` (persistent state)
  - **OR** `luck()` (unmodified state)
- [x] Ensure grid spans entire map while keeping memory small
- [x] Keep interaction logic consistent with new flyweight model

### **D3.c.4 — Gameplay Behavior Verification**

- [x] Player can “farm” tokens by moving away and back
- [x] Modified cells do **not** reset when hidden (persistence)
- [x] Unmodified cells **do** reset (flyweight stateless behavior)
- [x] All crafting and pickup rules still function correctly

### **D3.c.5 — Cleanup Commit**

- [ ] Remove debugging logs
- [ ] Refactor duplicated logic
- [ ] Final D3.c review
- Commit message: **"D3.c complete"**

### **D3.c.5 — Cleanup Commit**

- [ ] Remove debugging logs
- [ ] Refactor duplicated logic
- [ ] Final D3.c review
- Commit message: **"D3.c complete"**

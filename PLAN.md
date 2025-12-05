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

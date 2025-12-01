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
- [ ] Cleanup pass: remove dead code, console logs, and do a cleanup-only commit.

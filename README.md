### World of Bits

A real-world, map-based crafting game where you move around the Earth, collect digital “bits,” and combine them to make higher-value tokens. Move in real life → your character moves in the game.

How the Game Works
1. The World

The world is split into a giant grid.

Each cell might contain a token (value 1).

You can see tokens anywhere on the map by scrolling.

2. Movement

You can control your player in two ways:

Geolocation mode: move in real life and your character moves.

Buttons mode: tap N / S / E / W to move one cell at a time.

You can switch modes anytime with the on-screen button.

3. Collecting

If you stand within 3 cells of a token, you can click it.

If your hand is empty, you pick it up.

4. Crafting

If you place a token onto another token with the same value, they combine:

value + value → doubled value

Example:
1 + 1 → 2
2 + 2 → 4
4 + 4 → 8 ... etc

5. Goal

Craft a high-value token (your game is set to 16).
When you reach it, you win.

Saving Your Progress

The game automatically saves everything to your browser.

Closing the page does not reset your progress.

When you reopen the game, your world loads exactly as you left it.

Start Fresh

Use the New Game button to wipe your save and restart.

Technologies Used

TypeScript for game logic

Leaflet for the interactive map

Deno + Vite for building

luck() hashing for deterministic token spawning

localStorage for game persistence

Flyweight + Memento patterns for memory-efficient cell storage

Project Structure (Simple View)
src/
 ├─ main.ts       ← full game logic
 ├─ style.css     ← simple UI styling
 ├─ _luck.ts      ← deterministic hashing
 └─ _leafletWorkaround.ts

Development Notes

Grid cells are rebuilt every frame (flyweight pattern).

Only modified cells are saved (memento pattern).

Movement logic is abstracted behind a simple system so switching between button mode and geolocation mode is easy.

Playing the Game

Your deployed GitHub Pages link goes here:
https://bayobands.github.io/D3/

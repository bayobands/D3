// Fix Leaflet CSS, icons, paths BEFORE Leaflet loads
import "leaflet/dist/leaflet.css";
import "./_leafletWorkaround.ts";
import "./style.css";

// Leaflet runtime + types
// @deno-types="npm:@types/leaflet"
import L from "leaflet";

// Deterministic hashing
import luck from "./_luck.ts";

/* -------------------------------------------------------------
   CONSTANTS + HELPERS
--------------------------------------------------------------*/

const CELL_SIZE = 0.0001;

// Create a unique string for each cell
function cellKey(i: number, j: number): string {
  return `${i},${j}`;
}

function latLngToCell(lat: number, lng: number) {
  return {
    i: Math.floor(lat / CELL_SIZE),
    j: Math.floor(lng / CELL_SIZE),
  };
}

function boundsForCell(i: number, j: number): L.LatLngBoundsLiteral {
  return [
    [i * CELL_SIZE, j * CELL_SIZE],
    [(i + 1) * CELL_SIZE, (j + 1) * CELL_SIZE],
  ];
}

function cellDistance(i1: number, j1: number, i2: number, j2: number) {
  return Math.abs(i1 - i2) + Math.abs(j1 - j2);
}

// Initial deterministic token
function tokenFromLuck(i: number, j: number): number | null {
  return luck(`${i},${j}`) < 0.2 ? 1 : null;
}

/* -------------------------------------------------------------
   PLAYER STATE
--------------------------------------------------------------*/

const CLASS_LAT = 36.99790233940329;
const CLASS_LNG = -122.05700844526292;

const startCell = latLngToCell(CLASS_LAT, CLASS_LNG);

const player = {
  i: startCell.i,
  j: startCell.j,
};

function playerLatLng(): [number, number] {
  return [
    player.i * CELL_SIZE + CELL_SIZE / 2,
    player.j * CELL_SIZE + CELL_SIZE / 2,
  ];
}

/* -------------------------------------------------------------
   MAP SETUP
--------------------------------------------------------------*/

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.appendChild(mapDiv);

const map = L.map("map", { zoomControl: true }).setView(playerLatLng(), 18);

// Player marker
const playerMarker = L.marker(playerLatLng(), { title: "You" });
playerMarker.addTo(map);

// Base map tiles
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

/* -------------------------------------------------------------
   INVENTORY UI + WIN MESSAGE
--------------------------------------------------------------*/

const inventoryDiv = document.createElement("div");
inventoryDiv.style.position = "absolute";
inventoryDiv.style.top = "10px";
inventoryDiv.style.left = "10px";
inventoryDiv.style.padding = "8px";
inventoryDiv.style.background = "rgba(0,0,0,0.45)";
inventoryDiv.style.color = "white";
inventoryDiv.style.fontSize = "18px";
inventoryDiv.style.zIndex = "999";
document.body.appendChild(inventoryDiv);

let heldToken: number | null = null;

function updateInventoryUI() {
  inventoryDiv.innerText = heldToken === null
    ? "Token: none"
    : `Token: ${heldToken}`;
}

/* -------------------------------------------------------------
   MOVEMENT UI
--------------------------------------------------------------*/

const controls = document.createElement("div");
controls.style.position = "absolute";
controls.style.bottom = "20px";
controls.style.left = "50%";
controls.style.transform = "translateX(-50%)";
controls.style.display = "grid";
controls.style.gridTemplateColumns = "repeat(3, 60px)";
controls.style.gap = "6px";
controls.style.zIndex = "999";

controls.innerHTML = `
  <button id="moveN">N</button>
  <div></div>
  <button id="moveS">S</button>
  <button id="moveW">W</button>
  <button id="moveE">E</button>
`;

document.body.appendChild(controls);

function movePlayer(di: number, dj: number) {
  player.i += di;
  player.j += dj;

  const pos = playerLatLng();
  playerMarker.setLatLng(pos);
  map.panTo(pos);

  renderGrid();
}

document.getElementById("moveN")!.onclick = () => movePlayer(-1, 0);
document.getElementById("moveS")!.onclick = () => movePlayer(1, 0);
document.getElementById("moveW")!.onclick = () => movePlayer(0, -1);
document.getElementById("moveE")!.onclick = () => movePlayer(0, 1);

/* -------------------------------------------------------------
   D3.c — FLYWEIGHT + MEMENTO + RESTORE
--------------------------------------------------------------*/

// Only modified cells persist when they go off-screen
const modifiedCells = new Map<string, number | null>();

// Only visible cells for rendering (Flyweight)
const ephemeralCells = new Map<string, L.Rectangle>();

// For testing in browser console
// @ts-ignore FOr when I upload the final thing don't watn debug
globalThis.modifiedCells = modifiedCells;
// @ts-ignore FOr when I upload the final thing don't watn debug
globalThis.ephemeralCells = ephemeralCells;

// Layer for cell rectangles
const gridLayer = L.layerGroup().addTo(map);

// Get correct value for cell
function getCellTokenValue(i: number, j: number): number | null {
  const key = cellKey(i, j);

  // 1. Modified? → Use saved state
  if (modifiedCells.has(key)) {
    return modifiedCells.get(key)!;
  }

  // 2. Never modified? → Deterministic luck
  return tokenFromLuck(i, j);
}

// Write modified value (Memento)
function setCellTokenValue(i: number, j: number, value: number | null) {
  const key = cellKey(i, j);
  modifiedCells.set(key, value);
}

function isInteractableCell(i: number, j: number) {
  return cellDistance(i, j, player.i, player.j) <= 3;
}

/* -------------------------------------------------------------
   RENDER GRID (FULL C3 + C4 IMPLEMENTATION)
--------------------------------------------------------------*/

function renderGrid() {
  gridLayer.clearLayers();
  ephemeralCells.clear();

  const bounds = map.getBounds();
  const sw = latLngToCell(bounds.getSouth(), bounds.getWest());
  const ne = latLngToCell(bounds.getNorth(), bounds.getEast());

  for (let i = sw.i - 1; i <= ne.i + 1; i++) {
    for (let j = ne.j + 1; j >= sw.j - 1; j--) {
      const key = cellKey(i, j);

      const tokenValue = getCellTokenValue(i, j);

      const rect = L.rectangle(boundsForCell(i, j), {
        color: tokenValue !== null ? "#2b8a3e" : "#666",
        weight: 0.4,
        fillOpacity: tokenValue !== null ? 0.25 : 0.08,
      });

      if (tokenValue !== null) {
        rect.bindTooltip(`${tokenValue}`, {
          permanent: true,
          direction: "center",
        });
      }

      rect.on("click", () => {
        if (!isInteractableCell(i, j)) return;

        const current = getCellTokenValue(i, j);

        // PICKUP
        if (heldToken === null) {
          if (current == null) return;

          heldToken = current;
          setCellTokenValue(i, j, null);
          updateInventoryUI();
          renderGrid();
          return;
        }

        // CRAFT
        if (current === heldToken) {
          const newVal = heldToken * 2;
          setCellTokenValue(i, j, newVal);
          heldToken = null;
          updateInventoryUI();
          renderGrid();
          return;
        }
      });

      rect.addTo(gridLayer);
      ephemeralCells.set(key, rect);
    }
  }
}

map.on("moveend", renderGrid);
map.on("zoomend", renderGrid);
map.on("dragend", renderGrid);

renderGrid();
updateInventoryUI();

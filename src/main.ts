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

// Deterministic initial token spawns
function tokenFromLuck(i: number, j: number): number | null {
  const v = luck(`${i},${j}`);
  return v < 0.2 ? 1 : null; // 20% chance of a token
}

/* -------------------------------------------------------------
   PLAYER STATE (from D3.b)
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

const map = L.map("map", {
  zoomControl: true,
  zoomSnap: 0,
}).setView(playerLatLng(), 18);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

// Player marker
const playerMarker = L.marker(playerLatLng(), { title: "You" });
playerMarker.addTo(map);

/* -------------------------------------------------------------
   INVENTORY + WIN MESSAGE
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

const winDiv = document.createElement("div");
winDiv.style.position = "absolute";
winDiv.style.top = "50%";
winDiv.style.left = "50%";
winDiv.style.transform = "translate(-50%, -50%)";
winDiv.style.fontSize = "32px";
winDiv.style.color = "yellow";
winDiv.style.background = "rgba(0,0,0,0.7)";
winDiv.style.padding = "20px";
winDiv.style.borderRadius = "10px";
winDiv.style.zIndex = "2000";
winDiv.style.display = "none";
winDiv.innerText = "You win!";
document.body.appendChild(winDiv);

let heldToken: number | null = null;
const WIN_VALUE = 16;

function updateInventoryUI() {
  inventoryDiv.innerText = heldToken === null
    ? "Held Token: none"
    : `Held Token: ${heldToken}`;

  if (heldToken !== null && heldToken >= WIN_VALUE) {
    winDiv.style.display = "block";
  }
}

/* -------------------------------------------------------------
   MOVEMENT UI (D3.b)
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
   D3.c.1 + D3.c.2 — FLYWEIGHT + MEMENTO
--------------------------------------------------------------*/

// Persistent modified cells (Memento)
const modifiedCells = new Map<string, number | null>();

// On-screen rectangles (Flyweight)
const ephemeralCells = new Map<string, L.Rectangle>();

// Group for all grid rectangles
const gridLayer = L.layerGroup().addTo(map);

// Get current value of a cell:
// - If modified → use stored value
// - Else → deterministic luck()
function getCellTokenValue(i: number, j: number): number | null {
  const key = cellKey(i, j);
  if (modifiedCells.has(key)) {
    return modifiedCells.get(key)!;
  }
  return tokenFromLuck(i, j);
}

function setCellTokenValue(i: number, j: number, value: number | null) {
  const key = cellKey(i, j);
  modifiedCells.set(key, value);
}

function isInteractableCell(i: number, j: number) {
  return cellDistance(i, j, player.i, player.j) <= 3;
}

/* -------------------------------------------------------------
   RENDERING + INTERACTION
--------------------------------------------------------------*/

function renderGrid() {
  // Clear all on-screen cells (flyweight behavior)
  gridLayer.clearLayers();
  ephemeralCells.clear();

  const bounds = map.getBounds();
  const sw = latLngToCell(bounds.getSouth(), bounds.getWest());
  const ne = latLngToCell(bounds.getNorth(), bounds.getEast());

  for (let i = sw.i - 1; i <= ne.i + 1; i++) {
    for (let j = sw.j - 1; j <= ne.j + 1; j++) {
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
          className: "cell-label",
        });
      }

      rect.on("click", () => {
        if (!isInteractableCell(i, j)) return;

        const currentVal = getCellTokenValue(i, j);

        // PICKUP
        if (heldToken === null) {
          if (currentVal == null) return;

          heldToken = currentVal;
          updateInventoryUI();

          // Cell becomes empty; persist that
          setCellTokenValue(i, j, null);
          renderGrid();
          return;
        }

        // CRAFTING
        if (currentVal === heldToken) {
          const newVal = heldToken * 2;
          setCellTokenValue(i, j, newVal);

          heldToken = null;
          updateInventoryUI();
          renderGrid();
          return;
        }

        // Mismatch: do nothing (no craft)
      });

      rect.addTo(gridLayer);
      ephemeralCells.set(key, rect);
    }
  }
}

map.on("moveend", renderGrid);
renderGrid();
updateInventoryUI();

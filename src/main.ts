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

const CELL_SIZE = 0.0001; // approx house-size cell
const PICKUP_STEPS = 3;

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

function cellDistance(a: number, b: number, c: number, d: number) {
  return Math.abs(a - c) + Math.abs(b - d);
}

function tokenFromLuck(i: number, j: number): number | null {
  return luck(`${i},${j}`) < 0.2 ? 1 : null;
}

/* -------------------------------------------------------------
   SAVE + LOAD SYSTEM
--------------------------------------------------------------*/

const modifiedCells = new Map<string, number | null>();

function serializeModifiedCells(): string {
  return JSON.stringify(Array.from(modifiedCells.entries()));
}

function loadGame() {
  const saved = localStorage.getItem("worldOfBits_save");
  if (!saved) return;

  try {
    const arr = JSON.parse(saved) as [string, number | null][];
    modifiedCells.clear();
    for (const [key, value] of arr) {
      modifiedCells.set(key, value);
    }
  } catch {
    console.error("Error loading save");
  }
}

function saveGameState() {
  localStorage.setItem("worldOfBits_save", serializeModifiedCells());
}

loadGame();

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

const map = L.map("map").setView(playerLatLng(), 18);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

const playerMarker = L.marker(playerLatLng()).addTo(map);

/* -----------------------------
   PICKUP RANGE CIRCLE (NEW)
------------------------------*/

const PICKUP_RADIUS_METERS = CELL_SIZE * PICKUP_STEPS * 111320;

const rangeCircle = L.circle(playerLatLng(), {
  radius: PICKUP_RADIUS_METERS,
  color: "#00aaff",
  fillColor: "#00aaff",
  fillOpacity: 0.12,
  weight: 1,
});
rangeCircle.addTo(map);

/* -------------------------------------------------------------
   INVENTORY UI
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
   NEW GAME BUTTON
--------------------------------------------------------------*/

const newGameBtn = document.createElement("button");
newGameBtn.innerText = "New Game";
newGameBtn.style.position = "absolute";
newGameBtn.style.top = "10px";
newGameBtn.style.right = "10px";
newGameBtn.style.zIndex = "999";
document.body.appendChild(newGameBtn);

newGameBtn.onclick = () => {
  modifiedCells.clear();
  heldToken = null;
  saveGameState();
  updateInventoryUI();
  renderGrid();
};

/* -------------------------------------------------------------
   MOVEMENT BUTTONS (BUTTON MODE)
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
  rangeCircle.setLatLng(pos);

  renderGrid();
}

document.getElementById("moveN")!.onclick = () => movePlayer(-1, 0);
document.getElementById("moveS")!.onclick = () => movePlayer(1, 0);
document.getElementById("moveW")!.onclick = () => movePlayer(0, -1);
document.getElementById("moveE")!.onclick = () => movePlayer(0, 1);

/* -------------------------------------------------------------
   GEOLOCATION MODE (OPTIONAL)
--------------------------------------------------------------*/

// URL example: index.html?movement=geo
const useGeo = new URLSearchParams(location.search).get("movement") === "geo";

if (useGeo && navigator.geolocation) {
  navigator.geolocation.watchPosition((pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    const cell = latLngToCell(lat, lng);
    player.i = cell.i;
    player.j = cell.j;

    const p = playerLatLng();
    playerMarker.setLatLng(p);
    map.panTo(p);
    rangeCircle.setLatLng(p);

    renderGrid();
  });
}

/* -------------------------------------------------------------
   CELL STATE + GRID RENDERING
--------------------------------------------------------------*/

const ephemeralCells = new Map<string, L.Rectangle>();
const gridLayer = L.layerGroup().addTo(map);

function getCellTokenValue(i: number, j: number): number | null {
  const key = cellKey(i, j);
  return modifiedCells.has(key) ? modifiedCells.get(key)! : tokenFromLuck(i, j);
}

function setCellTokenValue(i: number, j: number, value: number | null) {
  modifiedCells.set(cellKey(i, j), value);
}

function isInteractableCell(i: number, j: number) {
  return cellDistance(i, j, player.i, player.j) <= PICKUP_STEPS;
}

function renderGrid() {
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
        });
      }

      rect.on("click", () => {
        if (!isInteractableCell(i, j)) return;

        const current = getCellTokenValue(i, j);

        if (heldToken === null) {
          if (current == null) return;
          heldToken = current;
          setCellTokenValue(i, j, null);
        } else if (current === heldToken) {
          setCellTokenValue(i, j, heldToken * 2);
          heldToken = null;
        }

        saveGameState();
        updateInventoryUI();
        renderGrid();
      });

      rect.addTo(gridLayer);
      ephemeralCells.set(key, rect);
    }
  }
}

map.on("moveend", renderGrid);
map.on("dragend", renderGrid);
map.on("zoomend", renderGrid);

renderGrid();
updateInventoryUI();

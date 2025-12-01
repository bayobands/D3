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
   1. MAP SETUP
--------------------------------------------------------------*/

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.appendChild(mapDiv);

const CLASS_LAT = 36.99790233940329;
const CLASS_LNG = -122.05700844526292;

const map = L.map("map", {
  zoomControl: true,
  zoomSnap: 0,
}).setView([CLASS_LAT, CLASS_LNG], 18);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

/* -------------------------------------------------------------
   2. INVENTORY UI + WIN MESSAGE
--------------------------------------------------------------*/

const inventoryDiv = document.createElement("div");
inventoryDiv.id = "inventory";
inventoryDiv.style.padding = "8px";
inventoryDiv.style.fontSize = "18px";
inventoryDiv.style.background = "rgba(0,0,0,0.45)";
inventoryDiv.style.color = "white";
inventoryDiv.style.position = "absolute";
inventoryDiv.style.top = "10px";
inventoryDiv.style.left = "10px";
inventoryDiv.style.zIndex = "999";
document.body.appendChild(inventoryDiv);

const winDiv = document.createElement("div");
winDiv.id = "winMessage";
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
   3. GRID + TOKEN LOGIC
--------------------------------------------------------------*/

const CELL_SIZE = 0.0001;
const cellLayers: Map<string, L.Rectangle> = new Map();
const cellTokenMap: Map<string, number | null> = new Map();

function cellKey(i: number, j: number): string {
  return `${i},${j}`;
}

function tokenFromLuck(i: number, j: number): number | null {
  const v = luck(`${i},${j}`);
  return v < 0.2 ? 1 : null;
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

function isInteractableCell(i: number, j: number): boolean {
  const p = latLngToCell(CLASS_LAT, CLASS_LNG);
  return cellDistance(i, j, p.i, p.j) <= 3;
}

/* -------------------------------------------------------------
   4. RENDERING + INTERACTION
--------------------------------------------------------------*/

function renderGrid() {
  const bounds = map.getBounds();
  const sw = latLngToCell(bounds.getSouth(), bounds.getWest());
  const ne = latLngToCell(bounds.getNorth(), bounds.getEast());

  for (let i = sw.i - 1; i <= ne.i + 1; i++) {
    for (let j = sw.j - 1; j <= ne.j + 1; j++) {
      const key = cellKey(i, j);

      if (cellLayers.has(key)) continue;

      if (!cellTokenMap.has(key)) {
        cellTokenMap.set(key, tokenFromLuck(i, j));
      }

      const tokenValue = cellTokenMap.get(key);

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

        const cellValue = cellTokenMap.get(key);

        if (heldToken === null) {
          if (cellValue == null) return;

          heldToken = cellValue;
          updateInventoryUI();

          cellTokenMap.set(key, null);
          rect.unbindTooltip();
          rect.setStyle({ color: "#666", fillOpacity: 0.08 });
          return;
        }

        if (cellValue === heldToken) {
          const newValue = heldToken * 2;
          cellTokenMap.set(key, newValue);

          rect.setStyle({ color: "#2b8a3e", fillOpacity: 0.25 });
          rect.bindTooltip(`${newValue}`, {
            permanent: true,
            direction: "center",
            className: "cell-label",
          });

          heldToken = null;
          updateInventoryUI();
        }
      });

      rect.addTo(map);
      cellLayers.set(key, rect);
    }
  }
}

map.on("moveend", renderGrid);
renderGrid();
updateInventoryUI();

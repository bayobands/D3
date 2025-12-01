// Fix Leaflet CSS, icons, paths BEFORE Leaflet loads
import "leaflet/dist/leaflet.css";
import "./style.css";
import "./_leafletWorkaround.ts";

// Leaflet runtime + types
// @deno-types="npm:@types/leaflet"
import L from "leaflet";

// Deterministic hashing
import luck from "./_luck.ts";

// Create <div id="map"> without editing index.html
const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.appendChild(mapDiv);

/* -------------------------------------------------------------
   1. MAP SETUP
--------------------------------------------------------------*/

// Replace coordinates with the real classroom if needed
const CLASS_LAT = 36.9916;
const CLASS_LNG = -122.0583;

const map = L.map("map", {
  zoomControl: true,
  zoomSnap: 0,
}).setView([CLASS_LAT, CLASS_LNG], 18);

// OSM tiles
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

/* -------------------------------------------------------------
   2. GRID & TOKEN LOGIC
--------------------------------------------------------------*/

// About the size of a house
const CELL_SIZE = 0.0001;

// Store rendered cells so we don’t redraw them
const cellLayers: Map<string, L.Rectangle> = new Map();

// Create a key for map lookup
function cellKey(i: number, j: number): string {
  return `${i},${j}`;
}

// Deterministic spawning
function tokenFromLuck(i: number, j: number): number | null {
  const v = luck(`${i},${j}`); // 0–1
  if (v < 0.2) return 1; // 20% chance of a "1" token
  return null;
}

// Convert lat/lng → grid coordinate
function latLngToCell(lat: number, lng: number) {
  return {
    i: Math.floor(lat / CELL_SIZE),
    j: Math.floor(lng / CELL_SIZE),
  };
}

// Rectangle bounds
function boundsForCell(i: number, j: number): L.LatLngBoundsLiteral {
  return [
    [i * CELL_SIZE, j * CELL_SIZE],
    [(i + 1) * CELL_SIZE, (j + 1) * CELL_SIZE],
  ];
}

/* -------------------------------------------------------------
   3. RENDERING THE WORLD
--------------------------------------------------------------*/

function renderGrid() {
  const b = map.getBounds();

  // Convert visible map bounds into grid coordinates
  const sw = latLngToCell(b.getSouth(), b.getWest());
  const ne = latLngToCell(b.getNorth(), b.getEast());

  // Loop over every visible cell (+1 border)
  for (let i = sw.i - 1; i <= ne.i + 1; i++) {
    for (let j = sw.j - 1; j <= ne.j + 1; j++) {
      const key = cellKey(i, j);

      // Skip if already drawn
      if (!cellLayers.has(key)) {
        const tokenValue = tokenFromLuck(i, j);

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

        rect.addTo(map);
        cellLayers.set(key, rect);
      }
    }
  }
}

// Redraw grid when map moves
map.on("moveend", renderGrid);
renderGrid();

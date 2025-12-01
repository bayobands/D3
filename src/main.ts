import "leaflet/dist/leaflet.css";
import "./style.css";
import "./_leafletWorkaround.ts";

import L from "leaflet";

// Create map container
const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.appendChild(mapDiv);

const CLASS_LAT = 36.9916;
const CLASS_LNG = -122.0583;

const map = L.map("map", {
  zoomControl: true,
  zoomSnap: 0,
}).setView([CLASS_LAT, CLASS_LNG], 18);

// Tile layer
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

// Grid parameters
const CELL_SIZE = 0.0001;

// Convert lat/lng to grid coordinates
function latLngToCell(lat: number, lng: number) {
  return {
    i: Math.floor(lat / CELL_SIZE),
    j: Math.floor(lng / CELL_SIZE),
  };
}

// Rectangle bounds for each cell
function boundsForCell(i: number, j: number): L.LatLngBoundsLiteral {
  return [
    [i * CELL_SIZE, j * CELL_SIZE],
    [(i + 1) * CELL_SIZE, (j + 1) * CELL_SIZE],
  ];
}

// Map of already-rendered cells so we don't redraw them
const cellLayers: Map<string, L.Rectangle> = new Map();

function renderGrid() {
  const b = map.getBounds();

  const sw = latLngToCell(b.getSouth(), b.getWest());
  const ne = latLngToCell(b.getNorth(), b.getEast());

  for (let i = sw.i; i <= ne.i; i++) {
    for (let j = sw.j; j <= ne.j; j++) {
      const key = `${i},${j}`;

      if (cellLayers.has(key)) continue;

      const rect = L.rectangle(boundsForCell(i, j), {
        color: "#666",
        weight: 0.3,
        fillOpacity: 0.05,
      });

      rect.addTo(map);
      cellLayers.set(key, rect);
    }
  }
}

map.on("moveend", renderGrid);
renderGrid();

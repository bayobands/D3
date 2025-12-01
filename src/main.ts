// Leaflet CSS + local CSS
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

const map = L.map("map").setView([CLASS_LAT, CLASS_LNG], 18);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

// Draw ONE grid cell (0,0)
const CELL_SIZE = 0.0001;

const bounds: L.LatLngBoundsLiteral = [
  [CLASS_LAT, CLASS_LNG],
  [CLASS_LAT + CELL_SIZE, CLASS_LNG + CELL_SIZE],
];

L.rectangle(bounds, {
  color: "#666",
  weight: 0.5,
  fillOpacity: 0.1,
}).addTo(map);

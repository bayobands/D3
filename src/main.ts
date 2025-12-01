// Leaflet setup
import "leaflet/dist/leaflet.css";
import "./style.css";
import L from "leaflet";
import "./_leafletWorkaround.ts";

const CLASS_LAT = 36.9916;
const CLASS_LNG = -122.0583;

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.appendChild(mapDiv);

const map = L.map("map", {
  zoomControl: true,
  zoomSnap: 0,
}).setView([CLASS_LAT, CLASS_LNG], 18);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

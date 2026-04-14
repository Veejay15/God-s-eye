const globeEl = document.getElementById("globe");
const mapEl = document.getElementById("map");
const overlay = document.getElementById("overlay");
const overlayText = document.getElementById("overlay-text");
const vitals = document.getElementById("vitals");
const searchInput = document.getElementById("search");
const searchBtn = document.getElementById("searchBtn");
const targetsList = document.getElementById("targets-list");

const globe = Globe()(globeEl)
  .globeImageUrl("https://unpkg.com/three-globe@2.31.1/example/img/earth-night.jpg")
  .bumpImageUrl("https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png")
  .backgroundImageUrl("https://unpkg.com/three-globe@2.31.1/example/img/night-sky.png")
  .atmosphereColor("#00ff9c")
  .atmosphereAltitude(0.25)
  .pointsData([])
  .pointColor(() => "#00ff9c")
  .pointAltitude(0.01)
  .pointRadius(0.5);

globe.controls().autoRotate = true;
globe.controls().autoRotateSpeed = 0.6;

let leafletMap = null;
let leafletMarker = null;

function showOverlay(text) {
  overlayText.textContent = text;
  overlay.classList.remove("hidden");
}
function hideOverlay() { overlay.classList.add("hidden"); }

function setVitals(t) {
  document.getElementById("v-name").textContent = t.name;
  document.getElementById("v-lat").textContent = t.lat.toFixed(5);
  document.getElementById("v-lon").textContent = t.lon.toFixed(5);
  document.getElementById("v-acc").textContent = t.accuracy ? `${Math.round(t.accuracy)} m` : "—";
  document.getElementById("v-bat").textContent = t.battery != null ? `${Math.round(t.battery * 100)}%` : "—";
  const ago = Math.round((Date.now() - t.updatedAt) / 1000);
  document.getElementById("v-time").textContent = `${ago}s ago`;
  vitals.classList.remove("hidden");
}

async function loadTargets() {
  try {
    const res = await fetch("/api/targets");
    const list = await res.json();
    targetsList.innerHTML = "";
    list.forEach(t => {
      const li = document.createElement("li");
      li.textContent = `> ${t.name.toUpperCase()}`;
      li.onclick = () => locate(t.name);
      targetsList.appendChild(li);
    });
    globe.pointsData(list.filter(t => t.lat != null).map(t => ({ lat: t.lat, lng: t.lon, name: t.name })));
  } catch {}
}

async function locate(name) {
  if (!name) return;
  globeEl.classList.remove("hidden");
  mapEl.classList.add("hidden");
  vitals.classList.add("hidden");
  showOverlay("TRIANGULATING...");

  globe.controls().autoRotate = false;

  let target;
  try {
    const res = await fetch(`/api/target/${encodeURIComponent(name)}`);
    if (!res.ok) {
      overlayText.textContent = "TARGET NOT FOUND";
      setTimeout(hideOverlay, 1500);
      globe.controls().autoRotate = true;
      return;
    }
    target = await res.json();
  } catch {
    overlayText.textContent = "CONNECTION ERROR";
    setTimeout(hideOverlay, 1500);
    return;
  }

  await new Promise(r => setTimeout(r, 800));
  overlayText.textContent = "ACQUIRING SATELLITE...";

  globe.pointOfView({ lat: target.lat, lng: target.lon, altitude: 2.2 }, 2000);
  await new Promise(r => setTimeout(r, 2100));

  overlayText.textContent = "ZOOMING TO TARGET...";
  globe.pointOfView({ lat: target.lat, lng: target.lon, altitude: 0.3 }, 1500);
  await new Promise(r => setTimeout(r, 1600));

  hideOverlay();
  globeEl.classList.add("hidden");
  mapEl.classList.remove("hidden");

  if (!leafletMap) {
    leafletMap = L.map("map", { zoomControl: false, attributionControl: false }).setView([target.lat, target.lon], 17);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(leafletMap);
  } else {
    leafletMap.setView([target.lat, target.lon], 17);
    leafletMap.invalidateSize();
  }
  if (leafletMarker) leafletMarker.remove();
  leafletMarker = L.circleMarker([target.lat, target.lon], {
    radius: 10, color: "#00ff9c", fillColor: "#00ff9c", fillOpacity: 0.6, weight: 2
  }).addTo(leafletMap);

  setVitals(target);
}

searchBtn.onclick = () => locate(searchInput.value.trim());
searchInput.addEventListener("keydown", e => { if (e.key === "Enter") locate(searchInput.value.trim()); });

document.getElementById("clock").textContent = new Date().toUTCString().slice(17, 25) + " UTC";
setInterval(() => {
  document.getElementById("clock").textContent = new Date().toUTCString().slice(17, 25) + " UTC";
}, 1000);

loadTargets();
setInterval(loadTargets, 10000);

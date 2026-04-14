import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data.json");

const app = express();
app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return { targets: {} };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.post("/api/ping", (req, res) => {
  const { name, lat, lon, accuracy, battery, speed, heading } = req.body || {};
  if (!name || typeof lat !== "number" || typeof lon !== "number") {
    return res.status(400).json({ error: "name, lat, lon required" });
  }
  const data = loadData();
  const key = String(name).trim().toLowerCase();
  const now = Date.now();
  const target = data.targets[key] || { name: String(name).trim(), history: [] };
  target.name = String(name).trim();
  target.lat = lat;
  target.lon = lon;
  target.accuracy = accuracy ?? null;
  target.battery = battery ?? null;
  target.speed = speed ?? null;
  target.heading = heading ?? null;
  target.updatedAt = now;
  target.history = [...(target.history || []), { lat, lon, t: now }].slice(-500);
  data.targets[key] = target;
  saveData(data);
  res.json({ ok: true });
});

app.get("/api/targets", (_req, res) => {
  const data = loadData();
  res.json(Object.values(data.targets).map(t => ({
    name: t.name,
    lat: t.lat,
    lon: t.lon,
    accuracy: t.accuracy,
    battery: t.battery,
    speed: t.speed,
    heading: t.heading,
    updatedAt: t.updatedAt
  })));
});

app.get("/api/target/:name", (req, res) => {
  const data = loadData();
  const key = String(req.params.name).trim().toLowerCase();
  const t = data.targets[key];
  if (!t) return res.status(404).json({ error: "not found" });
  res.json(t);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  GOD'S EYE online`);
  console.log(`  Dashboard:  http://localhost:${PORT}/`);
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        console.log(`  Tracker:    http://${net.address}:${PORT}/track.html?name=Maria`);
      }
    }
  }
  console.log("");
});

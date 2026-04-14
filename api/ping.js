import { getTarget, saveTarget } from "./_kv.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }
  const { name, lat, lon, accuracy, battery, speed, heading } = req.body || {};
  if (!name || typeof lat !== "number" || typeof lon !== "number") {
    return res.status(400).json({ error: "name, lat, lon required" });
  }
  const existing = (await getTarget(name)) || { name: String(name).trim(), history: [] };
  const now = Date.now();
  const target = {
    name: String(name).trim(),
    lat,
    lon,
    accuracy: accuracy ?? null,
    battery: battery ?? null,
    speed: speed ?? null,
    heading: heading ?? null,
    updatedAt: now,
    history: [...(existing.history || []), { lat, lon, t: now }].slice(-500)
  };
  await saveTarget(target);
  res.json({ ok: true });
}

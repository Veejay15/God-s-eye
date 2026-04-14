import { getAllTargets } from "./_kv.js";

export default async function handler(_req, res) {
  const data = await getAllTargets();
  const list = Object.values(data).map(t => ({
    name: t.name,
    lat: t.lat,
    lon: t.lon,
    accuracy: t.accuracy,
    battery: t.battery,
    speed: t.speed,
    heading: t.heading,
    updatedAt: t.updatedAt
  }));
  res.json(list);
}

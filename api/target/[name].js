import { getTarget } from "../_kv.js";

export default async function handler(req, res) {
  const { name } = req.query;
  const t = await getTarget(name);
  if (!t) return res.status(404).json({ error: "not found" });
  res.json(t);
}

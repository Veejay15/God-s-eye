import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const KEY = "gods-eye:targets";

export async function getAllTargets() {
  const data = await redis.get(KEY);
  return data || {};
}

export async function saveTarget(target) {
  const data = (await redis.get(KEY)) || {};
  const key = String(target.name).trim().toLowerCase();
  data[key] = target;
  await redis.set(KEY, data);
}

export async function getTarget(name) {
  const data = (await redis.get(KEY)) || {};
  return data[String(name).trim().toLowerCase()] || null;
}

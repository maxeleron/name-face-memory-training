/**
 * Name datasets and face image sources.
 * Faces use randomuser.me portrait CDN (free, no API key, realistic photos).
 */

import { sample, shuffle, placeholderAvatar } from "./utils.js";

const REGION_FILES = {
  american: "data/names/american.json",
  "west-eu": "data/names/west-eu.json",
  "east-eu": "data/names/east-eu.json",
};

export const REGION_IDS = Object.keys(REGION_FILES);

/** @type {Record<string, { male: string[], female: string[] } | null>} */
const nameCache = {
  american: null,
  "west-eu": null,
  "east-eu": null,
};

const FETCH_TIMEOUT_MS = 12000;

/**
 * Fetch JSON with timeout.
 * @param {string} url
 * @param {AbortSignal} [signal]
 */
async function fetchJson(url, signal) {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    signal.addEventListener("abort", onAbort, { once: true });
  }
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "force-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener("abort", onAbort);
  }
}

/**
 * Load a name region JSON (cached).
 * @param {string} region
 * @param {AbortSignal} [signal]
 */
async function loadRegion(region, signal) {
  if (nameCache[region]) return nameCache[region];
  const path = REGION_FILES[region];
  if (!path) throw new Error(`Unknown region: ${region}`);
  const data = await fetchJson(path, signal);
  if (!data || !Array.isArray(data.male) || !Array.isArray(data.female)) {
    throw new Error(`Invalid name data for region: ${region}`);
  }
  nameCache[region] = data;
  return data;
}

/**
 * Prefetch all known name datasets (warm cache).
 * @returns {Promise<void>}
 */
export async function prefetchNameData() {
  await Promise.allSettled(REGION_IDS.map((r) => loadRegion(r)));
}

/**
 * Collect names from selected regions filtered by gender.
 * @param {string[]} regions
 * @param {'all'|'male'|'female'} gender
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ male: string[], female: string[] }>}
 */
export async function collectNames(regions, gender, signal) {
  const male = [];
  const female = [];
  const seenM = new Set();
  const seenF = new Set();

  const uniqueRegions = [...new Set(regions)].filter((r) => REGION_FILES[r]);
  if (uniqueRegions.length === 0) {
    throw new Error("No valid name regions selected.");
  }

  const datasets = await Promise.all(
    uniqueRegions.map((region) => loadRegion(region, signal))
  );

  for (const data of datasets) {
    if (gender === "all" || gender === "male") {
      for (const n of data.male) {
        if (!seenM.has(n)) {
          seenM.add(n);
          male.push(n);
        }
      }
    }
    if (gender === "all" || gender === "female") {
      for (const n of data.female) {
        if (!seenF.has(n)) {
          seenF.add(n);
          female.push(n);
        }
      }
    }
  }

  return { male, female };
}

/**
 * Build a unique face image URL.
 * Uses randomuser.me portraits (men 0–99, women 0–99).
 * @param {'male'|'female'} gender
 * @param {number} index unique seed
 * @returns {string}
 */
export function faceUrl(gender, index) {
  const folder = gender === "female" ? "women" : "men";
  const id = ((index % 100) + 100) % 100;
  return `https://randomuser.me/api/portraits/${folder}/${id}.jpg`;
}

/**
 * @typedef {object} Person
 * @property {string} id
 * @property {string} name
 * @property {'male'|'female'} gender
 * @property {string} imageUrl
 * @property {string} fallbackUrl
 */

/**
 * Generate a training set of people (face + name + gender).
 * @param {object} options
 * @param {number} options.count
 * @param {string[]} options.regions
 * @param {'all'|'male'|'female'} options.gender
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Person[]>}
 */
export async function generatePeople({ count, regions, gender, signal }) {
  const pools = await collectNames(regions, gender, signal);

  /** @type {{ name: string, gender: 'male'|'female' }[]} */
  const candidates = [];

  if (gender === "male" || gender === "all") {
    for (const name of pools.male) {
      candidates.push({ name, gender: "male" });
    }
  }
  if (gender === "female" || gender === "all") {
    for (const name of pools.female) {
      candidates.push({ name, gender: "female" });
    }
  }

  if (candidates.length === 0) {
    throw new Error("No names available for the selected filters.");
  }

  const n = Math.max(1, Math.min(count, 30));

  // Prefer unique names; if not enough, allow reuse with different faces
  let picked;
  if (candidates.length >= n) {
    picked = sample(candidates, n);
  } else {
    picked = [];
    const shuffled = shuffle(candidates);
    for (let i = 0; i < n; i++) {
      picked.push(shuffled[i % shuffled.length]);
    }
    picked = shuffle(picked);
  }

  // Assign unique face indices per gender so images don't collide when possible
  const maleIndices = shuffle([...Array(100).keys()]);
  const femaleIndices = shuffle([...Array(100).keys()]);
  let mi = 0;
  let fi = 0;
  const stamp = Date.now();

  return picked.map((person, i) => {
    let faceIndex;
    if (person.gender === "male") {
      faceIndex = maleIndices[mi % maleIndices.length];
      mi++;
    } else {
      faceIndex = femaleIndices[fi % femaleIndices.length];
      fi++;
    }

    return {
      id: `p-${i}-${person.gender}-${faceIndex}-${stamp}`,
      name: person.name,
      gender: person.gender,
      imageUrl: faceUrl(person.gender, faceIndex),
      fallbackUrl: placeholderAvatar(person.name, person.gender),
    };
  });
}

/**
 * Preload images so the memorize phase feels snappy.
 * Always resolves (errors become fallbacks at render time).
 * @param {string[]} urls
 * @param {AbortSignal} [signal]
 * @param {number} [timeoutMs=8000]
 * @returns {Promise<void>}
 */
export function preloadImages(urls, signal, timeoutMs = 8000) {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise((resolve) => {
          if (signal?.aborted) {
            resolve();
            return;
          }
          const img = new Image();
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            resolve();
          };
          const timer = setTimeout(finish, timeoutMs);
          img.onload = () => {
            clearTimeout(timer);
            finish();
          };
          img.onerror = () => {
            clearTimeout(timer);
            finish();
          };
          if (signal) {
            signal.addEventListener("abort", finish, { once: true });
          }
          img.src = url;
        })
    )
  ).then(() => undefined);
}

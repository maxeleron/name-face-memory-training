/**
 * Local session statistics (privacy-first, localStorage only).
 */

import { clamp, storage } from "./utils.js";

const STORAGE_KEY = "nfmt-stats";
const MAX_HISTORY = 100;

/**
 * @typedef {object} SessionRecord
 * @property {string} id
 * @property {number} ts
 * @property {number} correct
 * @property {number} total
 * @property {number} percent
 * @property {number} durationMs
 * @property {number} numPeople
 * @property {string[]} regions
 * @property {string} gender
 * @property {string} inputMethod
 * @property {boolean} timed
 * @property {boolean} practiceMistakes
 */

/**
 * @typedef {object} StatsState
 * @property {SessionRecord[]} history
 * @property {number} streak
 * @property {string|null} lastPlayDate
 * @property {number} bestPercent
 * @property {number} bestStreak
 * @property {number} totalCorrect
 * @property {number} totalFaces
 */

/** @returns {StatsState} */
function emptyState() {
  return {
    history: [],
    streak: 0,
    lastPlayDate: null,
    bestPercent: 0,
    bestStreak: 0,
    totalCorrect: 0,
    totalFaces: 0,
  };
}

/**
 * @returns {StatsState}
 */
export function loadStats() {
  const raw = storage.get(STORAGE_KEY, null);
  if (!raw || typeof raw !== "object") return emptyState();

  const history = Array.isArray(raw.history)
    ? raw.history.filter((h) => h && typeof h === "object").slice(0, MAX_HISTORY)
    : [];

  return {
    history,
    streak: clamp(Number(raw.streak) || 0, 0, 10000),
    lastPlayDate: typeof raw.lastPlayDate === "string" ? raw.lastPlayDate : null,
    bestPercent: clamp(Number(raw.bestPercent) || 0, 0, 100),
    bestStreak: clamp(Number(raw.bestStreak) || 0, 0, 10000),
    totalCorrect: Math.max(0, Number(raw.totalCorrect) || 0),
    totalFaces: Math.max(0, Number(raw.totalFaces) || 0),
  };
}

/**
 * @param {StatsState} state
 */
function saveStats(state) {
  storage.set(STORAGE_KEY, state);
}

/**
 * Local calendar date YYYY-MM-DD.
 * @param {Date} [d]
 * @returns {string}
 */
export function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number} whole days from a to b
 */
function daysBetween(a, b) {
  const da = new Date(`${a}T12:00:00`);
  const db = new Date(`${b}T12:00:00`);
  return Math.round((db - da) / 86400000);
}

/**
 * Record a finished training session.
 * @param {Omit<SessionRecord, 'id'|'ts'>} partial
 * @returns {StatsState}
 */
export function recordSession(partial) {
  const state = loadStats();
  const today = localDateKey();

  /** @type {SessionRecord} */
  const record = {
    id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
    correct: partial.correct,
    total: partial.total,
    percent: partial.percent,
    durationMs: partial.durationMs,
    numPeople: partial.numPeople,
    regions: [...(partial.regions || [])],
    gender: partial.gender,
    inputMethod: partial.inputMethod,
    timed: !!partial.timed,
    practiceMistakes: !!partial.practiceMistakes,
  };

  state.history.unshift(record);
  if (state.history.length > MAX_HISTORY) {
    state.history.length = MAX_HISTORY;
  }

  state.totalCorrect += record.correct;
  state.totalFaces += record.total;
  state.bestPercent = Math.max(state.bestPercent, record.percent);

  // Daily streak: train at least once per day
  if (state.lastPlayDate === today) {
    // same day — keep streak
  } else if (state.lastPlayDate && daysBetween(state.lastPlayDate, today) === 1) {
    state.streak += 1;
  } else {
    state.streak = 1;
  }
  state.lastPlayDate = today;
  state.bestStreak = Math.max(state.bestStreak, state.streak);

  saveStats(state);
  return state;
}

/**
 * @returns {StatsState}
 */
export function clearStats() {
  const state = emptyState();
  saveStats(state);
  return state;
}

/**
 * Summary metrics for the stats UI.
 * @param {StatsState} [state]
 */
export function getSummary(state = loadStats()) {
  const sessions = state.history.length;
  const avgPercent =
    sessions === 0
      ? 0
      : Math.round(
          state.history.reduce((sum, h) => sum + h.percent, 0) / sessions
        );
  const last5 = state.history.slice(0, 5);
  const last5Avg =
    last5.length === 0
      ? 0
      : Math.round(last5.reduce((s, h) => s + h.percent, 0) / last5.length);

  // Stale streak if last play was before yesterday
  let streak = state.streak;
  if (state.lastPlayDate) {
    const gap = daysBetween(state.lastPlayDate, localDateKey());
    if (gap > 1) streak = 0;
  }

  return {
    sessions,
    avgPercent,
    last5Avg,
    bestPercent: state.bestPercent,
    streak,
    bestStreak: state.bestStreak,
    totalCorrect: state.totalCorrect,
    totalFaces: state.totalFaces,
    history: state.history,
    overallAccuracy:
      state.totalFaces > 0
        ? Math.round((state.totalCorrect / state.totalFaces) * 100)
        : 0,
  };
}

/**
 * Export stats as pretty JSON string.
 * @returns {string}
 */
export function exportStatsJson() {
  return JSON.stringify(loadStats(), null, 2);
}

/**
 * Import stats from a parsed object (merge or replace).
 * @param {unknown} data
 * @param {'replace'|'merge'} [mode='replace']
 * @returns {StatsState}
 */
export function importStats(data, mode = "replace") {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid stats data");
  }
  const incoming = /** @type {Partial<StatsState>} */ (data);
  if (mode === "replace") {
    const next = {
      ...emptyState(),
      ...incoming,
      history: Array.isArray(incoming.history) ? incoming.history.slice(0, MAX_HISTORY) : [],
    };
    saveStats(next);
    return loadStats();
  }

  const current = loadStats();
  const mergedHistory = [
    ...(Array.isArray(incoming.history) ? incoming.history : []),
    ...current.history,
  ]
    .filter((h, i, arr) => h && h.id && arr.findIndex((x) => x.id === h.id) === i)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, MAX_HISTORY);

  const next = {
    history: mergedHistory,
    streak: Math.max(current.streak, Number(incoming.streak) || 0),
    lastPlayDate: current.lastPlayDate || incoming.lastPlayDate || null,
    bestPercent: Math.max(current.bestPercent, Number(incoming.bestPercent) || 0),
    bestStreak: Math.max(current.bestStreak, Number(incoming.bestStreak) || 0),
    totalCorrect: current.totalCorrect + Math.max(0, Number(incoming.totalCorrect) || 0),
    totalFaces: current.totalFaces + Math.max(0, Number(incoming.totalFaces) || 0),
  };
  saveStats(next);
  return next;
}

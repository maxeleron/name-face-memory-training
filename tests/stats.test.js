import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

// Minimal localStorage polyfill for Node tests
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

const {
  loadStats,
  recordSession,
  clearStats,
  getSummary,
  localDateKey,
  exportStatsJson,
  importStats,
} = await import("../js/stats.js");

beforeEach(() => {
  store.clear();
});

describe("stats", () => {
  it("starts empty", () => {
    const s = loadStats();
    assert.equal(s.history.length, 0);
    assert.equal(s.streak, 0);
  });

  it("records a session and updates totals", () => {
    recordSession({
      correct: 7,
      total: 10,
      percent: 70,
      durationMs: 30000,
      numPeople: 10,
      regions: ["american"],
      gender: "all",
      inputMethod: "text",
      timed: false,
      practiceMistakes: false,
    });
    const s = loadStats();
    assert.equal(s.history.length, 1);
    assert.equal(s.totalCorrect, 7);
    assert.equal(s.totalFaces, 10);
    assert.equal(s.bestPercent, 70);
    assert.equal(s.streak, 1);
    assert.equal(s.lastPlayDate, localDateKey());
  });

  it("same-day sessions keep streak at 1", () => {
    const base = {
      correct: 1,
      total: 2,
      percent: 50,
      durationMs: 1000,
      numPeople: 2,
      regions: ["american"],
      gender: "all",
      inputMethod: "text",
      timed: false,
      practiceMistakes: false,
    };
    recordSession(base);
    recordSession({ ...base, percent: 100, correct: 2 });
    const s = loadStats();
    assert.equal(s.streak, 1);
    assert.equal(s.bestPercent, 100);
    assert.equal(s.history.length, 2);
  });

  it("getSummary computes averages", () => {
    recordSession({
      correct: 10,
      total: 10,
      percent: 100,
      durationMs: 1000,
      numPeople: 10,
      regions: ["american"],
      gender: "all",
      inputMethod: "text",
      timed: true,
      practiceMistakes: false,
    });
    recordSession({
      correct: 5,
      total: 10,
      percent: 50,
      durationMs: 1000,
      numPeople: 10,
      regions: ["american"],
      gender: "all",
      inputMethod: "text",
      timed: false,
      practiceMistakes: true,
    });
    const sum = getSummary();
    assert.equal(sum.sessions, 2);
    assert.equal(sum.avgPercent, 75);
    assert.equal(sum.overallAccuracy, 75);
  });

  it("clearStats resets", () => {
    recordSession({
      correct: 1,
      total: 1,
      percent: 100,
      durationMs: 1,
      numPeople: 1,
      regions: ["american"],
      gender: "all",
      inputMethod: "text",
      timed: false,
      practiceMistakes: false,
    });
    clearStats();
    assert.equal(loadStats().history.length, 0);
  });

  it("export/import round-trip", () => {
    recordSession({
      correct: 3,
      total: 4,
      percent: 75,
      durationMs: 2000,
      numPeople: 4,
      regions: ["west-eu"],
      gender: "female",
      inputMethod: "dropdown",
      timed: false,
      practiceMistakes: false,
    });
    const json = exportStatsJson();
    clearStats();
    importStats(JSON.parse(json), "replace");
    assert.equal(loadStats().history.length, 1);
    assert.equal(loadStats().history[0].percent, 75);
  });
});

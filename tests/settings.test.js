import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

const {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  validateSettings,
  getTimerDuration,
  applyPreset,
  PRESETS,
} = await import("../js/settings.js");

beforeEach(() => store.clear());

describe("settings", () => {
  it("loads defaults when empty", () => {
    const s = loadSettings();
    assert.equal(s.numPeople, DEFAULT_SETTINGS.numPeople);
    assert.deepEqual(s.regions, DEFAULT_SETTINGS.regions);
  });

  it("persists and reloads", () => {
    saveSettings({ ...DEFAULT_SETTINGS, numPeople: 15, timerEnabled: true });
    const s = loadSettings();
    assert.equal(s.numPeople, 15);
    assert.equal(s.timerEnabled, true);
  });

  it("clamps out-of-range values", () => {
    saveSettings({ ...DEFAULT_SETTINGS, numPeople: 999, timerSeconds: -5 });
    const s = loadSettings();
    assert.equal(s.numPeople, 30);
    assert.equal(s.timerSeconds, 1);
  });

  it("validates regions", () => {
    assert.equal(validateSettings({ ...DEFAULT_SETTINGS, regions: [] }), "regionsError");
    assert.equal(validateSettings(DEFAULT_SETTINGS), null);
  });

  it("timer duration total vs perFace", () => {
    assert.equal(
      getTimerDuration({ ...DEFAULT_SETTINGS, timerEnabled: true, timerMode: "total", timerSeconds: 40 }),
      40
    );
    assert.equal(
      getTimerDuration({
        ...DEFAULT_SETTINGS,
        timerEnabled: true,
        timerMode: "perFace",
        timerSeconds: 3,
        numPeople: 10,
      }),
      30
    );
    assert.equal(getTimerDuration({ ...DEFAULT_SETTINGS, timerEnabled: false }), 0);
  });

  it("applyPreset hard", () => {
    const hard = applyPreset("hard");
    assert.equal(hard.numPeople, PRESETS.hard.numPeople);
    assert.equal(hard.timerEnabled, true);
    assert.equal(hard.inputMethod, "text");
  });

  it("unknown preset returns base", () => {
    const base = loadSettings();
    assert.equal(applyPreset("nope", base), base);
  });
});

/**
 * Settings form: read, write, validate, persist, presets.
 */

import { clamp, storage } from "./utils.js";

const STORAGE_KEY = "nfmt-settings";

/** @typedef {'column'|'tiles'} Layout */
/** @typedef {'above'|'under'} NamePosition */
/** @typedef {'all'|'male'|'female'} Gender */
/** @typedef {'text'|'dropdown'} InputMethod */
/** @typedef {'total'|'perFace'} TimerMode */

/**
 * @typedef {object} Settings
 * @property {number} numPeople
 * @property {string[]} regions
 * @property {Gender} gender
 * @property {Layout} layout
 * @property {NamePosition} namePosition
 * @property {boolean} shuffle
 * @property {boolean} timerEnabled
 * @property {TimerMode} timerMode
 * @property {number} timerSeconds
 * @property {boolean} timerVisible
 * @property {InputMethod} inputMethod
 * @property {boolean} hintsEnabled
 * @property {boolean} confirmLeave
 */

/** @type {Settings} */
export const DEFAULT_SETTINGS = {
  numPeople: 8,
  regions: ["american", "west-eu"],
  gender: "all",
  layout: "tiles",
  namePosition: "under",
  shuffle: true,
  timerEnabled: false,
  timerMode: "total",
  timerSeconds: 30,
  timerVisible: true,
  inputMethod: "text",
  hintsEnabled: false,
  confirmLeave: true,
};

/**
 * Difficulty presets applied to the form.
 * @type {Record<string, Partial<Settings>>}
 */
export const PRESETS = {
  easy: {
    numPeople: 4,
    regions: ["american"],
    gender: "all",
    layout: "tiles",
    namePosition: "under",
    shuffle: false,
    timerEnabled: false,
    inputMethod: "dropdown",
    hintsEnabled: true,
  },
  medium: {
    numPeople: 8,
    regions: ["american", "west-eu"],
    gender: "all",
    layout: "tiles",
    namePosition: "under",
    shuffle: true,
    timerEnabled: false,
    inputMethod: "text",
    hintsEnabled: false,
  },
  hard: {
    numPeople: 12,
    regions: ["american", "west-eu", "east-eu"],
    gender: "all",
    layout: "tiles",
    namePosition: "under",
    shuffle: true,
    timerEnabled: true,
    timerMode: "perFace",
    timerSeconds: 3,
    timerVisible: true,
    inputMethod: "text",
    hintsEnabled: false,
  },
  expert: {
    numPeople: 20,
    regions: ["american", "west-eu", "east-eu"],
    gender: "all",
    layout: "tiles",
    namePosition: "under",
    shuffle: true,
    timerEnabled: true,
    timerMode: "total",
    timerSeconds: 25,
    timerVisible: true,
    inputMethod: "text",
    hintsEnabled: false,
  },
};

/**
 * @returns {Settings}
 */
export function loadSettings() {
  const saved = storage.get(STORAGE_KEY, null);
  if (!saved || typeof saved !== "object") return { ...DEFAULT_SETTINGS };

  const regions = Array.isArray(saved.regions) && saved.regions.length
    ? saved.regions.filter((r) => typeof r === "string")
    : DEFAULT_SETTINGS.regions;

  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    regions: regions.length ? regions : DEFAULT_SETTINGS.regions,
    numPeople: clamp(Number(saved.numPeople) || DEFAULT_SETTINGS.numPeople, 2, 30),
    timerSeconds: clamp(
      Number(saved.timerSeconds) || DEFAULT_SETTINGS.timerSeconds,
      1,
      600
    ),
    gender: /** @type {Gender} */ (
      ["all", "male", "female"].includes(saved.gender) ? saved.gender : "all"
    ),
    layout: saved.layout === "column" ? "column" : "tiles",
    namePosition: saved.namePosition === "above" ? "above" : "under",
    inputMethod: saved.inputMethod === "dropdown" ? "dropdown" : "text",
    timerMode: saved.timerMode === "perFace" ? "perFace" : "total",
    shuffle: saved.shuffle !== false,
    timerEnabled: !!saved.timerEnabled,
    timerVisible: saved.timerVisible !== false,
    hintsEnabled: !!saved.hintsEnabled,
    confirmLeave: saved.confirmLeave !== false,
  };
}

/**
 * @param {Settings} settings
 */
export function saveSettings(settings) {
  storage.set(STORAGE_KEY, settings);
}

/**
 * Apply settings object to the form DOM.
 * @param {Settings} settings
 * @param {HTMLFormElement} form
 */
export function applySettingsToForm(settings, form) {
  const numPeople = form.querySelector("#numPeople");
  const numPeopleValue = form.querySelector("#numPeopleValue");
  if (numPeople) {
    numPeople.value = String(settings.numPeople);
    if (numPeopleValue) numPeopleValue.textContent = String(settings.numPeople);
  }

  form.querySelectorAll('input[name="regions"]').forEach((el) => {
    el.checked = settings.regions.includes(el.value);
  });

  setRadio(form, "gender", settings.gender);
  setRadio(form, "layout", settings.layout);
  setRadio(form, "namePosition", settings.namePosition);
  setRadio(form, "inputMethod", settings.inputMethod);

  const shuffle = form.querySelector("#shuffle");
  if (shuffle) shuffle.checked = settings.shuffle;

  const timerEnabled = form.querySelector("#timerEnabled");
  if (timerEnabled) timerEnabled.checked = settings.timerEnabled;

  const timerMode = form.querySelector("#timerMode");
  if (timerMode) timerMode.value = settings.timerMode;

  const timerSeconds = form.querySelector("#timerSeconds");
  if (timerSeconds) timerSeconds.value = String(settings.timerSeconds);

  const timerVisible = form.querySelector("#timerVisible");
  if (timerVisible) timerVisible.checked = settings.timerVisible;

  const hintsEnabled = form.querySelector("#hintsEnabled");
  if (hintsEnabled) hintsEnabled.checked = settings.hintsEnabled;

  const confirmLeave = form.querySelector("#confirmLeave");
  if (confirmLeave) confirmLeave.checked = settings.confirmLeave;

  updateTimerOptionsVisibility(form);
}

/**
 * Read settings from the form DOM.
 * @param {HTMLFormElement} form
 * @returns {Settings}
 */
export function readSettingsFromForm(form) {
  const numPeople = clamp(
    parseInt(form.querySelector("#numPeople")?.value ?? "8", 10),
    2,
    30
  );

  const regions = [...form.querySelectorAll('input[name="regions"]:checked')].map(
    (el) => el.value
  );

  return {
    numPeople,
    regions,
    gender: getRadio(form, "gender", "all"),
    layout: getRadio(form, "layout", "tiles"),
    namePosition: getRadio(form, "namePosition", "under"),
    shuffle: !!form.querySelector("#shuffle")?.checked,
    timerEnabled: !!form.querySelector("#timerEnabled")?.checked,
    timerMode: form.querySelector("#timerMode")?.value === "perFace" ? "perFace" : "total",
    timerSeconds: clamp(
      parseInt(form.querySelector("#timerSeconds")?.value ?? "30", 10),
      1,
      600
    ),
    timerVisible: !!form.querySelector("#timerVisible")?.checked,
    inputMethod: getRadio(form, "inputMethod", "text"),
    hintsEnabled: !!form.querySelector("#hintsEnabled")?.checked,
    confirmLeave: form.querySelector("#confirmLeave")
      ? !!form.querySelector("#confirmLeave")?.checked
      : true,
  };
}

/**
 * Validate settings; returns error key or null.
 * @param {Settings} settings
 * @returns {string|null}
 */
export function validateSettings(settings) {
  if (!settings.regions || settings.regions.length === 0) {
    return "regionsError";
  }
  return null;
}

/**
 * Compute total memorize duration in seconds.
 * @param {Settings} settings
 * @returns {number}
 */
export function getTimerDuration(settings) {
  if (!settings.timerEnabled) return 0;
  if (settings.timerMode === "perFace") {
    return settings.timerSeconds * settings.numPeople;
  }
  return settings.timerSeconds;
}

/**
 * Apply a named preset onto current settings (merge).
 * @param {string} name
 * @param {Settings} [base]
 * @returns {Settings}
 */
export function applyPreset(name, base = loadSettings()) {
  const patch = PRESETS[name];
  if (!patch) return base;
  return {
    ...base,
    ...patch,
    regions: patch.regions ? [...patch.regions] : base.regions,
  };
}

/**
 * Wire live UI interactions on the settings form.
 * @param {HTMLFormElement} form
 * @param {{ onChange?: (s: Settings) => void }} [hooks]
 */
export function bindSettingsUI(form, hooks = {}) {
  const numPeople = form.querySelector("#numPeople");
  const numPeopleValue = form.querySelector("#numPeopleValue");
  if (numPeople && numPeopleValue) {
    numPeople.addEventListener("input", () => {
      numPeopleValue.textContent = numPeople.value;
    });
  }

  const timerEnabled = form.querySelector("#timerEnabled");
  if (timerEnabled) {
    timerEnabled.addEventListener("change", () => updateTimerOptionsVisibility(form));
  }

  form.querySelectorAll('input[name="regions"]').forEach((el) => {
    el.addEventListener("change", () => {
      const err = document.getElementById("regionsError");
      if (err) err.hidden = true;
    });
  });

  // Auto-persist on any change
  form.addEventListener("change", () => {
    const s = readSettingsFromForm(form);
    if (!validateSettings(s)) {
      saveSettings(s);
      hooks.onChange?.(s);
    }
  });
  form.addEventListener("input", () => {
    const s = readSettingsFromForm(form);
    if (!validateSettings(s)) {
      saveSettings(s);
      hooks.onChange?.(s);
    }
  });
}

/**
 * @param {HTMLFormElement} form
 */
function updateTimerOptionsVisibility(form) {
  const timerOptions = form.querySelector("#timerOptions");
  const enabled = form.querySelector("#timerEnabled")?.checked;
  if (timerOptions) timerOptions.hidden = !enabled;
}

/**
 * @param {HTMLFormElement} form
 * @param {string} name
 * @param {string} value
 */
function setRadio(form, name, value) {
  const el = form.querySelector(`input[name="${name}"][value="${value}"]`);
  if (el) el.checked = true;
}

/**
 * @param {HTMLFormElement} form
 * @param {string} name
 * @param {string} fallback
 */
function getRadio(form, name, fallback) {
  const el = form.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : fallback;
}

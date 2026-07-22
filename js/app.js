/**
 * App entry: wire screens, theme, i18n, settings, stats, and game.
 */

import { initI18n, setLanguage, getLanguage, t, applyTranslations } from "./i18n.js";
import {
  loadSettings,
  saveSettings,
  applySettingsToForm,
  readSettingsFromForm,
  validateSettings,
  bindSettingsUI,
  applyPreset,
} from "./settings.js";
import { Game } from "./game.js";
import { prefetchNameData } from "./data.js";
import {
  getSummary,
  clearStats,
  exportStatsJson,
  importStats,
} from "./stats.js";
import { initTheme, toggleTheme, watchSystemTheme } from "./theme.js";
import { toast } from "./toast.js";
import { announce } from "./announce.js";
import {
  setVisible,
  formatTime,
  downloadText,
  el,
} from "./utils.js";

const $ = (sel) => document.querySelector(sel);

/** @type {Game|null} */
let game = null;
/** @type {import('./settings.js').Settings|null} */
let currentSettings = null;

async function main() {
  initTheme();
  watchSystemTheme();

  await initI18n();
  const langSelect = $("#langSelect");
  if (langSelect) langSelect.value = getLanguage();

  const form = /** @type {HTMLFormElement} */ ($("#settingsForm"));
  currentSettings = loadSettings();
  applySettingsToForm(currentSettings, form);
  bindSettingsUI(form, {
    onChange: (s) => {
      currentSettings = s;
    },
  });

  game = new Game({
    memorizeGrid: $("#memorizeGrid"),
    recallGrid: $("#recallGrid"),
    timerDisplay: $("#timerDisplay"),
    timerCountdown: $("#timerCountdown"),
    timerProgress: $("#timerProgressBar"),
    scorePercent: $("#scorePercent"),
    scoreCorrect: $("#scoreCorrect"),
    scoreTotal: $("#scoreTotal"),
    scoreMessage: $("#scoreMessage"),
    scoreRingFg: $("#scoreRingFg"),
    mistakesSection: $("#mistakesSection"),
    mistakesList: $("#mistakesList"),
    practiceMistakesBtn: $("#practiceMistakesBtn"),
    sessionMeta: $("#sessionMeta"),
    showScreen,
    setLoading,
    onSessionComplete: () => {
      // Refresh stats if visible later
    },
  });

  // Warm name cache in background
  prefetchNameData().catch(() => {});

  // --- Event bindings ---

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await startFromForm();
  });

  $("#readyBtn")?.addEventListener("click", () => {
    game?.goToRecall();
  });

  $("#checkBtn")?.addEventListener("click", () => {
    game?.checkAnswers();
  });

  $("#playAgainBtn")?.addEventListener("click", async () => {
    try {
      await game?.playAgain();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || t("errorStart"));
    }
  });

  $("#changeSettingsBtn")?.addEventListener("click", () => {
    leaveToSettings();
  });

  $("#practiceMistakesBtn")?.addEventListener("click", async () => {
    try {
      await game?.practiceMistakes();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || t("errorStart"));
    }
  });

  // Presets
  document.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.getAttribute("data-preset");
      if (!name) return;
      const next = applyPreset(name, readSettingsFromForm(form));
      applySettingsToForm(next, form);
      saveSettings(next);
      currentSettings = next;
      // Visual feedback
      document.querySelectorAll("[data-preset]").forEach((b) =>
        b.classList.toggle("is-active", b === btn)
      );
      toast.info(t("presetApplied", { name: t(`preset_${name}`) }));
    });
  });

  // Stats screen
  $("#statsBtn")?.addEventListener("click", () => {
    if (game?.isActive) {
      toast.warning(t("finishSessionFirst"));
      return;
    }
    renderStats();
    showScreen("stats");
    announce(t("statsTitle"));
  });

  $("#statsBackBtn")?.addEventListener("click", () => {
    showScreen("settings");
  });

  $("#clearStatsBtn")?.addEventListener("click", () => {
    if (!confirm(t("clearStatsConfirm"))) return;
    clearStats();
    renderStats();
    toast.success(t("statsCleared"));
  });

  $("#exportStatsBtn")?.addEventListener("click", () => {
    downloadText(
      `name-face-stats-${new Date().toISOString().slice(0, 10)}.json`,
      exportStatsJson()
    );
    toast.success(t("statsExported"));
  });

  $("#importStatsBtn")?.addEventListener("click", () => {
    $("#importStatsFile")?.click();
  });

  $("#importStatsFile")?.addEventListener("change", async (e) => {
    const file = /** @type {HTMLInputElement} */ (e.target).files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      importStats(data, "merge");
      renderStats();
      toast.success(t("statsImported"));
    } catch (err) {
      console.error(err);
      toast.error(t("statsImportError"));
    }
    /** @type {HTMLInputElement} */ (e.target).value = "";
  });

  langSelect?.addEventListener("change", async () => {
    await setLanguage(langSelect.value);
    // Re-render dynamic stats labels if on stats screen
    if (!$("#screen-stats")?.hidden) renderStats();
  });

  $("#themeToggle")?.addEventListener("click", () => {
    const next = toggleTheme();
    toast.info(next === "light" ? t("themeLight") : t("themeDark"), 1600);
  });

  // Recall: Enter moves to next field / checks
  $("#recallGrid")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches("input, select")) {
      e.preventDefault();
      const inputs = [...$("#recallGrid").querySelectorAll("[data-answer-for]")];
      const idx = inputs.indexOf(e.target);
      if (idx >= 0 && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
      } else {
        $("#checkBtn")?.focus();
      }
    }
  });

  // Global keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    const tag = /** @type {HTMLElement} */ (e.target)?.tagName;
    const typing =
      tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" ||
      /** @type {HTMLElement} */ (e.target)?.isContentEditable;

    if (e.key === "Escape") {
      if (game?.isActive) {
        e.preventDefault();
        leaveToSettings(true);
      } else if (!$("#screen-stats")?.hidden) {
        showScreen("settings");
      }
      return;
    }

    if (typing) return;

    // M = ready (memorize)
    if ((e.key === "m" || e.key === "M") && game?.phase === "memorize") {
      e.preventDefault();
      game.goToRecall();
    }
    // C = check answers
    if ((e.key === "c" || e.key === "C") && game?.phase === "recall") {
      e.preventDefault();
      game.checkAnswers();
    }
  });

  // Warn before unload mid-session
  window.addEventListener("beforeunload", (e) => {
    if (!game?.isActive) return;
    const s = currentSettings || loadSettings();
    if (!s.confirmLeave) return;
    e.preventDefault();
    e.returnValue = "";
  });

  // PWA service worker
  registerServiceWorker();

  // Online/offline feedback
  window.addEventListener("offline", () => toast.warning(t("offline"), 5000));
  window.addEventListener("online", () => toast.info(t("online"), 2500));
}

/**
 * @returns {Promise<void>}
 */
async function startFromForm() {
  const form = /** @type {HTMLFormElement} */ ($("#settingsForm"));
  const current = readSettingsFromForm(form);
  const errorKey = validateSettings(current);

  const regionsError = $("#regionsError");
  if (errorKey) {
    if (regionsError) {
      regionsError.hidden = false;
      regionsError.textContent = t(errorKey);
    }
    toast.warning(t(errorKey));
    return;
  }
  if (regionsError) regionsError.hidden = true;

  saveSettings(current);
  currentSettings = current;

  try {
    await game?.start(current);
  } catch (err) {
    console.error(err);
    toast.error(err?.message || t("errorStart"));
  }
}

/**
 * @param {boolean} [confirmIfActive]
 */
function leaveToSettings(confirmIfActive = false) {
  if (game?.isActive && confirmIfActive) {
    const s = currentSettings || loadSettings();
    if (s.confirmLeave && !confirm(t("leaveConfirm"))) return;
  }
  game?.reset();
  showScreen("settings");
  announce(t("settingsTitle"));
}

/**
 * @param {'settings'|'memorize'|'recall'|'results'|'stats'} name
 */
function showScreen(name) {
  const screens = ["settings", "memorize", "recall", "results", "stats"];
  for (const s of screens) {
    const node = document.getElementById(`screen-${s}`);
    if (!node) continue;
    const active = s === name;
    node.hidden = !active;
    node.classList.toggle("screen--active", active);
    if (active) {
      node.setAttribute("tabindex", "-1");
    }
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
  // Move focus to heading for a11y
  requestAnimationFrame(() => {
    const heading = document.querySelector(
      `#screen-${name} h2, #screen-${name} [tabindex="-1"]`
    );
    if (heading instanceof HTMLElement) {
      heading.focus?.({ preventScroll: true });
    }
  });
}

/**
 * @param {boolean} show
 */
function setLoading(show) {
  setVisible($("#loadingOverlay"), show);
  $("#loadingOverlay")?.setAttribute("aria-busy", show ? "true" : "false");
}

function renderStats() {
  const summary = getSummary();
  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = String(value);
  };

  setText("statSessions", summary.sessions);
  setText("statAvg", `${summary.avgPercent}%`);
  setText("statBest", `${summary.bestPercent}%`);
  setText("statStreak", summary.streak);
  setText("statBestStreak", summary.bestStreak);
  setText("statAccuracy", `${summary.overallAccuracy}%`);
  setText("statFaces", summary.totalFaces);
  setText("statLast5", `${summary.last5Avg}%`);

  const list = $("#statsHistory");
  if (!list) return;
  list.innerHTML = "";

  if (summary.history.length === 0) {
    list.appendChild(
      el("li", {
        className: "stats-history__empty",
        text: t("statsEmpty"),
      })
    );
    return;
  }

  for (const h of summary.history.slice(0, 20)) {
    const item = el("li", { className: "stats-history__item" });
    const date = new Date(h.ts);
    const dateStr = date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const left = el("div", { className: "stats-history__left" });
    left.appendChild(
      el("span", {
        className: "stats-history__score",
        text: `${h.percent}%`,
      })
    );
    left.appendChild(
      el("span", {
        className: "stats-history__detail",
        text: `${h.correct}/${h.total} · ${dateStr}`,
      })
    );

    const badges = el("div", { className: "stats-history__badges" });
    if (h.practiceMistakes) {
      badges.appendChild(
        el("span", { className: "badge badge--muted", text: t("badgePractice") })
      );
    }
    if (h.timed) {
      badges.appendChild(
        el("span", { className: "badge badge--muted", text: t("badgeTimed") })
      );
    }
    badges.appendChild(
      el("span", {
        className: "badge",
        text: formatTime((h.durationMs || 0) / 1000),
      })
    );

    item.appendChild(left);
    item.appendChild(badges);
    list.appendChild(item);
  }

  // Sparkline of last 12 scores
  renderSparkline(summary.history.slice(0, 12).reverse().map((h) => h.percent));
  applyTranslations();
}

/**
 * @param {number[]} values 0–100
 */
function renderSparkline(values) {
  const svg = $("#statsSparkline");
  if (!svg) return;
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  if (values.length < 2) {
    svg.setAttribute("aria-hidden", "true");
    return;
  }
  svg.removeAttribute("aria-hidden");

  const w = 280;
  const h = 56;
  const pad = 4;
  const max = 100;
  const min = 0;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
    return [x, y];
  });

  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.setAttribute("class", "sparkline__path");
  path.setAttribute("fill", "none");
  svg.appendChild(path);

  // Area fill
  const areaD =
    d +
    ` L${pts[pts.length - 1][0].toFixed(1)},${h - pad}` +
    ` L${pts[0][0].toFixed(1)},${h - pad} Z`;
  const area = document.createElementNS("http://www.w3.org/2000/svg", "path");
  area.setAttribute("d", areaD);
  area.setAttribute("class", "sparkline__area");
  svg.insertBefore(area, path);

  const last = pts[pts.length - 1];
  const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  dot.setAttribute("cx", String(last[0]));
  dot.setAttribute("cy", String(last[1]));
  dot.setAttribute("r", "3.5");
  dot.setAttribute("class", "sparkline__dot");
  svg.appendChild(dot);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  // Only register when served over http(s) — not file://
  if (!window.location.protocol.startsWith("http")) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.warn("SW registration failed:", err);
    });
  });
}

main().catch((err) => {
  console.error("App failed to start:", err);
  toast.error("Failed to start app. Please reload.");
});

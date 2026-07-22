/**
 * Game flow: memorize → recall → results.
 */

import { generatePeople, preloadImages } from "./data.js";
import { getTimerDuration } from "./settings.js";
import {
  shuffle,
  namesMatch,
  formatTime,
  el,
  setVisible,
  withImageFallback,
  isAbortError,
} from "./utils.js";
import { t } from "./i18n.js";
import { recordSession } from "./stats.js";
import { announce } from "./announce.js";

/**
 * @typedef {import('./settings.js').Settings} Settings
 * @typedef {{ id: string, name: string, gender: string, imageUrl: string, fallbackUrl?: string }} Person
 */

export class Game {
  /**
   * @param {object} ui
   * @param {HTMLElement} ui.memorizeGrid
   * @param {HTMLElement} ui.recallGrid
   * @param {HTMLElement} ui.timerDisplay
   * @param {HTMLElement} ui.timerCountdown
   * @param {HTMLElement|null} [ui.timerProgress]
   * @param {HTMLElement} ui.scorePercent
   * @param {HTMLElement} ui.scoreCorrect
   * @param {HTMLElement} ui.scoreTotal
   * @param {HTMLElement} ui.scoreMessage
   * @param {SVGCircleElement} ui.scoreRingFg
   * @param {HTMLElement} ui.mistakesSection
   * @param {HTMLElement} ui.mistakesList
   * @param {HTMLElement|null} [ui.practiceMistakesBtn]
   * @param {HTMLElement|null} [ui.sessionMeta]
   * @param {(screen: string) => void} ui.showScreen
   * @param {(show: boolean) => void} ui.setLoading
   * @param {() => void} [ui.onSessionComplete]
   */
  constructor(ui) {
    this.ui = ui;
    /** @type {Settings|null} */
    this.settings = null;
    /** @type {Person[]} */
    this.people = [];
    /** @type {Person[]} */
    this.recallOrder = [];
    /** @type {Person[]} */
    this.lastMistakes = [];
    /** @type {ReturnType<typeof setInterval>|null} */
    this.timerId = null;
    this.remainingSeconds = 0;
    this.timerDuration = 0;
    this.timerEndsAt = 0;
    /** @type {'idle'|'loading'|'memorize'|'recall'|'results'} */
    this.phase = "idle";
    this.sessionStartedAt = 0;
    this.practiceMistakesMode = false;
    /** @type {AbortController|null} */
    this.startAbort = null;
    this._grading = false;
  }

  /** Whether the user is mid-session (should warn on leave). */
  get isActive() {
    return this.phase === "memorize" || this.phase === "recall" || this.phase === "loading";
  }

  /**
   * Start a new session with the given settings.
   * @param {Settings} settings
   * @param {{ practiceMistakes?: boolean }} [opts]
   */
  async start(settings, opts = {}) {
    // Cancel any in-flight start
    this.startAbort?.abort();
    this.startAbort = new AbortController();
    const { signal } = this.startAbort;

    this.stopTimer();
    this._grading = false;
    this.settings = settings;
    this.practiceMistakesMode = !!opts.practiceMistakes;
    this.phase = "loading";
    this.ui.setLoading(true);

    try {
      if (this.practiceMistakesMode && this.lastMistakes.length > 0) {
        // Re-use last mistaken faces (new id suffix for input keys)
        const stamp = Date.now();
        this.people = this.lastMistakes.map((p, i) => ({
          ...p,
          id: `retry-${i}-${stamp}`,
        }));
      } else {
        this.practiceMistakesMode = false;
        this.people = await generatePeople({
          count: settings.numPeople,
          regions: settings.regions,
          gender: settings.gender,
          signal,
        });
      }

      if (signal.aborted) throw new DOMException("Aborted", "AbortError");

      await preloadImages(
        this.people.map((p) => p.imageUrl),
        signal
      );

      if (signal.aborted) throw new DOMException("Aborted", "AbortError");

      this.sessionStartedAt = Date.now();
      this.renderMemorize();
      this.phase = "memorize";
      this.ui.showScreen("memorize");
      this.startTimerIfNeeded();
      announce(t("memorizeTitle"));
    } catch (err) {
      this.phase = "idle";
      if (isAbortError(err)) return;
      throw err;
    } finally {
      this.ui.setLoading(false);
    }
  }

  /** Replay with same settings and new faces/names. */
  async playAgain() {
    if (!this.settings) return;
    this.lastMistakes = [];
    await this.start(this.settings, { practiceMistakes: false });
  }

  /** Replay only the faces missed last round. */
  async practiceMistakes() {
    if (!this.settings || this.lastMistakes.length === 0) return;
    await this.start(this.settings, { practiceMistakes: true });
  }

  /** Stop any running timer and clear grids. */
  reset() {
    this.startAbort?.abort();
    this.startAbort = null;
    this.stopTimer();
    this.people = [];
    this.recallOrder = [];
    this.phase = "idle";
    this._grading = false;
    this.practiceMistakesMode = false;
    this.ui.memorizeGrid.innerHTML = "";
    this.ui.recallGrid.innerHTML = "";
    setVisible(this.ui.timerDisplay, false);
  }

  renderMemorize() {
    const { layout, namePosition } = this.settings;
    const grid = this.ui.memorizeGrid;
    grid.innerHTML = "";
    grid.className = `face-grid face-grid--${layout}`;

    for (const person of this.people) {
      grid.appendChild(
        this.createFaceCard(person, { showName: true, namePosition })
      );
    }
  }

  /**
   * Transition to recall phase.
   */
  goToRecall() {
    if (this.phase !== "memorize") return;
    this.stopTimer();
    setVisible(this.ui.timerDisplay, false);
    if (this.ui.timerProgress) {
      this.ui.timerProgress.style.width = "0%";
    }

    this.recallOrder = this.settings.shuffle
      ? shuffle(this.people)
      : [...this.people];

    this.renderRecall();
    this.phase = "recall";
    this.ui.showScreen("recall");
    announce(t("recallTitle"));

    // Focus first input for keyboard users
    requestAnimationFrame(() => {
      const first = this.ui.recallGrid.querySelector("[data-answer-for]");
      if (first instanceof HTMLElement) first.focus();
    });
  }

  renderRecall() {
    const { layout, inputMethod, hintsEnabled } = this.settings;
    const grid = this.ui.recallGrid;
    grid.innerHTML = "";
    grid.className = `face-grid face-grid--${layout}`;

    const nameOptions = shuffle(this.people.map((p) => p.name));

    for (const person of this.recallOrder) {
      const card = this.createFaceCard(person, {
        showName: false,
        inputMethod,
        nameOptions,
        hintsEnabled,
      });
      grid.appendChild(card);
    }
  }

  /**
   * @param {Person} person
   * @param {object} opts
   */
  createFaceCard(person, opts) {
    const {
      showName = false,
      namePosition = "under",
      inputMethod = "text",
      nameOptions = [],
      hintsEnabled = false,
    } = opts;

    const card = el("div", {
      className: `face-card face-card--name-${namePosition}`,
      attrs: {
        role: "listitem",
        "data-id": person.id,
      },
    });

    const imgWrap = el("div", { className: "face-card__image-wrap" });
    const fallback =
      person.fallbackUrl ||
      `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"/>')}`;
    const img = el("img", {
      className: "face-card__image",
      attrs: {
        src: person.imageUrl,
        alt: showName ? person.name : t("faceAlt"),
        loading: "eager",
        decoding: "async",
        width: "200",
        height: "200",
        draggable: "false",
      },
    });
    withImageFallback(/** @type {HTMLImageElement} */ (img), fallback);
    imgWrap.appendChild(img);

    if (showName) {
      const nameEl = el("div", {
        className: "face-card__name",
        text: person.name,
      });
      if (namePosition === "above") {
        card.appendChild(nameEl);
        card.appendChild(imgWrap);
      } else {
        card.appendChild(imgWrap);
        card.appendChild(nameEl);
      }
    } else {
      card.appendChild(imgWrap);
      const inputWrap = el("div", { className: "face-card__input-wrap" });

      if (hintsEnabled) {
        const hint = el("div", {
          className: "face-card__hint",
          text: t("hintLetter", { letter: person.name.charAt(0).toUpperCase() }),
        });
        inputWrap.appendChild(hint);
      }

      if (inputMethod === "dropdown") {
        const select = el("select", {
          className: "face-card__select",
          attrs: {
            "data-answer-for": person.id,
            "aria-label": t("selectName"),
          },
        });
        select.appendChild(
          el("option", {
            text: t("selectName"),
            attrs: { value: "" },
          })
        );
        for (const name of nameOptions) {
          select.appendChild(
            el("option", {
              text: name,
              attrs: { value: name },
            })
          );
        }
        inputWrap.appendChild(select);
      } else {
        const input = el("input", {
          className: "face-card__input",
          attrs: {
            type: "text",
            "data-answer-for": person.id,
            placeholder: t("typeName"),
            autocomplete: "off",
            autocorrect: "off",
            autocapitalize: "words",
            spellcheck: "false",
            enterkeyhint: "next",
            "aria-label": t("typeName"),
          },
        });
        inputWrap.appendChild(input);
      }

      card.appendChild(inputWrap);
    }

    return card;
  }

  /**
   * Grade answers and show results.
   * Briefly highlights cards green/red before switching screens.
   */
  checkAnswers() {
    if (this.phase !== "recall" || this._grading) return;
    this._grading = true;

    const answers = new Map();
    this.ui.recallGrid.querySelectorAll("[data-answer-for]").forEach((node) => {
      const id = node.getAttribute("data-answer-for");
      answers.set(id, /** @type {HTMLInputElement|HTMLSelectElement} */ (node).value ?? "");
      /** @type {HTMLInputElement|HTMLSelectElement} */ (node).disabled = true;
    });

    let correct = 0;
    /** @type {Array<{ person: Person, given: string }>} */
    const mistakes = [];

    for (const person of this.recallOrder) {
      const given = answers.get(person.id) ?? "";
      const ok = namesMatch(given, person.name);
      if (ok) correct++;
      else mistakes.push({ person, given });

      const card = this.ui.recallGrid.querySelector(
        `[data-id="${CSS.escape(person.id)}"]`
      );
      if (card) {
        card.classList.toggle("face-card--correct", ok);
        card.classList.toggle("face-card--wrong", !ok);
      }
    }

    const total = this.people.length;
    const percent = total ? Math.round((correct / total) * 100) : 0;
    const durationMs = Math.max(0, Date.now() - this.sessionStartedAt);

    this.lastMistakes = mistakes.map((m) => ({ ...m.person }));

    // Persist stats (skip aborted tiny sessions)
    if (this.settings && total > 0) {
      recordSession({
        correct,
        total,
        percent,
        durationMs,
        numPeople: total,
        regions: this.settings.regions,
        gender: this.settings.gender,
        inputMethod: this.settings.inputMethod,
        timed: this.settings.timerEnabled,
        practiceMistakes: this.practiceMistakesMode,
      });
      this.ui.onSessionComplete?.();
    }

    const checkBtn = document.getElementById("checkBtn");
    if (checkBtn) checkBtn.disabled = true;

    this.renderResults({ correct, total, percent, mistakes, durationMs });
    announce(t("resultsAnnounce", { percent, correct, total }), "assertive");

    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 100
      : 900;

    setTimeout(() => {
      this.phase = "results";
      this.ui.showScreen("results");
      if (checkBtn) checkBtn.disabled = false;
      this._grading = false;
      document.getElementById("playAgainBtn")?.focus();
    }, delay);
  }

  /**
   * @param {{ correct: number, total: number, percent: number, mistakes: Array<{ person: Person, given: string }>, durationMs?: number }} result
   */
  renderResults({ correct, total, percent, mistakes, durationMs = 0 }) {
    this.ui.scorePercent.textContent = String(percent);
    this.ui.scoreCorrect.textContent = String(correct);
    this.ui.scoreTotal.textContent = String(total);

    let msgKey = "scoreLow";
    if (percent === 100) msgKey = "scorePerfect";
    else if (percent >= 80) msgKey = "scoreGreat";
    else if (percent >= 60) msgKey = "scoreGood";
    else if (percent >= 40) msgKey = "scoreOk";
    this.ui.scoreMessage.textContent = t(msgKey);

    if (this.ui.sessionMeta) {
      const parts = [];
      if (durationMs > 0) {
        parts.push(t("sessionDuration", { time: formatTime(durationMs / 1000) }));
      }
      if (this.practiceMistakesMode) {
        parts.push(t("practiceModeBadge"));
      }
      this.ui.sessionMeta.textContent = parts.join(" · ");
      setVisible(this.ui.sessionMeta, parts.length > 0);
    }

    // Practice mistakes button
    if (this.ui.practiceMistakesBtn) {
      const canPractice = mistakes.length > 0;
      setVisible(this.ui.practiceMistakesBtn, canPractice);
      this.ui.practiceMistakesBtn.disabled = !canPractice;
      if (canPractice) {
        const label = this.ui.practiceMistakesBtn.querySelector("[data-i18n]");
        if (label) {
          label.textContent = t("practiceMistakes", { count: mistakes.length });
        }
      }
    }

    // Ring animation
    const circumference = 2 * Math.PI * 52;
    const ring = this.ui.scoreRingFg;
    if (ring) {
      ring.style.strokeDasharray = String(circumference);
      ring.style.strokeDashoffset = String(circumference);
      ring.classList.remove("ring-fg--good", "ring-fg--mid", "ring-fg--low");
      if (percent >= 80) ring.classList.add("ring-fg--good");
      else if (percent >= 40) ring.classList.add("ring-fg--mid");
      else ring.classList.add("ring-fg--low");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          ring.style.strokeDashoffset = String(
            circumference * (1 - percent / 100)
          );
        });
      });
    }

    // Mistakes list — build DOM safely (no unescaped injection)
    const section = this.ui.mistakesSection;
    const list = this.ui.mistakesList;
    list.innerHTML = "";

    if (mistakes.length === 0) {
      setVisible(section, false);
    } else {
      setVisible(section, true);
      for (const { person, given } of mistakes) {
        const item = el("li", { className: "mistake-item" });
        const img = el("img", {
          className: "mistake-item__img",
          attrs: {
            src: person.imageUrl,
            alt: "",
            width: "48",
            height: "48",
            loading: "lazy",
          },
        });
        withImageFallback(
          /** @type {HTMLImageElement} */ (img),
          person.fallbackUrl || person.imageUrl
        );

        const body = el("div", { className: "mistake-item__body" });
        body.appendChild(
          el("div", {
            className: "mistake-item__correct",
            text: person.name,
          })
        );
        const yours = el("div", { className: "mistake-item__yours" });
        yours.appendChild(document.createTextNode(`${t("youAnswered")}: `));
        yours.appendChild(
          el("span", {
            text: given.trim() || t("noAnswer"),
          })
        );
        body.appendChild(yours);

        item.appendChild(img);
        item.appendChild(body);
        item.appendChild(
          el("span", { className: "mistake-item__badge", text: t("wrong") })
        );
        list.appendChild(item);
      }
    }
  }

  startTimerIfNeeded() {
    const duration = getTimerDuration(this.settings);
    const showUi = this.settings.timerEnabled && this.settings.timerVisible;

    setVisible(this.ui.timerDisplay, showUi);
    this.ui.timerDisplay?.classList.remove("timer-display--urgent");
    if (this.ui.timerProgress) {
      this.ui.timerProgress.style.width = showUi ? "100%" : "0%";
      this.ui.timerProgress.parentElement?.classList.toggle("is-visible", showUi);
    }

    if (!this.settings.timerEnabled || duration <= 0) return;

    this.timerDuration = duration;
    this.timerEndsAt = Date.now() + duration * 1000;
    this.remainingSeconds = duration;
    this.updateTimerUI();

    // Timestamp-based interval resists drift / background throttling better than --1
    this.timerId = setInterval(() => {
      const left = Math.max(0, (this.timerEndsAt - Date.now()) / 1000);
      this.remainingSeconds = left;
      this.updateTimerUI();
      if (left <= 0) {
        this.stopTimer();
        this.goToRecall();
      }
    }, 200);
  }

  updateTimerUI() {
    if (this.ui.timerCountdown) {
      this.ui.timerCountdown.textContent = formatTime(this.remainingSeconds);
    }
    if (this.ui.timerProgress && this.timerDuration > 0) {
      const pct = Math.max(0, Math.min(100, (this.remainingSeconds / this.timerDuration) * 100));
      this.ui.timerProgress.style.width = `${pct}%`;
    }
    if (this.remainingSeconds <= 5 && this.remainingSeconds > 0) {
      this.ui.timerDisplay?.classList.add("timer-display--urgent");
    } else {
      this.ui.timerDisplay?.classList.remove("timer-display--urgent");
    }
  }

  stopTimer() {
    if (this.timerId != null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

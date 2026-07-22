import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  clamp,
  shuffle,
  sample,
  normalizeName,
  namesMatch,
  formatTime,
  formatDuration,
  escapeHtml,
  isAbortError,
} from "../js/utils.js";

describe("clamp", () => {
  it("clamps below min", () => assert.equal(clamp(-1, 0, 10), 0));
  it("clamps above max", () => assert.equal(clamp(99, 0, 10), 10));
  it("passes through mid", () => assert.equal(clamp(5, 0, 10), 5));
});

describe("shuffle", () => {
  it("returns same length and members", () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    assert.equal(out.length, input.length);
    assert.deepEqual([...out].sort(), [...input].sort());
    // original not mutated
    assert.deepEqual(input, [1, 2, 3, 4, 5]);
  });

  it("handles empty and single", () => {
    assert.deepEqual(shuffle([]), []);
    assert.deepEqual(shuffle([42]), [42]);
  });
});

describe("sample", () => {
  it("returns n items", () => {
    const out = sample([1, 2, 3, 4, 5], 3);
    assert.equal(out.length, 3);
  });
  it("returns all when n >= length", () => {
    assert.equal(sample([1, 2], 5).length, 2);
  });
  it("returns empty for n <= 0", () => {
    assert.deepEqual(sample([1, 2], 0), []);
  });
});

describe("normalizeName / namesMatch", () => {
  it("trims and lowercases", () => {
    assert.equal(normalizeName("  José  "), "jose");
  });
  it("collapses spaces", () => {
    assert.equal(normalizeName("Mary  Ann"), "mary ann");
  });
  it("matches diacritics-insensitive", () => {
    assert.equal(namesMatch("José", "jose"), true);
    assert.equal(namesMatch("François", "francois"), true);
  });
  it("rejects empty", () => {
    assert.equal(namesMatch("", ""), false);
    assert.equal(namesMatch("  ", "Bob"), false);
  });
  it("rejects mismatch", () => {
    assert.equal(namesMatch("Anna", "Anne"), false);
  });
});

describe("formatTime", () => {
  it("formats M:SS", () => {
    assert.equal(formatTime(0), "0:00");
    assert.equal(formatTime(5), "0:05");
    assert.equal(formatTime(65), "1:05");
    assert.equal(formatTime(600), "10:00");
  });
  it("ceils fractions", () => {
    assert.equal(formatTime(1.2), "0:02");
  });
});

describe("formatDuration", () => {
  it("formats seconds and minutes", () => {
    assert.equal(formatDuration(4500), "5s");
    assert.equal(formatDuration(65000), "1m 5s");
    assert.equal(formatDuration(120000), "2m");
  });
});

describe("escapeHtml", () => {
  it("escapes specials", () => {
    assert.equal(
      escapeHtml(`<img src="x" onerror='alert(1)'>`),
      "&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt;"
    );
  });
});

describe("isAbortError", () => {
  it("detects DOMException AbortError", () => {
    assert.equal(isAbortError(new DOMException("Aborted", "AbortError")), true);
  });
  it("detects Error with name", () => {
    const e = new Error("x");
    e.name = "AbortError";
    assert.equal(isAbortError(e), true);
  });
  it("rejects other errors", () => {
    assert.equal(isAbortError(new Error("fail")), false);
    assert.equal(isAbortError(null), false);
  });
});

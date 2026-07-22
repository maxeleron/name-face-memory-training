/**
 * Runs before the app module to avoid theme flash.
 * Kept separate so CSP can allow scripts without 'unsafe-inline'.
 */
try {
  const raw = localStorage.getItem("nfmt-theme");
  let theme = raw ? JSON.parse(raw) : null;
  if (theme !== "light" && theme !== "dark") {
    theme = matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }
  document.documentElement.setAttribute("data-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "light" ? "#f4f6fa" : "#0c1017");
  }
} catch {
  /* ignore */
}

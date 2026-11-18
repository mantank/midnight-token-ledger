"use strict";
(() => {
  const key = "token-ledger.theme";
  const root = document.documentElement;

  function apply(value) {
    const light = value === "light";
    root.dataset.theme = light ? "light" : "dark";
    document.querySelector('meta[name="theme-color"]').content = light ? "#F5F7F9" : "#0B0F17";
    const button = document.getElementById("theme-toggle");
    if (button) {
      const label = light ? "切换到深色主题" : "切换到浅色主题";
      button.title = label;
      button.setAttribute("aria-label", label);
      button.querySelector(".mode-icon").textContent = light ? "☾" : "☀";
      button.querySelector(".mode-label").textContent = light ? "深色" : "浅色";
    }
    window.dispatchEvent(new Event("themechange"));
  }

  function restore() {
    try { apply(localStorage.getItem(key)); }
    catch { apply(root.dataset.theme); }
  }

  restore();
  document.addEventListener("DOMContentLoaded", () => {
    apply(root.dataset.theme);
    document.getElementById("theme-toggle").addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      apply(next);
      try { localStorage.setItem(key, next); } catch { /* Session-only in private file viewers. */ }
    });
  });
  window.addEventListener("storage", event => {
    if (event.key === key || event.key === null) restore();
  });
  window.addEventListener("pageshow", event => { if (event.persisted) restore(); });
})();

import { claimMastElement } from "./shared.js";
function initA11yHelpers() {
  document.querySelectorAll("[data-footer-year]").forEach((el) => {
    if (!claimMastElement(el, "footerYear")) return;
    const year = String(/* @__PURE__ */ new Date().getFullYear());
    if (el.textContent !== year) el.textContent = year;
  });
  document.querySelectorAll(".nav-skip-link").forEach((link) => {
    if (!claimMastElement(link, "skipLink")) return;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector("main");
      if (!target) return;
      target.setAttribute("tabindex", "-1");
      target.focus();
    });
  });
}
export { initA11yHelpers };

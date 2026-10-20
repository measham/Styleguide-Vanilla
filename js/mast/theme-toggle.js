import { claimMastElement } from "./shared.js";
const readSavedTheme = () => {
  try {
    return localStorage.getItem("savedTheme");
  } catch {
    return null;
  }
};
let started = false;
let isLight = true;
const toggleInstances = [];
function applyMode(light) {
  const docEl = document.documentElement;
  docEl.classList.toggle("u-mode-light", light);
  docEl.classList.toggle("u-mode-dark", !light);
}
function updateLabels(light, darkLabel, lightLabel) {
  if (darkLabel && lightLabel) {
    darkLabel.style.display = light ? "none" : "block";
    lightLabel.style.display = light ? "block" : "none";
  }
}
function syncToggle(instance, light) {
  instance.checkbox.checked = light;
  updateLabels(light, instance.darkLabel, instance.lightLabel);
}
function syncAllToggles(light) {
  for (let i = toggleInstances.length - 1; i >= 0; i--) {
    if (!toggleInstances[i].checkbox.isConnected) toggleInstances.splice(i, 1);
  }
  toggleInstances.forEach((instance) => syncToggle(instance, light));
}
function start() {
  started = true;
  const savedTheme = readSavedTheme();
  const prefersColorScheme = window.matchMedia("(prefers-color-scheme: dark)");
  isLight = savedTheme !== null ? savedTheme === "light" : !prefersColorScheme.matches;
  applyMode(isLight);
  prefersColorScheme.addEventListener("change", (e) => {
    if (readSavedTheme() !== null) return;
    isLight = !e.matches;
    applyMode(isLight);
    syncAllToggles(isLight);
  });
}
function initThemeToggle() {
  if (!started) start();
  document.querySelectorAll('[data-theme-toggle="checkbox"]').forEach((checkbox) => {
    if (!claimMastElement(checkbox, "themeToggle")) return;
    const instance = {
      checkbox,
      darkLabel: checkbox.parentElement?.querySelector('[data-theme-toggle="dark-label"]') ?? null,
      lightLabel: checkbox.parentElement?.querySelector('[data-theme-toggle="light-label"]') ?? null,
    };
    toggleInstances.push(instance);
    syncToggle(instance, isLight);
    checkbox.addEventListener("change", () => {
      isLight = checkbox.checked;
      applyMode(isLight);
      try {
        localStorage.setItem("savedTheme", isLight ? "light" : "dark");
      } catch {}
      syncAllToggles(isLight);
    });
  });
}
export { initThemeToggle };

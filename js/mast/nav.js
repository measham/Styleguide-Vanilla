import { claimMastElement, onMastGlobal } from "./shared.js";
let navUid = 0;
const navDropdownSetups = /* @__PURE__ */ new WeakMap();
function initNav() {
  const navs = document.querySelectorAll(".nav");
  if (!navs.length) return;
  navs.forEach((nav) => {
    if (claimMastElement(nav, "nav")) {
      setupNav(nav);
    } else {
      navDropdownSetups.get(nav)?.();
    }
  });
}
function setupNav(nav) {
  const menuBtn = nav.querySelector(".nav-menu_btn");
  const menu = nav.querySelector(".nav-menu");
  const setMenuState = (open) => {
    menuBtn?.setAttribute("aria-expanded", String(open));
    menuBtn?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  if (menuBtn) {
    if (menu) {
      if (!menu.id) menu.id = `mast-nav-menu-${++navUid}`;
      menuBtn.setAttribute("aria-controls", menu.id);
    }
    setMenuState(false);
    menuBtn.addEventListener("click", () => {
      setMenuState(nav.classList.toggle("cc-open"));
    });
  }
  const dropdowns = () => nav.querySelectorAll(".nav-dropdown");
  function closeDropdowns(except) {
    dropdowns().forEach((dropdown) => {
      if (dropdown === except) return;
      dropdown.classList.remove("cc-open");
      dropdown.querySelector(".cc-dropdown-btn")?.setAttribute("aria-expanded", "false");
    });
  }
  const setupDropdowns = () => {
    dropdowns().forEach((dropdown) => {
      const toggle = dropdown.querySelector(".cc-dropdown-btn");
      if (!toggle) return;
      if (!claimMastElement(dropdown, "navDropdown")) return;
      toggle.setAttribute("aria-haspopup", "true");
      toggle.setAttribute("aria-expanded", "false");
      toggle.addEventListener("click", (e) => {
        e.preventDefault();
        const open = dropdown.classList.toggle("cc-open");
        toggle.setAttribute("aria-expanded", String(open));
        closeDropdowns(dropdown);
      });
    });
  };
  setupDropdowns();
  navDropdownSetups.set(nav, setupDropdowns);
  onMastGlobal("document", "click", nav, (e) => {
    if (!(e.target instanceof Node) || !nav.contains(e.target)) {
      closeDropdowns();
    }
  });
  onMastGlobal("document", "keydown", nav, (e) => {
    if (e.key !== "Escape") return;
    closeDropdowns();
    if (nav.classList.contains("cc-open")) {
      nav.classList.remove("cc-open");
      setMenuState(false);
      menuBtn?.focus();
    }
  });
}
export { initNav };

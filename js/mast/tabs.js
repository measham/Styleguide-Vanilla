import { claimMastElement, onMastGlobal } from "./shared.js";
function initTabs() {
  const components = document.querySelectorAll("[data-tabs-component]");
  if (!components.length) return;
  components.forEach((component) => {
    if (component.dataset.mastTabs === "ready") return;
    initTabsComponent(component);
  });
}
let uid = 0;
const isMobileViewport = () => window.matchMedia("(max-width: 47.9375rem)").matches;
function initTabsComponent(component) {
  const tabMenu = component.querySelector("[data-tabs-menu]");
  const dropdownMenu = component.querySelector("[data-tabs-menu-dropdown-menu]");
  const tabMenuWrapper = component.querySelector("[data-tabs-menu-wrapper]");
  const tabLinks = component.querySelectorAll("[data-tabs-link]");
  const tabPanes = component.querySelectorAll("[data-tabs-pane]");
  if (!tabMenu || !dropdownMenu || !tabMenuWrapper || !tabLinks.length || !tabPanes.length) {
    return;
  }
  claimMastElement(component, "tabs");
  const tabLinksArray = Array.from(tabLinks);
  const tabPanesArray = Array.from(tabPanes);
  const componentId = ++uid;
  tabLinksArray.forEach((link, i) => {
    const button = link.querySelector("[data-tabs-link-button]");
    const pane = tabPanesArray[i];
    if (!button || !pane) return;
    link.removeAttribute("role");
    link.removeAttribute("aria-selected");
    button.setAttribute("role", "tab");
    if (!button.id) button.id = `mast-tabs-${componentId}-tab-${i}`;
    if (!pane.id) pane.id = `mast-tabs-${componentId}-pane-${i}`;
    button.setAttribute("aria-controls", pane.id);
    pane.setAttribute("aria-labelledby", button.id);
  });
  let currentActiveIndex = 0;
  const dropdownToggle = tabMenu.querySelector("[data-tabs-menu-dropdown-toggle]");
  const dropdownText = dropdownToggle?.querySelector("[data-tabs-menu-dropdown-text]") ?? null;
  const isMobileDropdown = tabMenu.getAttribute("data-tab-mobile-dropdown") === "true";
  const autoplayToggleButton = component.querySelector("[data-tabs-autoplay-toggle]");
  const autoplayEnabled =
    tabMenu.getAttribute("data-tabs-autoplay") === "true" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const autoplayDuration = parseFloat(tabMenu.getAttribute("data-tabs-autoplay-duration") ?? "") || 5;
  const autoplayHoverPause = tabMenu.getAttribute("data-tabs-autoplay-hover-pause") === "true";
  let autoplayTimer = null;
  let isAutoplayPaused = false;
  let isUserPaused = false;
  let autoplayStartTime = null;
  let autoplayElapsedTime = 0;
  function setActiveTab(index) {
    if (index < 0 || index >= tabLinksArray.length) return;
    tabLinksArray.forEach((link, i) => {
      const isActive = i === index;
      link.classList.toggle("cc-active", isActive);
      const button = link.querySelector("[data-tabs-link-button]");
      button?.setAttribute("aria-selected", String(isActive));
      button?.setAttribute("tabindex", isActive ? "0" : "-1");
    });
    tabPanesArray.forEach((pane, i) => {
      const isActive = i === index;
      pane.setAttribute("aria-hidden", String(!isActive));
      if (isActive) {
        pane.setAttribute("tabindex", "0");
      } else {
        pane.removeAttribute("tabindex");
      }
    });
    currentActiveIndex = index;
    if (dropdownText && isMobileDropdown) {
      const activeLink = tabLinksArray[index];
      dropdownText.textContent = activeLink.getAttribute("data-tab-link-name") || activeLink.textContent;
    }
    if (dropdownToggle && dropdownMenu.classList.contains("cc-open")) {
      closeDropdown();
    }
    if (!isMobileDropdown) {
      const activeLink = tabLinksArray[index];
      const scrollContainer = tabMenuWrapper;
      const containerLeft = scrollContainer.scrollLeft;
      const containerWidth = scrollContainer.clientWidth;
      const tabLeft = activeLink.offsetLeft;
      const tabWidth = activeLink.offsetWidth;
      if (tabLeft < containerLeft || tabLeft + tabWidth > containerLeft + containerWidth) {
        scrollContainer.scrollTo({ left: tabLeft, behavior: "smooth" });
      }
    }
    if (autoplayEnabled) {
      if (isAutoplayPaused) {
        autoplayElapsedTime = 0;
      } else {
        restartAutoplay();
      }
    }
  }
  function openDropdown() {
    if (!dropdownToggle || !dropdownMenu) return;
    dropdownMenu.classList.add("cc-open");
    dropdownToggle.classList.add("cc-open");
    dropdownToggle.setAttribute("aria-expanded", "true");
  }
  function closeDropdown() {
    if (!dropdownToggle || !dropdownMenu) return;
    dropdownMenu.classList.remove("cc-open");
    dropdownToggle.classList.remove("cc-open");
    dropdownToggle.setAttribute("aria-expanded", "false");
  }
  function toggleDropdown() {
    if (dropdownMenu.classList.contains("cc-open")) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }
  function setupMobileDropdown() {
    if (!isMobileDropdown || !dropdownToggle) return;
    dropdownToggle.setAttribute("aria-haspopup", "true");
    dropdownToggle.setAttribute("aria-expanded", "false");
    if (!dropdownMenu.id) {
      dropdownMenu.id = `mast-tabs-${componentId}-dropdown`;
    }
    dropdownToggle.setAttribute("aria-controls", dropdownMenu.id);
    const activeLink = component.querySelector("[data-tabs-link].cc-active") || tabLinksArray[0];
    if (dropdownText && activeLink) {
      dropdownText.textContent = activeLink.getAttribute("data-tab-link-name") || activeLink.textContent;
    }
    dropdownToggle.addEventListener("click", () => {
      toggleDropdown();
    });
    onMastGlobal("document", "click", component, (e) => {
      if (e.target instanceof Node && !component.contains(e.target)) {
        closeDropdown();
      }
    });
    onMastGlobal("document", "keydown", component, (e) => {
      if (e.key === "Escape" && dropdownMenu.classList.contains("cc-open")) {
        closeDropdown();
        dropdownToggle.focus();
      }
    });
  }
  function startAutoplay() {
    if (!autoplayEnabled || isAutoplayPaused) return;
    stopAutoplay();
    const remainingTime = autoplayDuration * 1e3 - autoplayElapsedTime;
    autoplayStartTime = Date.now();
    autoplayTimer = setTimeout(() => {
      setActiveTab((currentActiveIndex + 1) % tabLinksArray.length);
    }, remainingTime);
  }
  function stopAutoplay() {
    if (autoplayTimer) {
      clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }
    autoplayStartTime = null;
  }
  function restartAutoplay() {
    if (!autoplayEnabled) return;
    autoplayElapsedTime = 0;
    const activeLink = tabLinksArray[currentActiveIndex];
    const progressBar = activeLink.querySelector("[data-tabs-autoplay-progress]");
    if (progressBar) {
      progressBar.style.animation = "none";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          progressBar.style.animation = "";
        });
      });
    }
    startAutoplay();
  }
  function updateToggleButton() {
    autoplayToggleButton?.setAttribute("aria-label", isAutoplayPaused ? "Play autoplay" : "Pause autoplay");
  }
  function pauseAutoplay() {
    if (!autoplayEnabled) return;
    if (autoplayStartTime !== null) {
      autoplayElapsedTime += Date.now() - autoplayStartTime;
    }
    isAutoplayPaused = true;
    component.classList.add("autoplay-paused");
    stopAutoplay();
    updateToggleButton();
  }
  function resumeAutoplay() {
    if (!autoplayEnabled || isUserPaused) return;
    isAutoplayPaused = false;
    component.classList.remove("autoplay-paused");
    startAutoplay();
    updateToggleButton();
  }
  function setupAutoplayObserver() {
    if (!autoplayEnabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            resumeAutoplay();
          } else {
            pauseAutoplay();
          }
        });
      },
      { threshold: 0.5 },
    );
    observer.observe(component);
  }
  function setupAutoplayHoverPause() {
    if (!autoplayEnabled || !autoplayHoverPause) return;
    component.addEventListener("mouseenter", pauseAutoplay);
    component.addEventListener("mouseleave", resumeAutoplay);
  }
  function setupAutoplayToggle() {
    if (!autoplayEnabled || !autoplayToggleButton) return;
    autoplayToggleButton.addEventListener("click", () => {
      if (isAutoplayPaused) {
        isUserPaused = false;
        resumeAutoplay();
      } else {
        isUserPaused = true;
        pauseAutoplay();
      }
    });
  }
  function findInitialActiveIndex() {
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      const matchIndex = tabLinksArray.findIndex((link) => link.id === hash);
      if (matchIndex !== -1) return matchIndex;
    }
    const customActiveIndex = tabLinksArray.findIndex((link) => link.classList.contains("cc-active"));
    if (customActiveIndex !== -1) return customActiveIndex;
    return 0;
  }
  function setupKeyboardNav() {
    const tabLinksLength = tabLinksArray.length;
    tabLinksArray.forEach((link) => {
      const overlay = link.querySelector("[data-tabs-link-button]");
      if (!overlay) return;
      overlay.addEventListener("keydown", (e) => {
        let newIndex = currentActiveIndex;
        switch (e.key) {
          case "ArrowLeft":
          case "ArrowUp":
            e.preventDefault();
            newIndex = currentActiveIndex > 0 ? currentActiveIndex - 1 : tabLinksLength - 1;
            break;
          case "ArrowRight":
          case "ArrowDown":
            e.preventDefault();
            newIndex = currentActiveIndex < tabLinksLength - 1 ? currentActiveIndex + 1 : 0;
            break;
          case "Home":
            e.preventDefault();
            newIndex = 0;
            break;
          case "End":
            e.preventDefault();
            newIndex = tabLinksLength - 1;
            break;
          default:
            return;
        }
        setActiveTab(newIndex);
        tabLinksArray[newIndex]?.querySelector("[data-tabs-link-button]")?.focus();
      });
    });
  }
  function setupClickHandlers() {
    tabLinksArray.forEach((link, index) => {
      const overlay = link.querySelector("[data-tabs-link-button]");
      if (!overlay) return;
      overlay.addEventListener("click", (e) => {
        e.preventDefault();
        setActiveTab(index);
        if (isMobileViewport() && !isMobileDropdown) {
          link.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      });
    });
  }
  setupMobileDropdown();
  if (autoplayEnabled) {
    component.style.setProperty("--autoplay-duration", `${autoplayDuration}s`);
  }
  setupAutoplayObserver();
  setupAutoplayHoverPause();
  setupAutoplayToggle();
  setActiveTab(findInitialActiveIndex());
  setupClickHandlers();
  setupKeyboardNav();
  if (autoplayEnabled) {
    startAutoplay();
  }
  onMastGlobal("window", "hashchange", component, () => {
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      const matchIndex = tabLinksArray.findIndex((link) => link.id === hash);
      if (matchIndex !== -1) {
        setActiveTab(matchIndex);
      }
    }
  });
}
export { initTabs };

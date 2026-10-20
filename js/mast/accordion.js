import { claimMastElement } from "./shared.js";
let styleInjected = false;
let motionWatched = false;
let prefersReducedMotion = false;
const animTimers = /* @__PURE__ */ new WeakMap();
const setAnimTimer = (elem, fn) => {
  clearTimeout(animTimers.get(elem));
  animTimers.set(elem, setTimeout(fn, 400));
};
function setupOnce() {
  if (!styleInjected) {
    styleInjected = true;
    const style = document.createElement("style");
    style.textContent =
      "details[data-accordion-animating]::details-content{content-visibility:visible!important;display:block!important;}";
    document.head.appendChild(style);
  }
  if (!motionWatched) {
    motionWatched = true;
    try {
      const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      prefersReducedMotion = reducedMotionQuery.matches;
      reducedMotionQuery.addEventListener("change", (e) => {
        prefersReducedMotion = e.matches;
      });
    } catch {
      prefersReducedMotion = false;
    }
  }
}
function setupAccordion(details, summary, content) {
  if (details.hasAttribute("open") && details.getAttribute("data-accordion-start-open") !== "true") {
    details.removeAttribute("open");
  }
  if (details.getAttribute("data-accordion-start-open") !== "true") {
    content.style.height = "0px";
    content.style.overflow = "clip";
  }
  summary.addEventListener("click", (event) => {
    const isClosing = details.hasAttribute("open");
    if (isClosing) {
      event.preventDefault();
      if (prefersReducedMotion) {
        details.removeAttribute("open");
      } else {
        content.style.height = `${content.scrollHeight}px`;
        void content.offsetHeight;
        content.style.transition = "height 0.4s ease-in-out";
        content.style.height = "0px";
        setAnimTimer(content, () => {
          details.removeAttribute("open");
          content.style.transition = "";
        });
      }
    } else {
      const groupName = details.getAttribute("name");
      if (groupName && !prefersReducedMotion) {
        const siblings = document.querySelectorAll(`details[name="${groupName}"][open]`);
        siblings.forEach((sib) => {
          if (sib === details) return;
          const sibContent = sib.querySelector("[data-accordion='content']");
          if (!sibContent) return;
          sibContent.style.height = `${sibContent.scrollHeight}px`;
          sibContent.style.overflow = "clip";
          sibContent.style.display = "block";
          sib.dataset.accordionAnimating = "closing";
          void sibContent.offsetHeight;
          sibContent.style.transition = "height 0.4s ease-in-out";
          sibContent.style.height = "0px";
          setAnimTimer(sibContent, () => {
            delete sib.dataset.accordionAnimating;
            sibContent.style.transition = "";
            sibContent.style.display = "";
          });
        });
      }
    }
  });
  details.addEventListener("toggle", () => {
    if (!details.open) return;
    const fullHeight = content.scrollHeight;
    if (prefersReducedMotion) {
      content.style.height = "auto";
    } else {
      content.style.transition = "height 0.4s ease-out";
      content.style.height = `${fullHeight}px`;
      setAnimTimer(content, () => {
        content.style.height = "auto";
        content.style.transition = "";
      });
    }
  });
}
function initAccordions() {
  const detailsElements = document.querySelectorAll("details");
  if (detailsElements.length === 0) return;
  detailsElements.forEach((details) => {
    if (details.dataset.mastAccordion === "ready") return;
    const summary = details.querySelector("summary");
    const content = details.querySelector("[data-accordion='content']");
    if (!summary || !content) return;
    claimMastElement(details, "accordion");
    setupOnce();
    setupAccordion(details, summary, content);
  });
}
export { initAccordions };

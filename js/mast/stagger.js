import { claimMastElement } from "./shared.js";
let observer = null;
const reveal = (element) => {
  Array.from(element.children).forEach((child, index) => {
    child.style.setProperty("--stagger-delay", `${0.1 + index * 0.1}s`);
  });
  element.classList.add("is-animated");
};
function initStaggerAnimations() {
  const elements = Array.from(document.querySelectorAll('[data-animate="stagger-children"]')).filter((element) =>
    claimMastElement(element, "stagger"),
  );
  if (!elements.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elements.forEach((element) => element.classList.add("is-animated"));
    return;
  }
  observer ??= new IntersectionObserver(
    (entries, self) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          self.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -5% 0px" },
  );
  elements.forEach((element) => observer.observe(element));
}
export { initStaggerAnimations };

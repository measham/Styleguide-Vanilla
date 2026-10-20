import { initA11yHelpers } from "./a11y.js";
import { initAccordions } from "./accordion.js";
import { initInlineVideos } from "./inline-video.js";
import { initModals } from "./modal.js";
import { initNav } from "./nav.js";
import { initSliders } from "./slider.js";
import { initStaggerAnimations } from "./stagger.js";
import { initTabs } from "./tabs.js";
import { initThemeToggle } from "./theme-toggle.js";
function initMast() {
  const inits = [
    initThemeToggle,
    initNav,
    initAccordions,
    initModals,
    initTabs,
    initSliders,
    initInlineVideos,
    initStaggerAnimations,
    initA11yHelpers,
  ];
  for (const init of inits) {
    try {
      init();
    } catch (error) {
      console.error(`[mast] ${init.name} failed:`, error);
    }
  }
}
export { initMast };

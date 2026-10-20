/**
 * Mast's behaviours — accordions, modals, tabs, sliders, the nav, the theme
 * toggle, scroll animations — set up on the page, and again on whatever is
 * drawn into it afterwards (an edit in Sitefold Studio, or your own script).
 * Each part sets up an element once, so running them again is safe.
 */
import { initMast } from "./mast/index.js"
import "./styleguide-nav.js"

let queued = 0
const soon = () => {
  if (queued) return
  queued = requestAnimationFrame(() => {
    queued = 0
    initMast()
  })
}

initMast()
new MutationObserver(soon).observe(document.body, { childList: true, subtree: true })

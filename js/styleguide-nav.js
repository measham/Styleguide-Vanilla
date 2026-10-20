/**
 * The style-guide pages' own nav — not part of Mast: the menu button opens
 * and closes the section links on a small screen, and a link chosen closes
 * them again.
 */
document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null
  const nav = target?.closest(".styles__nav")
  if (!nav) return
  const button = nav.querySelector(".styles__nav-btn")
  const opening = target.closest(".styles__nav-btn") ? !nav.classList.contains("cc-open") : target.closest(".styles__nav-link") ? false : null
  if (opening === null) return
  nav.classList.toggle("cc-open", opening)
  button?.classList.toggle("cc-open", opening)
  button?.setAttribute("aria-expanded", String(opening))
})

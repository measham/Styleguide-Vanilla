import { onMastGlobal } from "./shared.js";
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function initSliders() {
  document.querySelectorAll('[data-slider="slider"]').forEach((el) => {
    if (!el.dataset.sliderReady) {
      el.dataset.sliderReady = "true";
      createSlider(el);
    }
  });
}
function createSlider(el) {
  const wrapper = el.querySelector(".swiper-wrapper");
  if (!wrapper) return;
  const slides = Array.from(wrapper.querySelectorAll(".swiper-slide"));
  if (slides.length === 0) return;
  const component = el.closest('[data-slider="component"]') ?? el;
  const speed = parseInt(el.dataset.speed ?? "") || 300;
  const autoplayDelay = parseInt(el.dataset.autoplay ?? "") || 0;
  const isFade = el.dataset.effect === "fade";
  el.style.setProperty("--slider-speed", `${speed}ms`);
  setupA11y(el, slides);
  const controls = isFade ? createFadeEngine(el, slides) : createScrollEngine(el, wrapper, slides);
  if (!controls) return;
  setupNav(component, controls);
  setupPagination(component, wrapper, controls);
  setupKeyboard(el, controls);
  if (autoplayDelay > 0 && !reducedMotion()) {
    setupAutoplay(el, wrapper, controls, autoplayDelay);
  }
}
function setupA11y(el, slides) {
  el.setAttribute("role", "region");
  el.setAttribute("aria-roledescription", "carousel");
  if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", "Slider");
  slides.forEach((slide, i) => {
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "slide");
    slide.setAttribute("aria-label", `${i + 1} of ${slides.length}`);
  });
}
function setupNav(component, controls) {
  const prevEl = component.querySelector('[data-slider="previous"]');
  const nextEl = component.querySelector('[data-slider="next"]');
  prevEl?.addEventListener("click", () => controls.prev());
  nextEl?.addEventListener("click", () => controls.next());
  const update = () => {
    const count = controls.count();
    const current = controls.current();
    const bounded = count > 0;
    const atStart = bounded && current <= 0;
    const atEnd = bounded && current >= count - 1;
    prevEl?.classList.toggle("swiper-button-disabled", atStart);
    nextEl?.classList.toggle("swiper-button-disabled", atEnd);
    prevEl?.toggleAttribute("disabled", atStart);
    nextEl?.toggleAttribute("disabled", atEnd);
  };
  component.addEventListener("mast-slider:change", update);
  update();
}
function setupPagination(component, wrapper, controls) {
  const paginationEl = component.querySelector('[data-slider="pagination"]');
  if (!paginationEl) return;
  if (!wrapper.hasAttribute("aria-live")) {
    wrapper.setAttribute("aria-live", "polite");
  }
  let bullets = [];
  const render = (pageCount) => {
    paginationEl.innerHTML = "";
    bullets = [];
    for (let i = 0; i < pageCount; i++) {
      const bullet = document.createElement("button");
      bullet.type = "button";
      bullet.className = "slider-pagination_button";
      bullet.setAttribute("aria-label", `Go to slide ${i + 1}`);
      bullet.addEventListener("click", () => controls.goTo(i));
      paginationEl.appendChild(bullet);
      bullets.push(bullet);
    }
  };
  const update = () => {
    const pageCount = Math.abs(controls.count());
    if (pageCount !== bullets.length) render(pageCount);
    const active = ((controls.current() % pageCount) + pageCount) % pageCount;
    bullets.forEach((bullet, i) => {
      bullet.classList.toggle("cc-active", i === active);
      if (i === active) {
        bullet.setAttribute("aria-current", "true");
      } else {
        bullet.removeAttribute("aria-current");
      }
    });
  };
  component.addEventListener("mast-slider:change", update);
  update();
}
function setupKeyboard(el, controls) {
  if (el.tabIndex < 0) el.tabIndex = 0;
  el.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      controls.prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      controls.next();
    }
  });
}
function setupAutoplay(el, wrapper, controls, delay) {
  let timer = null;
  let hovered = false;
  let inView = true;
  const setLive = () => wrapper.setAttribute("aria-live", timer ? "off" : "polite");
  const advance = () => {
    const count = controls.count();
    if (count > 0 && controls.current() >= count - 1) {
      controls.goTo(0);
    } else {
      controls.next();
    }
  };
  const start = () => {
    if (timer || hovered || !inView || document.hidden) return;
    timer = setInterval(advance, delay);
    setLive();
  };
  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
    setLive();
  };
  const restart = () => {
    stop();
    start();
  };
  el.addEventListener("mouseenter", () => {
    hovered = true;
    stop();
  });
  el.addEventListener("mouseleave", () => {
    hovered = false;
    start();
  });
  el.addEventListener("focusin", () => {
    hovered = true;
    stop();
  });
  el.addEventListener("focusout", (e) => {
    if (e.relatedTarget instanceof Node && el.contains(e.relatedTarget)) return;
    hovered = false;
    start();
  });
  el.closest('[data-slider="component"]')?.addEventListener("mast-slider:change", () => {
    if (timer) restart();
  });
  new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        inView = entry.isIntersecting;
        if (inView) {
          start();
        } else {
          stop();
        }
      });
    },
    { threshold: 0.5 },
  ).observe(el);
  onMastGlobal("document", "visibilitychange", el, () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });
  start();
}
function emitChange(el) {
  el.dispatchEvent(new CustomEvent("mast-slider:change", { bubbles: true }));
}
function createScrollEngine(el, wrapper, realSlides) {
  const loop = el.dataset.loop === "true";
  const centered = el.dataset.centered === "true";
  const speed = parseInt(el.dataset.speed ?? "") || 300;
  const realCount = realSlides.length;
  let leadingClones = 0;
  if (loop) {
    const styles = getComputedStyle(el.closest('[data-slider="component"]') ?? el);
    const maxPerView = Math.max(
      ...["--xs", "--sm", "--md", "--lg"].map((v) => parseFloat(styles.getPropertyValue(v)) || 1),
    );
    const extra = parseInt(el.dataset.loopAdditionalSlides ?? "") || 0;
    leadingClones = Math.min(realCount, Math.ceil(maxPerView) + extra);
    for (let i = 0; i < leadingClones; i++) {
      const head = cloneSlide(realSlides[i]);
      const tail = cloneSlide(realSlides[realCount - 1 - i]);
      wrapper.appendChild(head);
      wrapper.insertBefore(tail, wrapper.firstChild);
    }
  }
  const allSlides = () => Array.from(wrapper.querySelectorAll(".swiper-slide"));
  const maxScroll = () => el.scrollWidth - el.clientWidth;
  let positionsCache = null;
  const positions = () => {
    if (positionsCache) return positionsCache;
    const rect = el.getBoundingClientRect();
    const max = maxScroll();
    let place;
    if (centered) {
      const center = rect.left + el.clientWidth / 2;
      place = (s) => s.left + s.width / 2 - center;
    } else {
      const origin = rect.left + (parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0);
      place = (s) => s.left - origin;
    }
    positionsCache = allSlides().map((s) =>
      Math.max(0, Math.min(el.scrollLeft + place(s.getBoundingClientRect()), max)),
    );
    requestAnimationFrame(() => {
      positionsCache = null;
    });
    return positionsCache;
  };
  const nearestIndex = (scrollLeft) => {
    const pos = positions();
    let best = 0;
    pos.forEach((p, i) => {
      if (Math.abs(p - scrollLeft) < Math.abs(pos[best] - scrollLeft)) best = i;
    });
    return best;
  };
  const pageCount = () => {
    if (loop) return realCount;
    const pos = positions();
    return Math.max(1, pos.filter((p, i) => i === 0 || p - pos[i - 1] > 1).length);
  };
  const currentIndex = () => {
    const raw = nearestIndex(el.scrollLeft);
    return loop ? raw - leadingClones : raw;
  };
  let animation = null;
  const scrollTo = (target, instant) => {
    if (animation) cancelAnimationFrame(animation);
    target = Math.max(0, Math.min(target, maxScroll()));
    if (instant || reducedMotion()) {
      el.classList.add("cc-free-scroll");
      el.scrollLeft = target;
      requestAnimationFrame(() => el.classList.remove("cc-free-scroll"));
      return;
    }
    const from = el.scrollLeft;
    const startTime = performance.now();
    el.classList.add("cc-free-scroll");
    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / speed);
      const ease = 1 - Math.pow(1 - t, 3);
      el.scrollLeft = from + (target - from) * ease;
      if (t < 1) {
        animation = requestAnimationFrame(tick);
      } else {
        animation = null;
        el.classList.remove("cc-free-scroll");
      }
    };
    animation = requestAnimationFrame(tick);
  };
  const goTo = (index, instant = false) => {
    const pos = positions();
    if (loop) {
      settleLoop(true);
      const cur = currentIndex();
      const target = index === cur + 1 || index === cur - 1 ? index : ((index % realCount) + realCount) % realCount;
      scrollTo(pos[leadingClones + target] ?? 0, instant);
    } else {
      scrollTo(pos[Math.max(0, Math.min(index, pos.length - 1))] ?? 0, instant);
    }
  };
  const settleLoop = (force = false) => {
    if (!loop) return;
    if (animation && !force) return;
    if (el.classList.contains("cc-dragging")) return;
    const idx = currentIndex();
    if (idx < 0 || idx >= realCount) {
      const bounded = ((idx % realCount) + realCount) % realCount;
      el.classList.add("cc-free-scroll");
      el.scrollLeft = positions()[leadingClones + bounded] ?? 0;
      requestAnimationFrame(() => el.classList.remove("cc-free-scroll"));
    }
  };
  let settleTimer;
  const onSettle = () => {
    settleLoop();
    emitChange(el);
  };
  el.addEventListener("scroll", () => {
    emitChange(el);
    clearTimeout(settleTimer);
    settleTimer = setTimeout(onSettle, 150);
  });
  if ("onscrollend" in el) {
    el.addEventListener("scrollend", onSettle);
  }
  if (el.dataset.grabCursor !== "false") {
    setupMouseDrag(el, () => {
      scrollTo(positions()[nearestIndex(el.scrollLeft)] ?? 0, false);
    });
  }
  const applyOverflow = () => {
    const component = el.closest('[data-slider="component"]');
    const fits = maxScroll() <= 1;
    component?.querySelectorAll(".slider-nav, .slider-pagination").forEach((nav) => {
      nav.style.display = fits ? "none" : "";
    });
  };
  let resizeTimer;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      applyOverflow();
      settleLoop(true);
      emitChange(el);
    }, 150);
  }).observe(el);
  if (loop) {
    el.classList.add("cc-free-scroll");
    el.scrollLeft = positions()[leadingClones] ?? 0;
    requestAnimationFrame(() => el.classList.remove("cc-free-scroll"));
  }
  applyOverflow();
  emitChange(el);
  return {
    count: () => (loop ? -realCount : pageCount()),
    current: currentIndex,
    goTo,
    next: () => goTo(currentIndex() + 1),
    prev: () => goTo(currentIndex() - 1),
  };
}
function cloneSlide(slide) {
  const clone = slide.cloneNode(true);
  clone.setAttribute("aria-hidden", "true");
  clone.setAttribute("data-clone", "");
  clone.removeAttribute("role");
  clone.inert = true;
  return clone;
}
function setupMouseDrag(el, onRelease) {
  let startX = 0;
  let startScroll = 0;
  let dragging = false;
  let moved = false;
  el.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    e.preventDefault();
    dragging = true;
    moved = false;
    startX = e.clientX;
    startScroll = el.scrollLeft;
    el.classList.add("cc-dragging", "cc-free-scroll");
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener("dragstart", (e) => {
    if (dragging) e.preventDefault();
  });
  el.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 5) moved = true;
    el.scrollLeft = startScroll - dx;
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove("cc-dragging", "cc-free-scroll");
    if (moved) {
      el.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
        },
        { capture: true, once: true },
      );
    }
    onRelease();
  };
  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", release);
}
function createFadeEngine(el, slides) {
  const loop = el.dataset.loop === "true";
  let index = 0;
  const apply = () => {
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle("cc-active-slide", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.inert = !active;
    });
    emitChange(el);
  };
  const goTo = (next, instant = false) => {
    if (loop) {
      index = ((next % slides.length) + slides.length) % slides.length;
    } else {
      index = Math.max(0, Math.min(next, slides.length - 1));
    }
    if (instant || reducedMotion()) {
      slides.forEach((s) => (s.style.transition = "none"));
      requestAnimationFrame(() => slides.forEach((s) => (s.style.transition = "")));
    }
    apply();
  };
  let startX = null;
  el.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
  });
  el.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) goTo(index + (dx < 0 ? 1 : -1));
  });
  el.style.touchAction = "pan-y";
  apply();
  return {
    count: () => (loop ? -slides.length : slides.length),
    current: () => index,
    goTo,
    next: () => goTo(index + 1),
    prev: () => goTo(index - 1),
  };
}
export { initSliders };

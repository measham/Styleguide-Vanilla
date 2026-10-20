import { claimMastElement } from "./shared.js";
class VideoLibrary {
  options;
  prefersReducedMotion;
  videoObserver = null;
  pictureElementCache = /* @__PURE__ */ new WeakMap();
  constructor(options = {}) {
    this.options = {
      rootMargin: options.rootMargin ?? "100px",
      threshold: options.threshold ?? 0,
      scrollTriggerThreshold: options.scrollTriggerThreshold ?? 0.5,
    };
    this.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  resizeWatched = false;
  /** Sets up `videos` (all not yet set up). */
  setup(videos) {
    if (videos.length === 0) return;
    this.updateDesktopOnlyVideos(videos);
    this.setupLazyLoading(videos);
    this.setupVideoControls(videos);
    this.setupHoverPlay(videos);
    const hasDesktopOnly = videos.some((video) => video.getAttribute("data-video-desktop-only") === "true");
    if (hasDesktopOnly && !this.resizeWatched) {
      this.resizeWatched = true;
      let resizeTimeout;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.updateDesktopOnlyVideos();
        }, 150);
      });
    }
  }
  getComponentContainer(video) {
    return video.closest('[data-video="component"]') || video.parentElement;
  }
  // Hides desktop-only videos (showing their poster instead) below the
  // desktop breakpoint, and restores them above it.
  updateDesktopOnlyVideos(only) {
    const desktopOnlyVideos = Array.from(document.querySelectorAll('video[data-video-desktop-only="true"]')).filter(
      (video) => !only || only.includes(video),
    );
    const isSmallScreen = window.matchMedia("(max-width: 61.9375rem)").matches;
    desktopOnlyVideos.forEach((video) => {
      const container = this.getComponentContainer(video);
      const playbackWrapper = container?.querySelector('[data-video-playback="wrapper"]') ?? null;
      if (isSmallScreen) {
        video.style.display = "none";
        this.showPictureElement(video);
        if (playbackWrapper) {
          playbackWrapper.style.display = "none";
          playbackWrapper.style.visibility = "hidden";
          playbackWrapper.setAttribute("aria-hidden", "true");
        }
      } else {
        video.style.display = "";
        this.hidePictureElement(video);
        if (playbackWrapper) {
          playbackWrapper.style.display = "";
          playbackWrapper.style.visibility = "";
          playbackWrapper.removeAttribute("aria-hidden");
        }
      }
    });
  }
  setupLazyLoading(videos) {
    if (videos.length === 0) return;
    this.videoObserver ??= new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const video = entry.target;
            this.lazyLoadVideo(video)
              .then(() => observer.unobserve(video))
              .catch(console.error);
          }
        });
      },
      {
        root: null,
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold,
      },
    );
    videos.forEach((video) => {
      const scrollInPlay = video.getAttribute("data-video-scroll-in-play") === "true";
      const hoverPlay = video.getAttribute("data-video-hover") === "true";
      this.videoObserver.observe(video);
      if (hoverPlay && scrollInPlay) {
        this.setupScrollInPlayForHover(video);
      } else if (hoverPlay) {
      } else if (this.prefersReducedMotion) {
        video.pause();
      } else if (scrollInPlay) {
        this.setupScrollInPlay(video);
      } else {
        this.setupAutoplay(video);
      }
    });
  }
  lazyLoadVideo(video) {
    return new Promise((resolve, reject) => {
      const source = video.querySelector("source[data-src]");
      if (source && !source.src) {
        source.src = source.getAttribute("data-src") ?? "";
        video.load();
      } else if (!source || video.readyState >= 3) {
        resolve();
        return;
      }
      video.addEventListener("canplaythrough", function onCanPlayThrough() {
        video.removeEventListener("canplaythrough", onCanPlayThrough);
        resolve();
      });
      video.addEventListener("error", function onError() {
        video.removeEventListener("error", onError);
        reject(new Error(`Error loading video: ${source?.src ?? video.currentSrc}`));
      });
    });
  }
  showPictureElement(video) {
    const picture = this.findPictureElement(video);
    if (picture) picture.style.display = "block";
  }
  hidePictureElement(video) {
    const picture = this.findPictureElement(video);
    if (picture) picture.style.display = "none";
  }
  findPictureElement(video) {
    if (this.pictureElementCache.has(video)) {
      return this.pictureElementCache.get(video) ?? null;
    }
    let pictureElement = null;
    let sibling = video.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === "PICTURE" || sibling.tagName === "IMG") {
        pictureElement = sibling;
        break;
      }
      sibling = sibling.previousElementSibling;
    }
    if (!pictureElement) {
      pictureElement = this.getComponentContainer(video)?.querySelector("picture, img") ?? null;
    }
    this.pictureElementCache.set(video, pictureElement);
    return pictureElement;
  }
  setupVideoControls(videos) {
    videos.forEach((video) => {
      this.handlePlaybackButtons(video);
    });
  }
  setupHoverPlay(videos) {
    const hoverVideos = videos.filter((video) => video.getAttribute("data-video-hover") === "true");
    hoverVideos.forEach((video) => {
      const container = this.getComponentContainer(video);
      const trigger = container || video;
      let hasPlayedOnce = false;
      this.showPictureElement(video);
      trigger.addEventListener("mouseenter", async () => {
        if (this.prefersReducedMotion) return;
        try {
          this.hidePictureElement(video);
          await this.lazyLoadVideo(video);
          if (!hasPlayedOnce) {
            video.currentTime = 0;
            hasPlayedOnce = true;
          }
          video.play();
        } catch (error) {
          console.error("Error playing hover video:", error);
        }
      });
      trigger.addEventListener("mouseleave", () => {
        video.pause();
      });
    });
  }
  setupAutoplay(video) {
    video.addEventListener("canplaythrough", () => {
      if (!this.prefersReducedMotion) {
        this.hidePictureElement(video);
        video.play().catch(console.error);
      }
    });
  }
  setupScrollInPlay(video) {
    let hasPlayedOnce = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.lazyLoadVideo(video)
              .then(() => {
                if (!this.prefersReducedMotion) {
                  this.hidePictureElement(video);
                  if (!hasPlayedOnce) {
                    video.currentTime = 0;
                    hasPlayedOnce = true;
                  }
                  video.play();
                }
              })
              .catch(console.error);
          } else {
            video.pause();
          }
        }
      },
      { threshold: this.options.scrollTriggerThreshold },
    );
    observer.observe(video);
  }
  setupScrollInPlayForHover(video) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.lazyLoadVideo(video)
              .then(() => {
                video.pause();
                this.showPictureElement(video);
              })
              .catch(console.error);
          }
        }
      },
      { threshold: this.options.scrollTriggerThreshold },
    );
    observer.observe(video);
  }
  handlePlaybackButtons(video) {
    const container = this.getComponentContainer(video);
    if (!container) return;
    const playbackButton = container.querySelector('[data-video-playback="button"]');
    if (!playbackButton) return;
    const playIcon = playbackButton.querySelector('[data-video-playback="play"]');
    const pauseIcon = playbackButton.querySelector('[data-video-playback="pause"]');
    if (!playIcon || !pauseIcon) return;
    const toggleButtonState = (isPlaying) => {
      if (isPlaying) {
        playIcon.style.display = "none";
        playIcon.style.visibility = "hidden";
        playIcon.setAttribute("aria-hidden", "true");
        pauseIcon.style.display = "flex";
        pauseIcon.style.visibility = "visible";
        pauseIcon.removeAttribute("aria-hidden");
        playbackButton.setAttribute("aria-label", "Pause video");
      } else {
        playIcon.style.display = "flex";
        playIcon.style.visibility = "visible";
        playIcon.removeAttribute("aria-hidden");
        pauseIcon.style.display = "none";
        pauseIcon.style.visibility = "hidden";
        pauseIcon.setAttribute("aria-hidden", "true");
        playbackButton.setAttribute("aria-label", "Play video");
      }
    };
    toggleButtonState(!video.paused);
    playbackButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      if (video.paused) {
        try {
          await this.lazyLoadVideo(video);
          this.hidePictureElement(video);
          video.play();
          toggleButtonState(true);
        } catch (error) {
          console.error(error);
        }
      } else {
        video.pause();
        toggleButtonState(false);
      }
    });
    video.addEventListener("play", () => toggleButtonState(true));
    video.addEventListener("pause", () => toggleButtonState(false));
  }
}
let library = null;
function initInlineVideos() {
  const videos = Array.from(document.querySelectorAll("video[data-video]")).filter((video) =>
    claimMastElement(video, "inlineVideo"),
  );
  if (videos.length === 0) return;
  library ??= new VideoLibrary();
  library.setup(videos);
}
export { initInlineVideos };

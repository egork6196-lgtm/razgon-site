// Re-arm blocks only after they are fully outside the viewport. Their hidden state
// is prepared off-screen, so repeated reveals never flash visible text first.
(() => {
  if (!("IntersectionObserver" in window)) return;

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches) return;

  const targets = document.querySelectorAll(
    ".hero-copy, .section-heading, .feature-card, .program-card, " +
    ".faq-list > details, .location-copy, " +
    ".contact-copy, .contact-launch-card, .detail-list > li, .program-next > *, .upcoming-panel, .site-footer",
  );
  const visible = new WeakMap();
  const cleanupTimers = new WeakMap();

  const clearCleanup = (target) => {
    window.clearTimeout(cleanupTimers.get(target));
    cleanupTimers.delete(target);
  };

  const prepareOffscreen = (target, bounds) => {
    clearCleanup(target);
    target.classList.add("reveal-resetting", "reveal-target");
    target.classList.remove("is-revealed");
    target.style.setProperty("--reveal-y", bounds.bottom <= 0 ? "-28px" : "28px");
    requestAnimationFrame(() => target.classList.remove("reveal-resetting"));
  };

  const reveal = (target) => {
    clearCleanup(target);
    requestAnimationFrame(() => {
      target.classList.add("is-revealed");
      const timer = window.setTimeout(() => {
        if (!visible.get(target)) return;
        target.classList.remove("reveal-target", "is-revealed");
        target.style.removeProperty("--reveal-y");
        cleanupTimers.delete(target);
      }, 1250);
      cleanupTimers.set(target, timer);
    });
  };

  // Read all initial geometry before changing classes to avoid repeated layout.
  const initialBounds = Array.from(targets, (target) => [target, target.getBoundingClientRect()]);
  initialBounds.forEach(([target, bounds]) => {
    const isVisible = bounds.top < window.innerHeight && bounds.bottom > 0;
    visible.set(target, isVisible);
    if (!isVisible) prepareOffscreen(target, bounds);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const target = entry.target;
      const bounds = entry.boundingClientRect;

      if (entry.isIntersecting) {
        visible.set(target, true);
        if (target.classList.contains("reveal-target")) reveal(target);
        return;
      }

      const isFullyOutside = bounds.bottom <= 0 || bounds.top >= window.innerHeight;
      if (!isFullyOutside || !visible.get(target)) return;

      visible.set(target, false);
      prepareOffscreen(target, bounds);
    });
  }, { threshold: 0.01 });

  targets.forEach((target) => observer.observe(target));

  motion.addEventListener("change", () => {
    if (!motion.matches) return;
    observer.disconnect();
    targets.forEach((target) => {
      clearCleanup(target);
      target.classList.remove("reveal-resetting", "reveal-target", "is-revealed");
      target.style.removeProperty("--reveal-y");
    });
  });
})();

// Observe stationary containers so the artwork's own motion cannot retrigger it.
(() => {
  if (!("IntersectionObserver" in window) || !("animate" in Element.prototype)) return;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches) return;

  const accents = new Map();
  document.querySelectorAll("[data-scroll-accent]").forEach((target) => {
    const artwork = target.querySelector("[data-scroll-accent-art]");
    if (artwork) accents.set(target, { artwork, animations: [], inView: false });
  });
  if (!accents.size) return;

  const cancel = (record) => {
    record.animations.forEach((animation) => animation.cancel());
    record.animations = [];
    record.artwork.style.removeProperty("will-change");
  };

  const prepare = (target, record) => {
    cancel(record);
    target.classList.add("scroll-accent-pending");
    record.inView = false;
  };

  const play = (target, record) => {
    cancel(record);
    target.classList.remove("scroll-accent-pending");
    record.inView = true;
    record.artwork.style.willChange = "transform, opacity";
    const effects = [];
    let movement;
    if (target.dataset.scrollAccent === "car") {
      // Measure once per entrance, never on scroll frames. Keep the final CSS pose.
      const destination = parseFloat(getComputedStyle(record.artwork).left);
      const distance = Math.max(0, destination - record.artwork.clientWidth / 2);
      movement = record.artwork.animate([
        { transform: `translate(calc(-50% - ${distance}px), -69%) rotate(0deg)`, easing: "cubic-bezier(0.55, 0.03, 0.42, 1)" },
        { transform: "translate(calc(-50% + 5px), -69%) rotate(-1.8deg)", offset: 0.82, easing: "ease-out" },
        { transform: "translate(calc(-50% - 1px), -69%) rotate(0.7deg)", offset: 0.93, easing: "ease-out" },
        { transform: "translate(-50%, -69%) rotate(0deg)" },
      ], { duration: 2150 });
      const brakeTrace = target.querySelector("[data-car-brake]");
      if (brakeTrace) effects.push(brakeTrace.animate([
        { opacity: 0, transform: "scaleX(0.25)" },
        { opacity: 0.55, transform: "scaleX(1)", offset: 0.24 },
        { opacity: 0.35, transform: "scaleX(1)", offset: 0.6 },
        { opacity: 0, transform: "scaleX(1)" },
      ], { duration: 950, delay: 1580, easing: "ease-out" }));
    } else {
      movement = record.artwork.animate([
        { transform: "translate(-10px, 42px) rotate(-10deg) scale(0.8)", easing: "cubic-bezier(0.3, 0, 0.25, 1)" },
        { transform: "translate(0, -4px) rotate(2deg) scale(1.03)", offset: 0.82, easing: "ease-out" },
        { transform: "translate(0, 0) rotate(0) scale(1)" },
      ], { duration: 1700, delay: 100 });
    }
    const fade = record.artwork.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: target.dataset.scrollAccent === "message" ? 700 : 220,
      delay: target.dataset.scrollAccent === "message" ? 100 : 0,
      fill: "backwards", easing: "ease-out",
    });
    record.animations = [movement, fade, ...effects];
    movement.onfinish = () => record.artwork.style.removeProperty("will-change");
  };

  accents.forEach((record, target) => prepare(target, record));
  const header = document.querySelector(".site-header");
  const headerHeight = header && ["sticky", "fixed"].includes(getComputedStyle(header).position)
    ? Math.ceil(header.getBoundingClientRect().height) : 0;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const record = accents.get(entry.target);
      // Start after the whole artwork's container is visibly inside the screen.
      if (entry.isIntersecting && entry.intersectionRatio >= 0.99) {
        if (!record.inView) play(entry.target, record);
      }
    });
  }, { rootMargin: `-${headerHeight}px 0px -64px 0px`, threshold: 1 });
  // Reset at the actual visible edge, independently of the entrance inset.
  const exitObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const record = accents.get(entry.target);
      if (!entry.isIntersecting && record.inView) prepare(entry.target, record);
    });
  }, { rootMargin: `-${headerHeight}px 0px 0px 0px`, threshold: 0 });
  accents.forEach((record, target) => {
    observer.observe(target);
    exitObserver.observe(target);
  });

  motion.addEventListener("change", () => {
    if (!motion.matches) return;
    observer.disconnect();
    exitObserver.disconnect();
    accents.forEach((record, target) => {
      cancel(record);
      target.classList.remove("scroll-accent-pending");
    });
  });
})();

// Re-arm blocks only after they are fully outside the viewport. Their hidden state
// is prepared off-screen, so repeated reveals never flash visible text first.
(() => {
  if (!("IntersectionObserver" in window)) return;

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches) return;

  const targets = document.querySelectorAll(
    ".hero-copy, .section-heading, .feature-card, .program-card, " +
    ".steps-list > li, .faq-list > details, .location-copy, " +
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

  targets.forEach((target) => {
    const bounds = target.getBoundingClientRect();
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

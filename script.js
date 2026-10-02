const form = document.querySelector("#learning-form");
const status = document.querySelector("#form-status");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");
const formDialog = document.querySelector("#form-dialog");
const formDialogOpeners = document.querySelectorAll("[data-form-dialog-open]");
const formDialogClose = document.querySelector("[data-form-dialog-close]");
const programSelect = document.querySelector("#program");
const mapContainer = document.querySelector("[data-map-container]");
const mapFrame = mapContainer?.querySelector("iframe[data-map-src]");
const mapStatus = mapContainer?.querySelector("[data-map-status]");
const mapRetry = mapContainer?.querySelector("[data-map-retry]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
// Reserve the fixed mobile header's actual height, including logo and text sizing.
const siteHeader = document.querySelector(".site-header");
if (siteHeader) {
  const syncHeaderHeight = () => {
    document.documentElement.style.setProperty(
      "--mobile-header-height", `${siteHeader.getBoundingClientRect().height}px`,
    );
  };
  syncHeaderHeight();
  if ("ResizeObserver" in window) {
    new ResizeObserver(syncHeaderHeight).observe(siteHeader);
  } else {
    window.addEventListener("resize", syncHeaderHeight, { passive: true });
  }
}

document.querySelectorAll("[data-messenger-preview]").forEach((button) => {
  button.addEventListener("click", () => {
    const messengerStatus = button.closest("[data-messenger-block]")?.querySelector("[data-messenger-status]");
    if (messengerStatus) {
      messengerStatus.textContent = `${button.dataset.messengerPreview}: контакт пока не подключён.`;
    }
  });
});
let formDialogCloseTimer;
let lastFormDialogTrigger;
let mapLoadTimer;
let mapAttempts = 0;

const closeMenu = () => {
  siteNav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
};

menuToggle.addEventListener("click", () => {
  const shouldOpen = menuToggle.getAttribute("aria-expanded") === "false";
  siteNav.classList.toggle("is-open", shouldOpen);
  menuToggle.setAttribute("aria-expanded", String(shouldOpen));
});

siteNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !formDialog?.open) {
    closeMenu();
    menuToggle.focus();
  }
});

function openFormDialog(trigger) {
  if (!formDialog) return;
  lastFormDialogTrigger = trigger;
  formDialog.classList.remove("is-closing");
  formDialog.showModal();
}

if (formDialog && formDialogClose) {
  const closeFormDialog = () => {
    if (!formDialog.open) return;

    if (reducedMotion.matches) {
      formDialog.close();
      return;
    }

    formDialog.classList.add("is-closing");
    window.clearTimeout(formDialogCloseTimer);
    formDialogCloseTimer = window.setTimeout(() => formDialog.close(), 180);
  };

  formDialogOpeners.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      if (trigger.dataset.program && programSelect) {
        programSelect.value = trigger.dataset.program;
      }
      openFormDialog(trigger);
    });
  });

  formDialogClose.addEventListener("click", closeFormDialog);

  formDialog.addEventListener("click", (event) => {
    if (event.target === formDialog) closeFormDialog();
  });

  formDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeFormDialog();
  });

  formDialog.addEventListener("close", () => {
    window.clearTimeout(formDialogCloseTimer);
    formDialog.classList.remove("is-closing");
    lastFormDialogTrigger?.focus();
  });
}

if (form && status) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      status.textContent = "Заполните оба поля.";
      status.className = "form-status form-status-error";
      form.reportValidity();
      return;
    }

    status.textContent = "Отправка формы будет подключена позднее.";
    status.className = "form-status form-status-success";
  });
}

if (mapContainer && mapFrame && mapStatus && mapRetry) {
  const loadMap = () => {
    window.clearTimeout(mapLoadTimer);
    mapAttempts += 1;
    mapContainer.classList.remove("is-loaded", "has-error");
    mapStatus.textContent = "Загружаем интерактивную карту…";

    const separator = mapFrame.dataset.mapSrc.includes("?") ? "&" : "?";
    mapFrame.src = `${mapFrame.dataset.mapSrc}${separator}attempt=${mapAttempts}`;

    mapLoadTimer = window.setTimeout(() => {
      if (mapContainer.classList.contains("is-loaded")) return;
      if (mapAttempts < 2) {
        loadMap();
        return;
      }
      mapContainer.classList.add("has-error");
      mapStatus.textContent = "Карта не загрузилась. Попробуйте ещё раз.";
    }, 9000);
  };

  mapFrame.addEventListener("load", () => {
    if (mapFrame.src === "about:blank") return;
    window.clearTimeout(mapLoadTimer);
    mapContainer.classList.add("is-loaded");
    mapContainer.classList.remove("has-error");
  });

  mapFrame.addEventListener("error", () => {
    window.clearTimeout(mapLoadTimer);
    if (mapAttempts < 2) loadMap();
  });

  mapRetry.addEventListener("click", () => {
    mapAttempts = 0;
    loadMap();
  });

  if ("IntersectionObserver" in window) {
    const mapObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      mapObserver.disconnect();
      loadMap();
    }, { rootMargin: "300px 0px" });
    mapObserver.observe(mapContainer);
  } else {
    loadMap();
  }
}

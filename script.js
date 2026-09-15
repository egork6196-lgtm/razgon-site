const form = document.querySelector("#learning-form");
const status = document.querySelector("#form-status");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");
const programDialog = document.querySelector("#program-dialog");
const programDialogOpen = document.querySelector("[data-program-dialog-open]");
const programDialogClose = document.querySelector("[data-program-dialog-close]");
const programDialogChoose = document.querySelector("[data-program-dialog-choose]");

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
  if (event.key === "Escape" && !programDialog?.open) {
    closeMenu();
    menuToggle.focus();
  }
});

if (programDialog && programDialogOpen && programDialogClose) {
  programDialogOpen.addEventListener("click", (event) => {
    event.preventDefault();
    programDialog.showModal();
  });

  programDialogClose.addEventListener("click", () => programDialog.close());

  programDialog.addEventListener("click", (event) => {
    if (event.target === programDialog) {
      programDialog.close();
    }
  });

  programDialog.addEventListener("close", () => programDialogOpen.focus());

  programDialogChoose?.addEventListener("click", () => programDialog.close());
}

if (form && status) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      status.textContent = "Заполните оба учебных поля.";
      status.className = "form-status form-status-error";
      form.reportValidity();
      return;
    }

    status.textContent = "Готово! Это демонстрация: данные никуда не отправлены.";
    status.className = "form-status form-status-success";
  });
}

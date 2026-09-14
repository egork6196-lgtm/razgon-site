const form = document.querySelector("#learning-form");
const status = document.querySelector("#form-status");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");

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
  if (event.key === "Escape") {
    closeMenu();
    menuToggle.focus();
  }
});

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

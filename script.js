const form = document.querySelector("#learning-form");
const status = document.querySelector("#form-status");

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

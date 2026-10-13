import "./index.css";

const createButton = document.querySelector("#create-portfolio");
const message = document.querySelector("#dashboard-message");

createButton?.addEventListener("click", () => {

  message.textContent = "Your portfolio builder page is the next step.";
  document.querySelector("#templates")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
});

document.querySelectorAll(".choose-template").forEach((button) => {
  button.addEventListener("click", () => {
    const template = button.dataset.template;

    message.textContent =
      `You selected the ${template} template. The builder connection is not set up yet.`;
  });
});

document.querySelector(".edit-sample")?.addEventListener("click", () => {
  message.textContent =
    "Editing will be available when the portfolio builder is connected.";
});

document.querySelector(".delete-sample")?.addEventListener("click", () => {
  message.textContent =
    "This is sample content. Connect saved portfolio data before implementing deletion.";
});

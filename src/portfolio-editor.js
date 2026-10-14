import "./portfolio-editor.css";
import { portfolioStore } from "./portfolio-store.js";
import { renderDocument } from "./portfolio-renderer.js";

const form = document.querySelector("#portfolio-form");
const iframe = document.querySelector("#portfolio-preview");
const message = document.querySelector("#form-message");
const saveButton = document.querySelector("#save-button");

const params = new URLSearchParams(location.search);
let portfolioId = params.get("id");
let lastSaved = false;

const fields = [
  "title",
  "full_name",
  "email",
  "phone",
  "address",
  "profile_image",
  "about",
  "education",
  "skills",
  "projects",
  "experience",
  "social_links",
  "template_key"
];

function getData() {
  const data = {};

  fields.forEach(key => {
    const el = form.elements.namedItem(key);

    data[key] = el instanceof RadioNodeList
      ? (el.value || "simple")
      : (el?.value?.trim() || "");
  });

  return data;
}

function updatePreview() {
  const data = getData();

  iframe.srcdoc = renderDocument(data);

  document.querySelector("#preview-label").textContent =
    `${data.template_key[0].toUpperCase() + data.template_key.slice(1)} template`;

  lastSaved = false;
}

function showMessage(text, success = false) {
  message.textContent = text;
  message.className =
    `text-sm ${success ? "text-emerald-700" : "text-rose-600"}`;
}

function fillForm(data = {}) {
  fields.forEach(key => {
    const el = form.elements.namedItem(key);

    if (!el) return;

    if (el instanceof RadioNodeList) {
      el.value = data[key] || "simple";
    } else {
      el.value = data[key] || "";
    }
  });

  updatePreview();
  lastSaved = true;
}

async function loadPortfolio() {
  if (!portfolioId) {
    const draft = sessionStorage.getItem("soyon-editor-draft");

    if (draft) {
      try {
        fillForm(JSON.parse(draft));
      } catch {
        // Ignore invalid draft data.
      }
    }

    showMessage(
      "Front-end demo mode: portfolios are saved in this browser for now.",
      true
    );
    return;
  }

  const item = await portfolioStore.get(portfolioId);

  if (!item) {
    showMessage(
      "Portfolio not found in this browser. You can save this form as a new portfolio."
    );
    portfolioId = null;
    return;
  }

  fillForm({
    ...item.content,
    title: item.title,
    template_key: item.template_key
  });

  document.querySelector("#editor-heading").textContent =
    "Edit your portfolio";

  showMessage(
    "Portfolio loaded. Your changes will be saved in this browser until a backend is connected.",
    true
  );
}

async function savePortfolio(event) {
  event?.preventDefault();

  if (!form.reportValidity()) return false;

  const data = getData();

  saveButton.disabled = true;
  saveButton.textContent = "Saving…";

  try {
    const payload = {
      title: data.title,
      template_key: data.template_key,
      content: data,
      status: "draft"
    };

    const saved = await portfolioStore.save(payload, portfolioId);

    portfolioId = saved.id;

    history.replaceState(
      null,
      "",
      `?id=${encodeURIComponent(portfolioId)}`
    );

    sessionStorage.removeItem("soyon-editor-draft");
    lastSaved = true;

    showMessage(
      "Portfolio saved in this browser. Connect Supabase later for online, cross-device storage.",
      true
    );

    return true;
  } catch (error) {
    showMessage(`Could not save portfolio: ${error.message}`);
    return false;
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Save portfolio";
  }
}

form.addEventListener("input", updatePreview);
form.addEventListener("change", updatePreview);
form.addEventListener("submit", savePortfolio);

document.querySelector("#preview-button").addEventListener("click", () => {
  updatePreview();

  showMessage(
    "Preview refreshed. Save your changes when you are ready.",
    true
  );

  iframe.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

document.querySelector("#generate-button").addEventListener("click", async () => {
  if (!lastSaved && !(await savePortfolio())) return;
  if (!portfolioId) return;

  location.href =
    `./view-portfolio.html?id=${encodeURIComponent(portfolioId)}`;
});

loadPortfolio();

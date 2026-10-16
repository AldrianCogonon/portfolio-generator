
import "./portfolio-editor.css";
import { portfolioStore } from "./portfolio-store.js";
import { renderDocument } from "./portfolio-render.js";

const form = document.querySelector("#portfolio-form");
const iframe = document.querySelector("#portfolio-preview");
const message = document.querySelector("#form-message");
const saveButton = document.querySelector("#save-button");
const accountButton = document.querySelector("#save-account-button");
const actionContainer = document.querySelector(".editor-actions");

const imageInput = document.querySelector("#profile_image_file");
const imagePreview = document.querySelector("#profile-image-preview");
const imagePlaceholder = document.querySelector("#profile-image-placeholder");
const imageValue = document.querySelector("#profile_image");
const imageName = document.querySelector("#profile-image-name");
const removeImageButton = document.querySelector("#remove-profile-image");

const params = new URLSearchParams(location.search);
const requestedMode = params.get("mode");
const initialPortfolioId = params.get("id");
const initialTemplate = params.get("template") || "simple";

let editorMode =
  requestedMode === "new" || !initialPortfolioId ? "new" : "edit";

let portfolioId = editorMode === "edit" ? initialPortfolioId : null;
let currentPortfolio = null;
let lastSaved = false;
let autosaveTimer = null;
let saveInProgress = Promise.resolve();
let imageSelectionVersion = 0;

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
    const element = form.elements.namedItem(key);

    data[key] = element instanceof RadioNodeList
      ? (element.value || initialTemplate)
      : (element?.value?.trim() || "");
  });

  return data;
}

function getPayload(data = getData()) {
  return {
    title: data.title || "My Portfolio",
    template_key: data.template_key || initialTemplate,
    content: data
  };
}

function showMessage(text, success = false) {
  if (!message) return;

  message.textContent = text;
  message.className = `text-sm ${
    success ? "text-emerald-700" : "text-rose-600"
  }`;
}

function setEditorMode(mode) {
  editorMode = mode;

  const heading = document.querySelector("#editor-heading");

  if (heading) {
    heading.textContent =
      mode === "edit" ? "Edit your portfolio" : "Create your portfolio";
  }

  if (saveButton) {
    saveButton.textContent = "Save Draft";
  }
}

function updateUrl() {
  const query = new URLSearchParams();

  query.set("template", getData().template_key || initialTemplate);
  query.set("mode", editorMode);

  if (editorMode === "edit" && portfolioId) {
    query.set("id", portfolioId);
  }

  history.replaceState(null, "", `?${query.toString()}`);
}

/* Profile image UI */

function updateImageUI(dataUrl = "", fileName = "") {
  if (!imagePreview || !imagePlaceholder || !imageValue) return;

  imageValue.value = dataUrl;

  if (dataUrl) {
    imagePreview.src = dataUrl;
    imagePreview.hidden = false;
    imagePlaceholder.hidden = true;

    if (imageName) {
      imageName.textContent = fileName || "Profile photo selected";
    }

    if (removeImageButton) {
      removeImageButton.hidden = false;
    }
  } else {
    imagePreview.removeAttribute("src");
    imagePreview.hidden = true;
    imagePlaceholder.hidden = false;

    if (imageName) {
      imageName.textContent = "No image selected";
    }

    if (removeImageButton) {
      removeImageButton.hidden = true;
    }
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("The selected image could not be read."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Unable to read this image. Please try again."));
    };

    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This image could not be opened."));
    image.src = source;
  });
}

async function resizeImage(file) {
  const maxInputSize = 12 * 1024 * 1024;

  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose a valid image file.");
  }

  if (file.size > maxInputSize) {
    throw new Error("Please choose an image smaller than 12 MB.");
  }

  const source = await readFileAsDataURL(file);
  const image = await loadImage(source);
  const maxDimension = 800;

  const scale = Math.min(
    1,
    maxDimension / Math.max(image.naturalWidth, image.naturalHeight)
  );

  const canvas = document.createElement("canvas");

  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Image processing is unavailable in this browser.");
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);

  if (dataUrl.length > 2_500_000) {
    throw new Error(
      "This image is still too large to save reliably. Choose a smaller image."
    );
  }

  return dataUrl;
}

if (imageInput && imageValue) {
  imageInput.addEventListener("change", async () => {
    const file = imageInput.files?.[0];

    if (!file) return;

    const selectionVersion = ++imageSelectionVersion;

    try {
      showMessage("Preparing your profile picture…", true);

      const dataUrl = await resizeImage(file);

      if (selectionVersion !== imageSelectionVersion) return;

      updateImageUI(dataUrl, file.name);
      updatePreview();

      showMessage(
        "Profile picture updated. Save to Account when you're ready.",
        true
      );
    } catch (error) {
      if (selectionVersion !== imageSelectionVersion) return;

      showMessage(error.message);
    }
  });
}

removeImageButton?.addEventListener("click", () => {
  imageSelectionVersion++;

  if (imageInput) imageInput.value = "";

  updateImageUI();
  updatePreview();

  showMessage("Profile picture removed.", true);
});

/* Live preview and local autosave */

function updatePreview() {
  const data = getData();

  if (iframe) {
    iframe.srcdoc = renderDocument(data);
  }

  const previewLabel = document.querySelector("#preview-label");
  const template = data.template_key || "simple";

  if (previewLabel) {
    previewLabel.textContent =
      `${template[0].toUpperCase() + template.slice(1)} template`;
  }

  lastSaved = false;
  queueLocalSave();
}

function fillForm(data = {}) {
  fields.forEach(key => {
    const element = form.elements.namedItem(key);

    if (!element) return;

    if (element instanceof RadioNodeList) {
      element.value = data[key] || initialTemplate;
    } else {
      element.value = data[key] || "";
    }
  });

  updateImageUI(data.profile_image || "", data.profile_image_name || "");

  if (iframe) {
    iframe.srcdoc = renderDocument(getData());
  }

  lastSaved = true;
}

function queueLocalSave() {
  clearTimeout(autosaveTimer);

  autosaveTimer = setTimeout(() => {
    saveInProgress = saveInProgress
      .then(async () => {
        const saved = await portfolioStore.saveDraft(
          getPayload(),
          portfolioId
        );

        portfolioId = saved.id;
        currentPortfolio = saved;

        updateUrl();

        showMessage(
          "The draft is saved successfully.",
          true
        );
      })
      .catch(error => {
        showMessage(`Local draft could not be saved: ${error.message}`);
      });
  }, 350);
}

/* Loading */

function clearForNewPortfolio() {
  currentPortfolio = null;
  portfolioId = null;

  const defaults = {
    template_key: initialTemplate,
    profile_image: ""
  };

  fillForm(defaults);
  setEditorMode("new");
  updateUrl();

  showMessage(
    "Start creating your portfolio. Your changes stay in this browser until you save to your account.",
    true
  );
}

async function loadPortfolio() {
  if (editorMode === "new") {
    // Never restore the global editor draft when explicitly creating new.
    clearForNewPortfolio();
    return;
  }

  if (!portfolioId) {
    clearForNewPortfolio();
    return;
  }

  try {
    const item = await portfolioStore.get(portfolioId);

    if (!item) {
      portfolioId = null;
      currentPortfolio = null;
      setEditorMode("new");
      clearForNewPortfolio();

      showMessage(
        "That portfolio could not be found. A new portfolio is ready.",
        false
      );
      return;
    }

    currentPortfolio = item;
    portfolioId = item.id;

    fillForm({
      ...(item.content || {}),
      title: item.title || item.content?.title || "",
      template_key:
        item.template_key || item.content?.template_key || initialTemplate
    });

    setEditorMode("edit");
    updateUrl();

    showMessage(
      item.remote_id || item.is_remote
        ? "Portfolio loaded. Changes remain local until you choose Save to Account."
        : "Local draft loaded. Save to Account when you're ready.",
      true
    );
  } catch (error) {
    showMessage(`Unable to load this portfolio: ${error.message}`);
  }
}

/* Save a local draft */

async function saveDraft(event) {
  event?.preventDefault();

  if (!form.reportValidity()) return false;

  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = "Saving draft…";
  }

  try {
    clearTimeout(autosaveTimer);
    await saveInProgress;

    const saved = await portfolioStore.saveDraft(
      getPayload(),
      portfolioId
    );

    portfolioId = saved.id;
    currentPortfolio = saved;

    updateUrl();

    localStorage.setItem("soyon.editor.draft", JSON.stringify(saved));

    lastSaved = true;

    showMessage(
      "The draft is saved successfully.",
      true
    );

    return true;
  } catch (error) {
    showMessage(`Could not save draft: ${error.message}`);
    return false;
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = "Save Draft";
    }
  }
}

async function saveToAccount() {
  if (!form.reportValidity()) return false;

  if (!accountButton) {
    showMessage("The Save to Account button could not be found.");
    return false;
  }

  const originalText = accountButton.textContent;

  accountButton.disabled = true;
  accountButton.textContent = "Saving to account…";

  try {
    clearTimeout(autosaveTimer);
    await saveInProgress;

    const saved = await portfolioStore.saveToAccount(
      getPayload(),
      portfolioId
    );

    currentPortfolio = saved;
    portfolioId = saved.id;

    // A successful account save now has a real Supabase record ID.
    setEditorMode("edit");
    updateUrl();

    localStorage.setItem("soyon.editor.draft", JSON.stringify(saved));

    lastSaved = true;

    showMessage(
      "The portfolio is saved successfully.",
      true
    );

    return true;
  } catch (error) {
    showMessage(`Could not save to your account: ${error.message}`);
    return false;
  } finally {
    accountButton.disabled = false;
    accountButton.textContent = originalText;
  }
}

/* Keep one explicit account-save button */

function addExplicitSaveButton() {
  if (!actionContainer || !accountButton) return;

  document.querySelectorAll("button").forEach(button => {
    const label = button.textContent.replace(/\s+/g, " ").trim().toLowerCase();

    if (label === "publish" || label === "save changes") {
      button.remove();
    }
  });

  if (accountButton.dataset.handlerAttached !== "true") {
    accountButton.addEventListener("click", saveToAccount);
    accountButton.dataset.handlerAttached = "true";
  }

  if (saveButton) {
    saveButton.textContent = "Save Draft";
  }
}

/* Form events */

form.addEventListener("input", event => {
  if (event.target === imageInput) return;
  updatePreview();
});

form.addEventListener("change", event => {
  if (event.target === imageInput) return;
  updatePreview();
});

form.addEventListener("submit", saveDraft);

document.querySelector("#preview-button")?.addEventListener("click", () => {
  if (iframe) iframe.srcdoc = renderDocument(getData());

  showMessage(
    "Preview refreshed. Your work stays local until you choose Save to Account.",
    true
  );

  iframe?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

document.querySelector("#generate-button")?.addEventListener(
  "click",
  async () => {
    const saved = await saveToAccount();

    if (!saved || !portfolioId) return;

    location.href =
      `./view-portfolio.html?id=${encodeURIComponent(portfolioId)}`;
  }
);

addExplicitSaveButton();
loadPortfolio();

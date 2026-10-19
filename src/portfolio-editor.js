import "./portfolio-editor.css";
import { portfolioStore } from "./portfolio-store.js";
import { renderDocument } from "./portfolio-render.js";
import { fillTemplateSkeletons } from "./template-skeleton.js";
import "./template-skeleton.css";

fillTemplateSkeletons();

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
  "cover_image",
  "about",
  "education",
  "skills",
  "projects",
  "experience",
  "social_links",
  "project_images",
  "certifications",
  "languages",
  "interests",
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

async function resizeImage(
  file,
  { maxDimension = 800, quality = 0.82, maxLength = 2_500_000 } = {}
) {
  const maxInputSize = 12 * 1024 * 1024;

  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose a valid image file.");
  }

  if (file.size > maxInputSize) {
    throw new Error("Please choose an image smaller than 12 MB.");
  }

  const source = await readFileAsDataURL(file);
  const image = await loadImage(source);
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

  const dataUrl = canvas.toDataURL("image/jpeg", quality);

  if (dataUrl.length > maxLength) {
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

/* ---------- Project images (one slot per project line) ---------- */

const projectImagesList = document.querySelector("#project-images-list");
const projectImagesField = document.querySelector("#project_images");
const projectImageInput = document.querySelector("#project_image_file");
const projectImagesBulk = document.querySelector("#project_images_bulk");
const projectsField = document.querySelector("#projects");

const projectImageOptions = {
  maxDimension: 720,
  quality: 0.8,
  maxLength: 1_200_000
};

let projectImageTarget = -1;

function getProjectTitles() {
  return (projectsField?.value || "")
    .split(/\n+/)
    .map(line => line.split("|")[0].trim())
    .filter(Boolean);
}

function readProjectImages() {
  try {
    const list = JSON.parse(projectImagesField?.value || "[]");

    return Array.isArray(list)
      ? list.map(item => (typeof item === "string" ? item : ""))
      : [];
  } catch {
    return [];
  }
}

function writeProjectImages(list) {
  const trimmed = [...list];

  while (trimmed.length && !trimmed[trimmed.length - 1]) trimmed.pop();

  if (projectImagesField) projectImagesField.value = JSON.stringify(trimmed);
}

function renderProjectImages() {
  if (!projectImagesList) return;

  const titles = getProjectTitles();
  const images = readProjectImages();

  projectImagesList.replaceChildren();

  if (!titles.length) {
    const empty = document.createElement("p");

    empty.className = "project-image-empty";
    empty.textContent =
      "Add a project in the Projects box above and its image slot will appear here.";

    projectImagesList.append(empty);
    return;
  }

  titles.forEach((title, index) => {
    const src = images[index] || "";
    const slot = document.createElement("div");

    slot.className = "project-image-slot";

    const thumb = document.createElement("div");

    thumb.className = "project-image-thumb";

    if (src) {
      const img = document.createElement("img");

      img.src = src;
      img.alt = `${title} preview`;
      thumb.append(img);
    } else {
      thumb.textContent = String(index + 1).padStart(2, "0");
    }

    const info = document.createElement("div");

    info.className = "project-image-info";

    const strong = document.createElement("strong");
    const small = document.createElement("small");

    strong.textContent = title;
    small.textContent = src ? "Image added" : "No image yet";
    info.append(strong, small);

    const actions = document.createElement("div");

    actions.className = "project-image-actions";

    const choose = document.createElement("button");

    choose.type = "button";
    choose.className = "button button-secondary";
    choose.dataset.action = "choose";
    choose.dataset.index = String(index);
    choose.textContent = src ? "Replace" : "Choose image";
    actions.append(choose);

    if (src) {
      const remove = document.createElement("button");

      remove.type = "button";
      remove.className = "button button-secondary";
      remove.dataset.action = "remove";
      remove.dataset.index = String(index);
      remove.textContent = "Remove";
      actions.append(remove);
    }

    slot.append(thumb, info, actions);
    projectImagesList.append(slot);
  });
}

async function setProjectImages(entries) {
  const images = readProjectImages();

  for (const [index, file] of entries) {
    images[index] = await resizeImage(file, projectImageOptions);
  }

  writeProjectImages(images);
  renderProjectImages();
  updateCoverUI(data.cover_image || "");
  updatePreview();
}

projectImagesList?.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const index = Number(button.dataset.index);

  if (button.dataset.action === "choose") {
    projectImageTarget = index;
    projectImageInput.value = "";
    projectImageInput.click();
    return;
  }

  const images = readProjectImages();

  images[index] = "";
  writeProjectImages(images);
  renderProjectImages();
  updatePreview();
  showMessage("Project image removed.", true);
});

projectImageInput?.addEventListener("change", async () => {
  const file = projectImageInput.files?.[0];

  if (!file || projectImageTarget < 0) return;

  try {
    showMessage("Preparing project image…", true);
    await setProjectImages([[projectImageTarget, file]]);
    showMessage("Project image updated.", true);
  } catch (error) {
    showMessage(error.message);
  } finally {
    projectImageInput.value = "";
  }
});

projectImagesBulk?.addEventListener("change", async () => {
  const files = Array.from(projectImagesBulk.files || []);

  projectImagesBulk.value = "";

  if (!files.length) return;

  const titles = getProjectTitles();

  if (!titles.length) {
    showMessage("Add at least one project first, then add images.");
    return;
  }

  const images = readProjectImages();
  const emptySlots = titles
    .map((_, index) => index)
    .filter(index => !images[index]);

  const targets = emptySlots.length
    ? emptySlots
    : titles.map((_, index) => index);

  const entries = files.slice(0, targets.length).map((file, i) => [targets[i], file]);

  try {
    showMessage("Preparing project images…", true);
    await setProjectImages(entries);

    showMessage(
      files.length > entries.length
        ? `Added ${entries.length} image(s). ${files.length - entries.length} extra file(s) had no project to match — add more projects first.`
        : `Added ${entries.length} project image(s).`,
      true
    );
  } catch (error) {
    showMessage(error.message);
  }
});

/* ---------- Cover banner (used by the Creative template) ---------- */

const coverInput = document.querySelector("#cover_image_file");
const coverPreview = document.querySelector("#cover-image-preview");
const coverPlaceholder = document.querySelector("#cover-image-placeholder");
const coverValue = document.querySelector("#cover_image");
const coverName = document.querySelector("#cover-image-name");
const removeCoverButton = document.querySelector("#remove-cover-image");

const coverImageOptions = {
  maxDimension: 1400,
  quality: 0.8,
  maxLength: 1_800_000
};

function updateCoverUI(dataUrl = "", fileName = "") {
  if (!coverPreview || !coverPlaceholder || !coverValue) return;

  coverValue.value = dataUrl;

  if (dataUrl) {
    coverPreview.src = dataUrl;
    coverPreview.hidden = false;
    coverPlaceholder.hidden = true;

    if (coverName) coverName.textContent = fileName || "Cover banner selected";
    if (removeCoverButton) removeCoverButton.hidden = false;
  } else {
    coverPreview.removeAttribute("src");
    coverPreview.hidden = true;
    coverPlaceholder.hidden = false;

    if (coverName) coverName.textContent = "No banner selected";
    if (removeCoverButton) removeCoverButton.hidden = true;
  }
}

coverInput?.addEventListener("change", async () => {
  const file = coverInput.files?.[0];

  if (!file) return;

  try {
    showMessage("Preparing your cover banner…", true);

    const dataUrl = await resizeImage(file, coverImageOptions);

    updateCoverUI(dataUrl, file.name);
    updatePreview();

    showMessage("Cover banner updated. Save to Account when you're ready.", true);
  } catch (error) {
    showMessage(error.message);
  } finally {
    coverInput.value = "";
  }
});

removeCoverButton?.addEventListener("click", () => {
  updateCoverUI();
  updatePreview();
  showMessage("Cover banner removed.", true);
});

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
    } else if (key === "project_images") {
      element.value = Array.isArray(data[key])
        ? JSON.stringify(data[key])
        : (data[key] || "[]");
    } else {
      element.value = data[key] || "";
    }
  });

  updateImageUI(data.profile_image || "", data.profile_image_name || "");
  renderProjectImages();

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

form.addEventListener("input", event => {
  if (event.target.type === "file") return;

  if (event.target === projectsField) renderProjectImages();

  updatePreview();
});

form.addEventListener("change", event => {
  if (event.target.type === "file") return;
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
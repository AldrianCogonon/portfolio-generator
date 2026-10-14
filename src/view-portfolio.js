import { portfolioStore } from "./portfolio-store.js";
import { renderDocument } from "./portfolio-renderer.js";

const frame = document.querySelector("#portfolio-view");
const title = document.querySelector("#portfolio-title");
const subtitle = document.querySelector("#portfolio-subtitle");
const message = document.querySelector("#view-message");
const editLink = document.querySelector("#edit-link");
const downloadButton = document.querySelector("#download-button");

const params = new URLSearchParams(location.search);
const portfolioId = params.get("id");

let currentPortfolio = null;
let generatedHTML = "";

function showMessage(text) {
  message.textContent = text;
}

function safeFilename(value) {
  return String(value || "soyon-portfolio")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70) || "soyon-portfolio";
}

async function loadPortfolio() {
  if (!portfolioId) {
    showMessage(
      "No portfolio ID was provided. Open a saved portfolio from My Portfolios."
    );
    frame.hidden = true;
    downloadButton.disabled = true;
    return;
  }

  try {
    const portfolio = await portfolioStore.get(portfolioId);

    if (!portfolio) {
      showMessage(
        "Portfolio not found in this browser. Make sure you are using the same browser where it was saved."
      );
      frame.hidden = true;
      downloadButton.disabled = true;
      return;
    }

    currentPortfolio = portfolio;

    const data = {
      ...(portfolio.content || {}),
      title: portfolio.title || portfolio.content?.title || "My Portfolio",
      template_key:
        portfolio.template_key ||
        portfolio.content?.template_key ||
        "simple"
    };

    generatedHTML = renderDocument(data);

    title.textContent = data.title;
    subtitle.textContent = `Portfolio by ${data.full_name || "the author"}`;
    frame.srcdoc = generatedHTML;

    editLink.href =
      `./portfolio-editor.html?id=${encodeURIComponent(portfolio.id)}`;

    document.title = `${data.title} | SOYON`;
    showMessage("");
    frame.hidden = false;
    downloadButton.disabled = false;
  } catch (error) {
    showMessage(`Unable to load this portfolio: ${error.message}`);
    frame.hidden = true;
    downloadButton.disabled = true;
  }
}

downloadButton.addEventListener("click", () => {
  if (!generatedHTML || !currentPortfolio) return;

  const blob = new Blob(
    [generatedHTML],
    { type: "text/html;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${safeFilename(currentPortfolio.title)}.html`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
});

loadPortfolio();

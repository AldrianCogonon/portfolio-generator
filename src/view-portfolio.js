
import { portfolioStore } from "./portfolio-store.js";
import { renderDocument } from "./portfolio-render.js";

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
      "No portfolio ID was provided. Open a portfolio from My Portfolios."
    );
    frame.hidden = true;
    downloadButton.disabled = true;
    return;
  }

  try {
    const portfolio = await portfolioStore.get(portfolioId);

    if (!portfolio) {
      showMessage(
        "Portfolio not found. Open it from My Portfolios."
      );
      frame.hidden = true;
      downloadButton.disabled = true;
      return;
    }

    currentPortfolio = portfolio;

    const data = {
      ...(portfolio.content || {}),
      title:
        portfolio.title ||
        portfolio.content?.title ||
        "My Portfolio",
      template_key:
        portfolio.template_key ||
        portfolio.content?.template_key ||
        "simple"
    };

    generatedHTML = renderDocument(data);

    title.textContent = data.title;
    subtitle.textContent =
      `Portfolio by ${data.full_name || "the author"}`;

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

  let printWindow;

  try {
    // Open synchronously during the click to avoid popup blocking.
    printWindow = window.open("", "_blank");

    if (!printWindow) {
      showMessage(
        "Your browser blocked the PDF window. Allow pop-ups for SOYON and try again."
      );
      return;
    }

    // Use the same generated document that contains the selected
    // template's styles, instead of printing the preview iframe.
    printWindow.document.open();
    printWindow.document.write(generatedHTML);
    printWindow.document.close();

    const runPrint = async () => {
      try {
        if (printWindow.document.fonts?.ready) {
          await printWindow.document.fonts.ready;
        }

        const images = Array.from(printWindow.document.images);

        await Promise.all(
          images.map(image => {
            if (image.complete) return Promise.resolve();

            return new Promise(resolve => {
              image.addEventListener("load", resolve, { once: true });
              image.addEventListener("error", resolve, { once: true });
            });
          })
        );

        printWindow.focus();
        printWindow.print();

        showMessage(
          "In the print dialog, choose “Save as PDF” to download your portfolio."
        );
      } catch (error) {
        if (!printWindow.closed) printWindow.close();

        showMessage(
          "Unable to open the PDF export dialog. Please try again."
        );
      }
    };

    if (printWindow.document.readyState === "complete") {
      runPrint();
    } else {
      printWindow.addEventListener("load", runPrint, { once: true });
    }
  } catch (error) {
    if (printWindow && !printWindow.closed) {
      printWindow.close();
    }

    showMessage(
      "Unable to open the PDF export dialog. Please try again."
    );
  }
});

loadPortfolio();

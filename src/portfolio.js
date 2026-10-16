
import { portfolioStore } from "./portfolio-store.js";

const templateNames = {
  simple: "Simple template",
  modern: "Modern template",
  creative: "Creative template"
};

const previewStyles = {
  simple: {
    wrapper: "resume",
    initial: "S"
  },
  modern: {
    wrapper: "marketing",
    initial: "M"
  },
  creative: {
    wrapper: "design",
    initial: "C"
  }
};

const list = document.querySelector("#portfolio-list");
const search = document.querySelector("#portfolio-search");
const toast = document.querySelector("#toast");
const createButton = document.querySelector("#create-portfolio");

const totalCount = document.querySelector("#stat-total");
const publishedCount = document.querySelector("#stat-published");
const draftCount = document.querySelector("#stat-drafts");

let portfolios = [];
let toastTimer = null;

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function notify(message) {
  if (!toast) {
    console.info(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function formatTemplate(templateKey) {
  return templateNames[templateKey] || "Portfolio template";
}

function formatUpdatedDate(portfolio) {
  const value = portfolio.updated_at || portfolio.created_at;

  if (!value) {
    return "Not yet saved";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently updated";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function getTemplateKey(portfolio) {
  const key =
    portfolio.template_key ||
    portfolio.content?.template_key ||
    "simple";

  return Object.hasOwn(previewStyles, key) ? key : "simple";
}

/* Preview cards use the same template keys as the dashboard. */
function previewMarkup(templateKey) {
  const preview = previewStyles[templateKey] || previewStyles.simple;

  if (templateKey === "modern") {
    return `
      <div class="preview marketing">
        <div class="micro">SOYON PORTFOLIO</div>
        <div class="marketing-title">My<br>Portfolio</div>
        <div class="marketing-copy">
          Experience, skills<br>and selected work.
        </div>
        <div class="building"></div>
        <div class="marketing-foot">
          <span>01<br><small>Experience</small></span>
          <span>02<br><small>Projects</small></span>
          <span>03<br><small>Skills</small></span>
        </div>
      </div>
    `;
  }

  if (templateKey === "creative") {
    return `
      <div class="preview design">
        <div class="design-nav">
          <b>MY PORTFOLIO</b>
          <span>Work　 About</span>
        </div>
        <div class="design-title">
          Creative<br>
          work and<br>
          <em>ideas.</em>
        </div>
        <div class="design-desc">
          A selection of skills, projects and experiences.
        </div>
        <div class="plant-scene">
          <div class="plant-pot"></div>
        </div>
      </div>
    `;
  }

  return `
    <div class="preview resume">
      <div class="resume-page">
        <div class="resume-left">
          <div class="mini-name">My Portfolio</div>
          <div class="mini-role">Professional Profile</div>
          <div class="portrait"></div>
          <div class="mini-section">About Me</div>
          <div class="mini-lines"></div>
          <div class="mini-lines"></div>
          <div class="mini-lines" style="width:65%"></div>
        </div>
        <div class="resume-right">
          <div class="mini-section">Experience</div>
          <div class="mini-lines"></div>
          <div class="mini-lines" style="width:75%"></div>
          <div class="mini-section">Education</div>
          <div class="mini-lines"></div>
          <div class="mini-section">Skills</div>
          <div class="mini-lines" style="width:75%"></div>
        </div>
      </div>
    </div>
  `;
}

function cardMarkup(portfolio) {
  const id = String(portfolio.id);
  const title = portfolio.title || "Untitled portfolio";
  const templateKey = getTemplateKey(portfolio);

  const isPublished = portfolio.status === "published";
  const statusClass = isPublished ? "published" : "draft";
  const statusLabel = isPublished ? "Published" : "Draft";

  return `
    <article class="portfolio-card" data-id="${escapeHTML(id)}">
      ${previewMarkup(templateKey)}

      <div class="card-head">
        <div class="card-title-row">
          <h2 class="card-title">${escapeHTML(title)}</h2>

          <button
            class="more-btn"
            type="button"
            data-action="menu"
            aria-label="More options for ${escapeHTML(title)}"
            aria-expanded="false"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="5" r="1.7"/>
              <circle cx="12" cy="12" r="1.7"/>
              <circle cx="12" cy="19" r="1.7"/>
            </svg>
          </button>
        </div>

        <div class="card-menu">
          <button type="button" data-action="rename">Rename</button>
          <button type="button" data-action="duplicate">Duplicate</button>
          <button type="button" data-action="delete">Delete</button>
        </div>
      </div>

      <span class="status ${statusClass}">${statusLabel}</span>

      <div class="updated">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.7" aria-hidden="true">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 7v5l3 2"/>
        </svg>
        Updated ${escapeHTML(formatUpdatedDate(portfolio))}
      </div>

      <button
        class="edit-btn"
        type="button"
        data-action="edit"
        data-edit-id="${escapeHTML(id)}"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.7" aria-hidden="true">
          <path d="m14 5 5 5M4 20l4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11z"/>
        </svg>

        <span>Edit portfolio</span>

        <svg class="arrow" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.7" aria-hidden="true">
          <path d="M4 12h15m-6-6 6 6-6 6"/>
        </svg>
      </button>
    </article>
  `;
}

/* Same editor routing pattern used by dashboard.js. */
function openBuilder(template = "simple", id = null) {
  const params = new URLSearchParams();
  params.set("template", template);

  if (id !== null && id !== undefined && String(id).trim()) {
    params.set("id", String(id));
    params.set("mode", "edit");
  } else {
    params.set("mode", "new");
  }

  window.location.href =
    `./portfolio-editor.html?${params.toString()}`;
}

function createPortfolio() {
  openBuilder("simple");
}

function render() {
  if (!list) return;

  const query = (search?.value || "").trim().toLowerCase();

  const filtered = portfolios.filter(portfolio => {
    const title = portfolio.title || "Untitled portfolio";
    const template = formatTemplate(getTemplateKey(portfolio));

    return `${title} ${template} ${portfolio.status || "draft"}`
      .toLowerCase()
      .includes(query);
  });

  if (totalCount) {
    totalCount.textContent = String(portfolios.length);
  }

  if (publishedCount) {
    publishedCount.textContent = String(
      portfolios.filter(item => item.status === "published").length
    );
  }

  if (draftCount) {
    draftCount.textContent = String(
      portfolios.filter(item => item.status !== "published").length
    );
  }

  if (filtered.length) {
    list.innerHTML = filtered.map(cardMarkup).join("");
    return;
  }

  list.innerHTML = `
    <div class="empty-state">
      <h2>${query ? "No portfolios found" : "Your portfolio space is ready"}</h2>
      <p>
        ${
          query
            ? "Try another search term."
            : "Create a portfolio to start showcasing your skills and work."
        }
      </p>
      ${
        query
          ? ""
          : `
            <button class="primary-btn" type="button" data-action="create">
              <span aria-hidden="true">＋</span>
              Create portfolio
            </button>
          `
      }
    </div>
  `;
}

function showLoadError(error) {
  console.error("Unable to load portfolios:", error);

  if (list) {
    list.innerHTML = `
      <div class="empty-state">
        <h2>Unable to load portfolios</h2>
        <p>${escapeHTML(error.message || "Please try again.")}</p>
        <button class="primary-btn" type="button" data-action="retry">
          Try again
        </button>
      </div>
    `;
  }

  notify("Unable to load your portfolios. Please try again.");
}

/* Use the same store method as dashboard.js. */
async function loadPortfolios() {
  if (list) {
    list.innerHTML = `
      <div class="empty-state">
        <p>Loading your portfolios…</p>
      </div>
    `;
  }

  try {
    portfolios = await portfolioStore.listForDashboard();
    render();
  } catch (error) {
    showLoadError(error);
  }
}

function findPortfolio(id) {
  return portfolios.find(
    item => String(item.id) === String(id)
  );
}

function closeCardMenus() {
  document.querySelectorAll(".card-menu.open").forEach(menu => {
    menu.classList.remove("open");

    const button = menu.parentElement
      ?.querySelector('[data-action="menu"]');

    button?.setAttribute("aria-expanded", "false");
  });
}

async function renamePortfolio(portfolio) {
  const oldTitle = portfolio.title || "Untitled portfolio";
  const newTitle = window.prompt("Rename portfolio:", oldTitle);

  if (newTitle === null) return;

  const title = newTitle.trim();

  if (!title) {
    notify("Portfolio name cannot be empty.");
    return;
  }

  if (title === oldTitle) return;

  const data = {
    title,
    template_key: getTemplateKey(portfolio),
    content: {
      ...(portfolio.content || {}),
      title,
      template_key: getTemplateKey(portfolio)
    }
  };

  try {
    let saved;

    if (portfolio.is_remote || portfolio.remote_id) {
      // Update the account record through the same account store method.
      saved = await portfolioStore.saveToAccount(data, portfolio.id);
    } else {
      // Keep browser-only drafts local until the owner chooses Save to Account.
      saved = await portfolioStore.saveDraft(data, portfolio.id);
    }

    portfolios = portfolios.map(item =>
      String(item.id) === String(portfolio.id) ? saved : item
    );

    render();
    notify("Portfolio renamed.");
  } catch (error) {
    console.error("Unable to rename portfolio:", error);
    notify(`Unable to rename portfolio: ${error.message}`);
  }
}

async function duplicatePortfolio(portfolio) {
  const title = `${portfolio.title || "Untitled portfolio"} (Copy)`;

  const data = {
    title,
    template_key: getTemplateKey(portfolio),
    content: {
      ...(portfolio.content || {}),
      title,
      template_key: getTemplateKey(portfolio)
    }
  };

  try {
    // Duplicate as a local draft; it is not published or shared.
    const duplicate = await portfolioStore.saveDraft(data);

    portfolios = [duplicate, ...portfolios];
    render();
    notify("Portfolio duplicated as a local draft.");
  } catch (error) {
    console.error("Unable to duplicate portfolio:", error);
    notify(`Unable to duplicate portfolio: ${error.message}`);
  }
}

async function deletePortfolio(portfolio) {
  const title = portfolio.title || "Untitled portfolio";

  const confirmed = window.confirm(
    `Delete "${title}"? This action cannot be undone.`
  );

  if (!confirmed) return;

  try {
    await portfolioStore.remove(portfolio.id);

    portfolios = portfolios.filter(
      item => String(item.id) !== String(portfolio.id)
    );

    render();
    notify("Portfolio deleted.");
  } catch (error) {
    console.error("Unable to delete portfolio:", error);
    notify(`Unable to delete portfolio: ${error.message}`);
  }
}

/* Main portfolio-card actions. */
list?.addEventListener("click", async event => {
  const target = event.target;

  if (!(target instanceof Element)) return;

  const button = target.closest("[data-action]");

  if (!button) return;

  const action = button.dataset.action;

  if (action === "create") {
    createPortfolio();
    return;
  }

  if (action === "retry") {
    await loadPortfolios();
    return;
  }

  const card = button.closest(".portfolio-card");

  if (!card) return;

  const portfolio = findPortfolio(card.dataset.id);

  if (!portfolio) {
    notify("This portfolio could not be found. Refresh the page and try again.");
    return;
  }

  if (action === "menu") {
    const menu = card.querySelector(".card-menu");
    const willOpen = !menu?.classList.contains("open");

    closeCardMenus();

    menu?.classList.toggle("open", willOpen);
    button.setAttribute("aria-expanded", String(willOpen));
    return;
  }

  closeCardMenus();

  if (action === "edit") {
    openBuilder(getTemplateKey(portfolio), portfolio.id);
    return;
  }

  if (action === "rename") {
    await renamePortfolio(portfolio);
    return;
  }

  if (action === "duplicate") {
    await duplicatePortfolio(portfolio);
    return;
  }

  if (action === "delete") {
    await deletePortfolio(portfolio);
  }
});

createButton?.addEventListener("click", createPortfolio);
search?.addEventListener("input", render);

document.addEventListener("click", event => {
  if (!(event.target instanceof Element)) return;

  if (!event.target.closest(".card-head")) {
    closeCardMenus();
  }
});

/* Keep the existing mobile navigation controls working. */
const sidebar = document.querySelector("#sidebar");
const overlay = document.querySelector("#mobile-overlay");
const menuToggle = document.querySelector("#menu-toggle");
const mobileClose = document.querySelector("#mobile-close");

function closeSidebar() {
  sidebar?.classList.remove("open");
  overlay?.classList.remove("show");
  menuToggle?.setAttribute("aria-expanded", "false");
}

menuToggle?.addEventListener("click", () => {
  sidebar?.classList.add("open");
  overlay?.classList.add("show");
  menuToggle.setAttribute("aria-expanded", "true");
});

mobileClose?.addEventListener("click", closeSidebar);
overlay?.addEventListener("click", closeSidebar);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeSidebar();
    closeCardMenus();
    document.querySelector("#profile-menu")?.classList.remove("open");
    document.querySelector("#profile-button")?.setAttribute("aria-expanded", "false");
  }
});

/* Existing profile menu and notification interactions. */
const profileButton = document.querySelector("#profile-button");
const profileMenu = document.querySelector("#profile-menu");

profileButton?.addEventListener("click", () => {
  const isOpen = profileMenu?.classList.toggle("open") || false;
  profileButton.setAttribute("aria-expanded", String(isOpen));
});

profileMenu?.addEventListener("click", event => {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[data-action]");

  if (!button) return;

  profileMenu.classList.remove("open");
  profileButton?.setAttribute("aria-expanded", "false");

  if (button.dataset.action === "logout") {
    notify("Connect logout to your SOYON authentication flow.");
  } else {
    notify(`${button.textContent.trim()} is not connected yet.`);
  }
});

document.querySelector("#notification-btn")?.addEventListener("click", () => {
  notify("You're all caught up.");
});

loadPortfolios();

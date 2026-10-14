const seedPortfolios = [
  {
    id: 1,
    title: "Creative Resume",
    status: "draft",
    updated: "Updated 2 hours ago",
    preview: "resume",
    description: "A clean introduction to your experience and skills."
  },
  {
    id: 2,
    title: "Marketing Portfolio",
    status: "published",
    updated: "Updated 1 day ago",
    preview: "marketing",
    description: "Strategic marketing solutions for modern brands."
  },
  {
    id: 3,
    title: "Designer Portfolio",
    status: "published",
    updated: "Updated 3 days ago",
    preview: "design",
    description: "Thoughtful design and selected creative work."
  }
];

let portfolios = loadPortfolios();
let toastTimer;

const list = document.querySelector("#portfolio-list");
const search = document.querySelector("#portfolio-search");
const toast = document.querySelector("#toast");

const escapeHTML = value =>
  String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));

function loadPortfolios() {
  try {
    const saved = localStorage.getItem("soyon-portfolios");

    return saved
      ? JSON.parse(saved)
      : seedPortfolios.map(item => ({ ...item }));
  } catch {
    return seedPortfolios.map(item => ({ ...item }));
  }
}

function save() {
  try {
    localStorage.setItem(
      "soyon-portfolios",
      JSON.stringify(portfolios)
    );
  } catch {
    // Local storage may be unavailable in some browser contexts.
  }
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function previewMarkup(type) {
  if (type === "marketing") {
    return `
      <div class="preview marketing">
        <div class="micro">JORDAN SMITH</div>

        <div class="marketing-title">
          Marketing<br>Portfolio
        </div>

        <div class="marketing-copy">
          Strategic marketing solutions<br>
          for modern brands.
        </div>

        <div class="building"></div>

        <div class="marketing-foot">
          <span>5+<br><small>Years Experience</small></span>
          <span>25+<br><small>Projects Completed</small></span>
          <span>12<br><small>Happy Clients</small></span>
        </div>
      </div>
    `;
  }

  if (type === "design") {
    return `
      <div class="preview design">
        <div class="design-nav">
          <b>TAYLOR KIM</b>
          <span>Work　 About　 Contact</span>
        </div>

        <div class="design-title">
          Design<br>
          creates<br>
          <em>opportunities.</em>
        </div>

        <div class="design-desc">
          A visual designer focused on creating meaningful
          brand experiences.
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
          <div class="mini-name">Alex Rivera</div>
          <div class="mini-role">Software Developer</div>
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

function cardMarkup(item) {
  const status =
    item.status === "published" ? "Published" : "Draft";

  return `
    <article class="portfolio-card" data-id="${item.id}">
      ${previewMarkup(item.preview)}

      <div class="card-head">
        <div class="card-title-row">
          <h2 class="card-title">
            ${escapeHTML(item.title)}
          </h2>

          <button
            class="more-btn"
            data-action="menu"
            aria-label="More options for ${escapeHTML(item.title)}"
            aria-expanded="false"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.7"/>
              <circle cx="12" cy="12" r="1.7"/>
              <circle cx="12" cy="19" r="1.7"/>
            </svg>
          </button>
        </div>

        <div class="card-menu">
          <button data-action="rename">Rename</button>

          <button data-action="toggle-status">
            ${item.status === "published"
              ? "Move to drafts"
              : "Publish portfolio"}
          </button>

          <button data-action="duplicate">Duplicate</button>
          <button data-action="delete">Delete</button>
        </div>
      </div>

      <span class="status ${item.status}">
        ${status}
      </span>

      <div class="updated">
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 7v5l3 2"/>
        </svg>

        ${escapeHTML(item.updated)}
      </div>

      <button class="edit-btn" data-action="edit">
        <svg viewBox="0 0 24 24">
          <path d="m14 5 5 5M4 20l4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11z"/>
        </svg>

        <span>Edit portfolio</span>

        <svg class="arrow" viewBox="0 0 24 24">
          <path d="M4 12h15m-6-6 6 6-6 6"/>
        </svg>
      </button>
    </article>
  `;
}

/* Render portfolio cards and statistics */

function render() {
  const query = search.value.trim().toLowerCase();

  const filtered = portfolios.filter(portfolio =>
    portfolio.title.toLowerCase().includes(query)
  );

  document.querySelector("#stat-total").textContent =
    String(portfolios.length).padStart(2, "0");

  document.querySelector("#stat-published").textContent =
    String(
      portfolios.filter(item => item.status === "published").length
    ).padStart(2, "0");

  document.querySelector("#stat-drafts").textContent =
    String(
      portfolios.filter(item => item.status === "draft").length
    ).padStart(2, "0");

  list.innerHTML = filtered.length
    ? filtered.map(cardMarkup).join("")
    : `
      <div class="empty-state">
        <h2>
          ${query
            ? "No portfolios found"
            : "Your portfolio space is ready"}
        </h2>

        <p>
          ${query
            ? "Try another search term."
            : "Create a portfolio to start showcasing your work."}
        </p>

        ${query
          ? ""
          : `
            <button class="primary-btn" data-action="create">
              <span aria-hidden="true">＋</span>
              Create portfolio
            </button>
          `}
      </div>
    `;
}

/* Create a portfolio */

function createPortfolio() {
  const title = prompt(
    "Give your new portfolio a name:",
    "Untitled Portfolio"
  );

  if (title === null) {
    return;
  }

  if (!title.trim()) {
    notify("Please enter a portfolio name.");
    return;
  }

  const item = {
    id: Date.now(),
    title: title.trim(),
    status: "draft",
    updated: "Updated just now",
    preview: "resume",
    description: "Your new portfolio."
  };

  portfolios.unshift(item);

  save();

  search.value = "";

  render();

  notify("Portfolio created.");
}

document
  .querySelector("#create-portfolio")
  .addEventListener("click", createPortfolio);

search.addEventListener("input", render);

/* Portfolio card actions */

list.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");

  if (!button) {
    return;
  }

  const action = button.dataset.action;

  if (action === "create") {
    createPortfolio();
    return;
  }

  const card = button.closest(".portfolio-card");

  if (!card) {
    return;
  }

  const id = Number(card.dataset.id);
  const item = portfolios.find(portfolio => portfolio.id === id);

  if (!item) {
    return;
  }

  if (action === "menu") {
    const menu = card.querySelector(".card-menu");
    const open = !menu.classList.contains("open");

    document
      .querySelectorAll(".card-menu.open")
      .forEach(openMenu => {
        openMenu.classList.remove("open");

        const menuButton =
          openMenu.parentElement.querySelector('[data-action="menu"]');

        menuButton?.setAttribute("aria-expanded", "false");
      });

    menu.classList.toggle("open", open);

    button.setAttribute("aria-expanded", String(open));

    return;
  }

  card.querySelector(".card-menu")?.classList.remove("open");

  if (action === "rename") {
    const title = prompt("Rename portfolio:", item.title);

    if (title === null) {
      return;
    }

    if (!title.trim()) {
      notify("Name cannot be empty.");
      return;
    }

    item.title = title.trim();
    item.updated = "Updated just now";

    save();
    render();

    notify("Portfolio renamed.");
  } else if (action === "toggle-status") {
    item.status =
      item.status === "published" ? "draft" : "published";

    item.updated = "Updated just now";

    save();
    render();

    notify(
      item.status === "published"
        ? "Portfolio marked as published."
        : "Portfolio moved to drafts."
    );
  } else if (action === "duplicate") {
    const copy = {
      ...item,
      id: Date.now(),
      title: `${item.title} (Copy)`,
      status: "draft",
      updated: "Updated just now"
    };

    portfolios.unshift(copy);

    save();
    render();

    notify("Portfolio duplicated as a draft.");
  } else if (action === "delete") {
    const confirmed = confirm(
      `Delete "${item.title}"? This cannot be undone.`
    );

    if (confirmed) {
      portfolios = portfolios.filter(
        portfolio => portfolio.id !== id
      );

      save();
      render();

      notify("Portfolio deleted.");
    }
  } else if (action === "edit") {
    notify("Portfolio editor integration is not connected yet.");
  }
});

document.addEventListener("click", event => {
  if (!event.target.closest(".card-head")) {
    document.querySelectorAll(".card-menu.open").forEach(menu => {
      menu.classList.remove("open");

      const menuButton =
        menu.parentElement.querySelector('[data-action="menu"]');

      menuButton?.setAttribute("aria-expanded", "false");
    });
  }

  if (
    !event.target.closest(".profile-button") &&
    !event.target.closest(".profile-menu")
  ) {
    document.querySelector("#profile-menu").classList.remove("open");

    document
      .querySelector("#profile-button")
      .setAttribute("aria-expanded", "false");
  }
});

const profileButton = document.querySelector("#profile-button");
const profileMenu = document.querySelector("#profile-menu");

profileButton.addEventListener("click", () => {
  const open = !profileMenu.classList.contains("open");

  profileMenu.classList.toggle("open", open);

  profileButton.setAttribute("aria-expanded", String(open));
});

profileMenu.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  profileMenu.classList.remove("open");

  profileButton.setAttribute("aria-expanded", "false");

  const action = button.dataset.action;

  if (action === "logout") {
    if (confirm("Log out of SOYON?")) {
      notify("Connect this action to your authentication flow.");
    }
  } else {
    notify(`${button.textContent} is not connected yet.`);
  }
});

document
  .querySelector("#notification-btn")
  .addEventListener("click", () => {
    notify("You're all caught up.");
  });

const sidebar = document.querySelector("#sidebar");
const overlay = document.querySelector("#mobile-overlay");
const toggle = document.querySelector("#menu-toggle");

function closeNav() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");

  toggle.setAttribute("aria-expanded", "false");
}

toggle.addEventListener("click", () => {
  sidebar.classList.add("open");
  overlay.classList.add("show");

  toggle.setAttribute("aria-expanded", "true");
});

document
  .querySelector("#mobile-close")
  .addEventListener("click", closeNav);

overlay.addEventListener("click", closeNav);

window.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeNav();

    profileMenu.classList.remove("open");

    profileButton.setAttribute("aria-expanded", "false");

    document.querySelectorAll(".card-menu.open").forEach(menu => {
      menu.classList.remove("open");
    });
  }
});

render();
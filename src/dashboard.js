
import "./index.css";

const SAMPLE_PORTFOLIOS = [
  {
    id: "sample-1",
    title: "Creative Resume",
    template_key: "simple",
    status: "draft",
    updated_at: "2 hours ago",
    description: "A clean introduction to your experience and skills.",
  },
  {
    id: "sample-2",
    title: "Marketing Portfolio",
    template_key: "modern",
    status: "published",
    updated_at: "Yesterday",
    description: "Campaigns, strategy, and selected project highlights.",
  },
  {
    id: "sample-3",
    title: "Designer Portfolio",
    template_key: "creative",
    status: "published",
    updated_at: "3 days ago",
    description: "A visual collection of projects and creative work.",
  },
];

const templateNames = {
  simple: "Simple template",
  modern: "Modern template",
  creative: "Creative template",
};

const previewStyles = {
  simple: {
    wrapper: "bg-[#f5f0e8]",
    page: "bg-white",
    accent: "bg-slate-800",
    secondary: "bg-stone-300",
    label: "text-slate-600",
  },
  modern: {
    wrapper: "bg-slate-900",
    page: "bg-slate-800",
    accent: "bg-blue-300",
    secondary: "bg-slate-600",
    label: "text-blue-200",
  },
  creative: {
    wrapper: "bg-indigo-50",
    page: "bg-white",
    accent: "bg-indigo-600",
    secondary: "bg-blue-200",
    label: "text-indigo-700",
  },
};

const portfolioList = document.querySelector("#portfolio-list");
const portfolioCount = document.querySelector("#stat-total");
const publishedCount = document.querySelector("#stat-published");
const draftCount = document.querySelector("#stat-drafts");
const searchInput = document.querySelector("#portfolio-search");
const message = document.querySelector("#dashboard-message");
const emptyState = document.querySelector("#empty-state");

let portfolios = [...SAMPLE_PORTFOLIOS];

const navigationStyles = document.createElement("style");

navigationStyles.textContent = `
  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-radius: 0.75rem;
    padding: 0.8rem 0.9rem;
    color: #475569;
    font-size: 0.9rem;
    font-weight: 500;
    transition: background-color 160ms ease,
                color 160ms ease;
  }

  .nav-link:hover {
    background: #f1f5f9;
    color: #1d4ed8;
  }

  .nav-link-active {
    background: #eff6ff;
    color: #1d4ed8;
    font-weight: 700;
  }

  .nav-link-active svg {
    color: #2563eb;
  }

  @media (prefers-reduced-motion: reduce) {
    .nav-link {
      transition: none;
    }
  }
`;

document.head.appendChild(navigationStyles);

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function formatTemplate(templateKey) {
  return templateNames[templateKey] || "Portfolio template";
}

function renderPreview(templateKey) {
  const style = previewStyles[templateKey] || previewStyles.simple;
  const modern = templateKey === "modern";
  const creative = templateKey === "creative";

  return `
    <div class="flex aspect-[16/9] items-center justify-center overflow-hidden rounded-xl ${style.wrapper} p-4 sm:p-5">
      <div class="w-full max-w-[250px] ${style.page} ${modern ? "p-4 text-white" : "p-4 shadow-sm"}">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div class="h-2 w-2/5 rounded ${style.accent}"></div>
          <div class="h-1 w-1/5 rounded ${style.secondary}"></div>
        </div>

        <div class="mb-2 h-2.5 w-4/5 rounded ${style.accent}"></div>
        <div class="mb-1 h-1 w-full rounded ${style.secondary}"></div>
        <div class="h-1 w-3/4 rounded ${style.secondary}"></div>

        <div class="my-3 border-t ${modern ? "border-slate-600" : "border-stone-200"}"></div>

        <div class="grid grid-cols-[1fr_.75fr] gap-3">
          <div class="space-y-1.5">
            <div class="h-1.5 w-3/4 rounded ${style.accent}"></div>
            <div class="h-1 w-full rounded ${style.secondary}"></div>
            <div class="h-1 w-4/5 rounded ${style.secondary}"></div>
            <div class="mt-2 h-1 w-2/3 rounded ${style.secondary}"></div>
          </div>

          <div class="flex min-h-12 items-center justify-center rounded ${style.secondary} ${creative ? "rotate-2" : ""}">
            <span class="text-lg font-bold ${style.label}">
              ${modern ? "M" : creative ? "C" : "S"}
            </span>
          </div>
        </div>
      </div>
    </div>`;
}

function renderPortfolioCard(portfolio) {
  const isPublished = portfolio.status === "published";

  const statusClasses = isPublished
    ? "bg-emerald-50 text-emerald-700"
    : "bg-amber-50 text-amber-700";

  const statusLabel = isPublished ? "Published" : "Draft";

  return `
    <article
      class="portfolio-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.02] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-900/[0.05]"
      data-title="${escapeHTML(portfolio.title).toLowerCase()}"
      data-portfolio-id="${escapeHTML(portfolio.id)}"
    >
      ${renderPreview(portfolio.template_key)}

      <div class="flex items-start justify-between gap-3 pt-4">
        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            ${escapeHTML(formatTemplate(portfolio.template_key))}
          </p>

          <h3 class="mt-1 truncate font-bold text-slate-900">
            ${escapeHTML(portfolio.title)}
          </h3>
        </div>

        <button
          type="button"
          class="portfolio-menu-button rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          data-menu-id="${escapeHTML(portfolio.id)}"
          aria-label="More actions for ${escapeHTML(portfolio.title)}"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="1.5"/>
            <circle cx="12" cy="12" r="1.5"/>
            <circle cx="19" cy="12" r="1.5"/>
          </svg>
        </button>
      </div>

      <div class="mt-2 flex flex-wrap items-center gap-2">
        <span class="rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses}">
          ${statusLabel}
        </span>
        <span class="text-xs text-slate-400">
          Updated ${escapeHTML(portfolio.updated_at || "recently")}
        </span>
      </div>

      <p class="mt-3 min-h-10 text-sm leading-5 text-slate-500">
        ${escapeHTML(portfolio.description || "Your portfolio content and projects.")}
      </p>

      <button
        type="button"
        class="edit-portfolio mt-4 flex w-full items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        data-edit-id="${escapeHTML(portfolio.id)}"
      >
        <span class="inline-flex items-center gap-2">
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="m14 5 5 5M4 20l4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11z"/>
          </svg>
          Edit portfolio
        </span>
        <span aria-hidden="true">→</span>
      </button>
    </article>`;
}

function renderPortfolios() {
  const query = (searchInput?.value || "").trim().toLowerCase();

  const filtered = portfolios.filter((portfolio) => {
    const searchableText = [
      portfolio.title,
      formatTemplate(portfolio.template_key),
      portfolio.status,
    ].join(" ").toLowerCase();

    return searchableText.includes(query);
  });

  if (portfolioList) {
    portfolioList.innerHTML = filtered.map(renderPortfolioCard).join("");
  }

  if (portfolioCount) {
    portfolioCount.textContent = String(portfolios.length);
  }

  if (publishedCount) {
    publishedCount.textContent = String(
      portfolios.filter((item) => item.status === "published").length
    );
  }

  if (draftCount) {
    draftCount.textContent = String(
      portfolios.filter((item) => item.status !== "published").length
    );
  }

  emptyState?.classList.toggle("hidden", portfolios.length !== 0);

  if (portfolioList) {
    portfolioList.classList.toggle("hidden", portfolios.length === 0);
  }

  if (message) {
    message.textContent =
      query && filtered.length === 0
        ? `No portfolios found for “${searchInput.value.trim()}”.`
        : "";
  }
}

function showMessage(text) {
  if (message) {
    message.textContent = text;
  }
}

function openBuilder(template = "simple") {
  const destination = new URL("./builder.html", window.location.href);
  destination.searchParams.set("template", template);
  window.location.href = destination.toString();
}

document.querySelector("#create-portfolio")?.addEventListener("click", () => {
  openBuilder("simple");
});

document.querySelector(".create-empty-state")?.addEventListener("click", () => {
  openBuilder("simple");
});

document.querySelectorAll(".choose-template").forEach((button) => {
  button.addEventListener("click", () => {
    openBuilder(button.dataset.template || "simple");
  });
});

searchInput?.addEventListener("input", renderPortfolios);

portfolioList?.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-id]");

  if (editButton) {
    const portfolio = portfolios.find(
      (item) => item.id === editButton.dataset.editId
    );

    if (portfolio?.id.startsWith("sample-")) {
      showMessage(
        "This is sample content. Connect saved portfolio records to enable editing."
      );
      return;
    }

    if (portfolio) {
      openBuilder(portfolio.template_key);
    }

    return;
  }

  const menuButton = event.target.closest("[data-menu-id]");

  if (menuButton) {
    const portfolio = portfolios.find(
      (item) => item.id === menuButton.dataset.menuId
    );

    if (portfolio) {
      showMessage(
        `${portfolio.title}: connect saved records to enable portfolio actions.`
      );
    }
  }
});

const sidebar = document.querySelector("#sidebar");
const overlay = document.querySelector("#sidebar-overlay");

function setSidebarOpen(open) {
  sidebar?.classList.toggle("-translate-x-full", !open);
  overlay?.classList.toggle("hidden", !open);
  document.body.classList.toggle("overflow-hidden", open);
}

document.querySelector("#open-sidebar")?.addEventListener("click", () => {
  setSidebarOpen(true);
});

document.querySelector("#close-sidebar")?.addEventListener("click", () => {
  setSidebarOpen(false);
});

overlay?.addEventListener("click", () => {
  setSidebarOpen(false);
});

document.querySelectorAll("[data-scroll-target]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.dataset.scrollTarget;
    const target = targetId ? document.getElementById(targetId) : null;

    if (target) {
      event.preventDefault();
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      history.replaceState(null, "", `#${targetId}`);
    }

    setSidebarOpen(false);
    document.querySelector("#profile-menu")?.classList.add("hidden");
  });
});

const profileMenu = document.querySelector("#profile-menu");

document.querySelector("#profile-button")?.addEventListener("click", () => {
  profileMenu?.classList.toggle("hidden");
});

document.addEventListener("click", (event) => {
  if (
    !event.target.closest("#profile-button") &&
    !event.target.closest("#profile-menu")
  ) {
    profileMenu?.classList.add("hidden");
  }
});

document.querySelector("#sign-out-button")?.addEventListener("click", () => {
  showMessage("Connect this action to your Supabase sign-out handler.");
  profileMenu?.classList.add("hidden");
});

document.querySelector("#notification-button")?.addEventListener("click", () => {
  showMessage("You're all caught up. Notifications will appear here when enabled.");
});

const displayName = window.SOYON_USER_NAME;

if (typeof displayName === "string" && displayName.trim()) {
  const firstName = displayName.trim().split(/\s+/)[0];

  const welcomeName = document.querySelector("#welcome-name");
  if (welcomeName) {
    welcomeName.textContent = `, ${firstName}`;
  }

  const profileName = document.querySelector("#profile-name");
  if (profileName) {
    profileName.textContent = displayName.trim();
  }

  const avatar = document.querySelector("#profile-avatar");
  if (avatar) {
    avatar.textContent = firstName.charAt(0).toUpperCase();
  }
}

const year = document.querySelector("#current-year");

if (year) {
  year.textContent = String(new Date().getFullYear());
}
renderPortfolios();

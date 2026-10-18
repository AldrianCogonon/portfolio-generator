import "./index.css";
import { portfolioStore } from "./portfolio-store.js";

const templateNames = {
  simple: "Simple template",
  modern: "Modern template",
  creative: "Creative template"
};

const previewStyles = {
  simple: {
    wrapper: "bg-[#f5f0e8]",
    page: "bg-white",
    accent: "bg-slate-800",
    secondary: "bg-stone-300",
    label: "text-slate-600"
  },
  modern: {
    wrapper: "bg-rose-50",
    page: "bg-white",
    accent: "bg-[#741f42]",
    secondary: "bg-rose-100",
    label: "text-[#741f42]"
  },
  creative: {
    wrapper: "bg-indigo-50",
    page: "bg-white",
    accent: "bg-indigo-600",
    secondary: "bg-blue-200",
    label: "text-indigo-700"
  }
};

const portfolioList = document.querySelector("#portfolio-list");
const portfolioCount = document.querySelector("#stat-total");
const publishedCount = document.querySelector("#stat-published");
const draftCount = document.querySelector("#stat-drafts");
const message = document.querySelector("#dashboard-message");
const emptyState = document.querySelector("#empty-state");

let portfolios = [];

const navigationStyles = document.createElement("style");

navigationStyles.textContent = `
  .nav-link {
    display: flex;
    align-items: center;
    gap: .75rem;
    border-radius: .75rem;
    padding: .8rem .9rem;
    color: #475569;
    font-size: .9rem;
    font-weight: 500;
    transition: background-color 160ms ease, color 160ms ease;
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

  @media (prefers-reduced-motion: reduce) {
    .nav-link {
      transition: none;
    }
  }
`;

document.head.appendChild(navigationStyles);

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
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
      <div class="w-full max-w-[250px] ${style.page} ${modern ? "p-4 shadow-sm" : "p-4 shadow-sm"}">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div class="h-2 w-2/5 rounded ${style.accent}"></div>
          <div class="h-1 w-1/5 rounded ${style.secondary}"></div>
        </div>
        <div class="mb-2 h-2.5 w-4/5 rounded ${style.accent}"></div>
        <div class="mb-1 h-1 w-full rounded ${style.secondary}"></div>
        <div class="h-1 w-3/4 rounded ${style.secondary}"></div>
        <div class="my-3 border-t ${modern ? "border-rose-200" : "border-stone-200"}"></div>
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

  const statusLabel = isPublished ? "Published" : "Pending";

  const updated = portfolio.updated_at
    ? new Date(portfolio.updated_at).toLocaleDateString()
    : "Not yet saved";

  const portfolioTitle = portfolio.title || "Untitled portfolio";

  return `
    <article
      class="portfolio-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.02] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
      data-portfolio-id="${escapeHTML(portfolio.id)}"
    >
      ${renderPreview(portfolio.template_key)}

      <div class="flex items-start justify-between gap-3 pt-4">
        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            ${escapeHTML(formatTemplate(portfolio.template_key))}
          </p>

          <h3 class="mt-1 truncate font-bold text-slate-900">
            ${escapeHTML(portfolioTitle)}
          </h3>
        </div>

        <button
          type="button"
          class="portfolio-menu-button rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          data-menu-id="${escapeHTML(portfolio.id)}"
          aria-label="More actions for ${escapeHTML(portfolioTitle)}"
        ></button>
      </div>

      <div class="mt-2 flex flex-wrap items-center gap-2">
        <span class="rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses}">
          ${statusLabel}
        </span>

        <span class="text-xs text-slate-400">
          Updated ${escapeHTML(updated)}
        </span>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          class="view-portfolio flex-1 rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          data-view-id="${escapeHTML(portfolio.id)}"
        >
          View
        </button>

        <button
          type="button"
          class="edit-portfolio flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          data-edit-id="${escapeHTML(portfolio.id)}"
        >
          Edit
        </button>

        <button
          type="button"
          class="delete-portfolio rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          data-delete-id="${escapeHTML(portfolio.id)}"
          aria-label="Delete ${escapeHTML(portfolioTitle)}"
        >
          Delete
        </button>
      </div>
    </article>`;
}

function renderPortfolios() {
  if (portfolioList) {
    portfolioList.innerHTML = portfolios.map(renderPortfolioCard).join("");
    portfolioList.classList.toggle("hidden", portfolios.length === 0);
  }

  if (portfolioCount) {
    portfolioCount.textContent = String(portfolios.length);
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

  emptyState?.classList.toggle("hidden", portfolios.length !== 0);
}

function showMessage(text) {
  if (message) {
    message.textContent = text;
  }
}

async function loadPortfolios() {
  showMessage("Loading your portfolios…");

  try {
    portfolios = await portfolioStore.listForDashboard();
    renderPortfolios();
    showMessage("");
  } catch (error) {
    console.error("Unable to load portfolios:", error);

    portfolios = await portfolioStore.list().catch(() => []);
    renderPortfolios();

    showMessage(
      `Unable to load your online portfolios: ${error.message}. Local drafts are still available.`
    );
  }
}

function openBuilder(template = "simple", id = null) {
  const params = new URLSearchParams();

  params.set("template", template);

  if (id) {
    params.set("id", id);
    params.set("mode", "edit");
  } else {
    params.set("mode", "new");
  }

  location.href = `./portfolio-editor.html?${params.toString()}`;
}
function confirmDeletePortfolio(portfolioTitle) {
  document.querySelector("#delete-confirmation-dialog")?.remove();

  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.id = "delete-confirmation-dialog";
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9999;display:flex;
      align-items:center;justify-content:center;padding:16px;
      background:rgba(15,23,42,.45);
    `;

    overlay.innerHTML = `
      <section role="alertdialog" aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        style="box-sizing:border-box;width:100%;max-width:420px;
          padding:24px;background:#fff;border:1px solid #e2e8f0;
          border-radius:16px;box-shadow:0 24px 60px rgba(15,23,42,.2);
          color:#0f172a;font-family:inherit;">
        <div aria-hidden="true" style="display:grid;place-items:center;
          width:44px;height:44px;border-radius:12px;background:#eff6ff;
          color:#1d4ed8;font-size:22px;margin-bottom:16px;">!</div>
        <h2 id="delete-dialog-title"
          style="margin:0;font-size:19px;font-weight:700;color:#0f172a;">
          Delete portfolio?
        </h2>
        <p id="delete-dialog-description"
          style="margin:10px 0 0;color:#475569;font-size:14px;line-height:1.6;">
          Are you sure you want to delete
          <strong data-dialog-portfolio style="color:#1e293b;"></strong>?
          This action cannot be undone.
        </p>
        <div style="display:flex;justify-content:flex-end;gap:10px;
          flex-wrap:wrap;margin-top:24px;">
          <button type="button" data-dialog-cancel
            style="padding:10px 16px;border:1px solid #cbd5e1;
              border-radius:10px;background:#fff;color:#334155;
              font:inherit;font-size:14px;font-weight:600;cursor:pointer;">
            Cancel
          </button>
          <button type="button" data-dialog-confirm
            style="padding:10px 16px;border:1px solid #1d4ed8;
              border-radius:10px;background:#2563eb;color:#fff;
              font:inherit;font-size:14px;font-weight:600;cursor:pointer;">
            Delete portfolio
          </button>
        </div>
      </section>`;

    overlay.querySelector("[data-dialog-portfolio]").textContent =
      `"${portfolioTitle}"`;

    const cancel = overlay.querySelector("[data-dialog-cancel]");
    const confirm = overlay.querySelector("[data-dialog-confirm]");
    let finished = false;

    function finish(result) {
      if (finished) return;
      finished = true;
      document.removeEventListener("keydown", onKeydown);
      overlay.remove();
      resolve(result);
    }

    function onKeydown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        finish(false);
      } else if (event.key === "Tab") {
        event.preventDefault();
        (document.activeElement === cancel ? confirm : cancel).focus();
      }
    }

    cancel.addEventListener("click", () => finish(false));
    confirm.addEventListener("click", () => finish(true));
    overlay.addEventListener("click", event => {
      if (event.target === overlay) finish(false);
    });

    document.addEventListener("keydown", onKeydown);
    document.body.appendChild(overlay);
    cancel.focus();
  });
}
document.querySelector("#create-portfolio")?.addEventListener("click", () => {
  openBuilder("simple");
});

document.querySelector(".create-empty-state")?.addEventListener("click", () => {
  openBuilder("simple");
});

document.querySelectorAll(".choose-template").forEach(button => {
  button.addEventListener("click", () => {
    openBuilder(button.dataset.template || "simple");
  });
});

portfolioList?.addEventListener("click", async event => {
  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  const viewButton = target.closest("[data-view-id]");

  if (viewButton) {
    const portfolioId = viewButton.dataset.viewId;

    if (portfolioId) {
      const params = new URLSearchParams({ id: portfolioId });
      window.location.href = `./view-portfolio.html?${params.toString()}`;
    }

    return;
  }

  const editButton = target.closest("[data-edit-id]");

  if (editButton) {
    const portfolio = portfolios.find(
      item => String(item.id) === String(editButton.dataset.editId)
    );

    if (portfolio) {
      openBuilder(portfolio.template_key || "simple", portfolio.id);
    }

    return;
  }

  const deleteButton = target.closest("[data-delete-id]");

  if (deleteButton) {
    const portfolio = portfolios.find(
      item => String(item.id) === String(deleteButton.dataset.deleteId)
    );

    if (!portfolio) {
      return;
    }

    const portfolioTitle = portfolio.title || "Untitled portfolio";
    const confirmed = window.confirm(
      `Delete "${portfolioTitle}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    deleteButton.disabled = true;
    deleteButton.textContent = "Deleting…";

    try {
      await portfolioStore.remove(portfolio.id);

      portfolios = portfolios.filter(
        item => String(item.id) !== String(portfolio.id)
      );

      renderPortfolios();
      showMessage("Portfolio deleted successfully.");
    } catch (error) {
      console.error("Portfolio deletion failed:", error);

      deleteButton.disabled = false;
      deleteButton.textContent = "Delete";

      showMessage(
        `Unable to delete "${portfolioTitle}": ${error.message}. Your portfolio has been kept so you can retry.`
      );
    }

    return;
  }

  const menuButton = target.closest("[data-menu-id]");

  if (menuButton) {
    const portfolio = portfolios.find(
      item => String(item.id) === String(menuButton.dataset.menuId)
    );

    if (portfolio) {
      showMessage(
        `${portfolio.title || "Untitled portfolio"} — use Edit to make changes, or Delete to remove it.`
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

document.querySelectorAll("[data-scroll-target]").forEach(link => {
  link.addEventListener("click", event => {
    const targetId = link.dataset.scrollTarget;
    const target = targetId ? document.getElementById(targetId) : null;

    if (target) {
      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      history.replaceState(null, "", `#${targetId}`);
    }

    setSidebarOpen(false);
    profileMenu?.classList.add("hidden");
  });
});

function scrollToHashTarget() {
  const targetId = decodeURIComponent(window.location.hash.slice(1));

  if (!targetId) {
    return;
  }

  const target = document.getElementById(targetId);

  if (!target) {
    return;
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start"
      });
    });
  });
}

if (document.readyState === "complete") {
  scrollToHashTarget();
} else {
  window.addEventListener("load", scrollToHashTarget, { once: true });
}

const profileMenu = document.querySelector("#profile-menu");
const profileButton = document.querySelector("#profile-button");

profileButton?.addEventListener("click", event => {
  event.stopPropagation();

  const isOpening = profileMenu?.classList.contains("hidden");

  profileMenu?.classList.toggle("hidden");
  profileButton.setAttribute("aria-expanded", String(Boolean(isOpening)));
});

document.addEventListener("click", event => {
  const target = event.target;

  if (
    target instanceof Element &&
    !target.closest("#profile-button") &&
    !target.closest("#profile-menu")
  ) {
    profileMenu?.classList.add("hidden");
    profileButton?.setAttribute("aria-expanded", "false");
  }
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

loadPortfolios();
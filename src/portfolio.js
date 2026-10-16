
import { portfolioStore } from "./portfolio-store.js";
import { supabase } from "../supabase.js";

const toast = document.querySelector("#toast");
const list = document.querySelector("#portfolio-list");
const totalStat = document.querySelector("#stat-total");
const publishedStat = document.querySelector("#stat-published");
const draftsStat = document.querySelector("#stat-drafts");
const emptyState = document.querySelector("#empty-state");
const createButton = document.querySelector("#create-portfolio");
const profileButton = document.querySelector("#profile-button");
const profileMenu = document.querySelector("#profile-menu");
const sidebar = document.querySelector("#sidebar");
const sidebarOverlay = document.querySelector("#sidebar-overlay");
const openSidebarButton = document.querySelector("#open-sidebar");
const closeSidebarButton = document.querySelector("#close-sidebar");

let portfolios = [];
let toastTimer;

const templateNames = {
  simple: "Simple template",
  modern: "Modern template",
  creative: "Creative template"
};

const previewStyles = {
  simple: {
    wrapper: "bg-[#f5f0e8]", page: "bg-white",
    accent: "bg-slate-800", secondary: "bg-stone-300",
    label: "text-slate-600"
  },
  modern: {
    wrapper: "bg-slate-900", page: "bg-slate-800",
    accent: "bg-blue-300", secondary: "bg-slate-600",
    label: "text-blue-200"
  },
  creative: {
    wrapper: "bg-indigo-50", page: "bg-white",
    accent: "bg-indigo-600", secondary: "bg-blue-200",
    label: "text-indigo-700"
  }
};

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}
function updateProfileButton(user) {
  const profileName = document.querySelector("#profile-name");
  const profileAvatar = document.querySelector("#profile-avatar");

  if (!profileName || !profileAvatar) return;

  if (!user) {
    profileName.textContent = "Guest";
    profileAvatar.textContent = "G";
    return;
  }

  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    "User";

  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();

  profileName.textContent = name;
  profileAvatar.textContent = initials || "U";
  profileButton?.setAttribute(
    "aria-label",
    `Open profile menu for ${name}`
  );
}
function notify(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2800);
}

function formatTemplate(key) {
  return templateNames[key] || "Portfolio template";
}

function formatUpdated(item) {
  const value = item.updated_at || item.created_at;
  if (!value) return "Not yet saved";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not yet saved" : date.toLocaleDateString();
}

function normalizePortfolio(item) {
  const content = item.portfolio_data || item.content || {};
  return {
    ...item,
    title: item.title || content.title || "Untitled portfolio",
    description: content.about || content.description || "Your portfolio project.",
    template_key: item.template_key || content.template_key || "simple",
    status: item.status === "published" ? "published" : "pending",
    updated: formatUpdated(item)
  };
}

function openBuilder(template = "simple", id = null) {
  const params = new URLSearchParams({ template });
  if (id !== null && id !== undefined && id !== "") {
    params.set("id", String(id));
    params.set("mode", "edit");
  } else {
    params.set("mode", "new");
  }
  window.location.href = `./portfolio-editor.html?${params.toString()}`;
}

/* Custom confirmation dialog: slate-and-blue sidebar palette. */
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
            <span class="text-lg font-bold ${style.label}">${modern ? "M" : creative ? "C" : "S"}</span>
          </div>
        </div>
      </div>
    </div>`;
}

function renderPortfolioCard(portfolio) {
  const id = String(portfolio.id);
  const title = portfolio.title || "Untitled portfolio";
  const published = portfolio.status === "published";

  return `
    <article class="portfolio-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.02] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
      data-portfolio-id="${escapeHTML(id)}">
      ${renderPreview(portfolio.template_key)}
      <div class="flex items-start justify-between gap-3 pt-4">
        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">${escapeHTML(formatTemplate(portfolio.template_key))}</p>
          <h3 class="mt-1 truncate font-bold text-slate-900">${escapeHTML(title)}</h3>
        </div>
      </div>
      <p class="mt-2 line-clamp-2 text-sm text-slate-500">${escapeHTML(portfolio.description)}</p>
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <span class="rounded-full px-2.5 py-1 text-xs font-semibold ${published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}">${published ? "Published" : "Pending"}</span>
        <span class="text-xs text-slate-400">Updated ${escapeHTML(portfolio.updated)}</span>
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" class="view-portfolio flex-1 rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700" data-view-id="${escapeHTML(id)}">View</button>
        <button type="button" class="edit-portfolio flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700" data-edit-id="${escapeHTML(id)}">Edit</button>
        <button type="button" class="delete-portfolio rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50" data-delete-id="${escapeHTML(id)}" aria-label="Delete ${escapeHTML(title)}">Delete</button>
      </div>
    </article>`;
}

function renderStats() {
  if (totalStat) totalStat.textContent = String(portfolios.length);
  if (publishedStat) publishedStat.textContent =
    String(portfolios.filter(item => item.status === "published").length);
  if (draftsStat) draftsStat.textContent =
    String(portfolios.filter(item => item.status !== "published").length);
}

function renderPortfolios() {
  if (!list) return;

  list.innerHTML = portfolios.map(renderPortfolioCard).join("");

  emptyState?.classList.toggle("hidden", portfolios.length > 0);

  renderStats();
}

async function loadPortfolios() {
  if (list) {
    list.innerHTML = `<div class="col-span-full p-8 text-center text-slate-500">Loading your portfolios…</div>`;
  }

  try {
    portfolios = (await portfolioStore.listForDashboard()).map(normalizePortfolio);
    renderPortfolios();
  } catch (error) {
    console.error("Unable to load portfolios:", error);

    try {
      portfolios = (await portfolioStore.list()).map(normalizePortfolio);
      renderPortfolios();
    } catch (localError) {
      console.error("Unable to load local drafts:", localError);
      portfolios = [];
      renderPortfolios();
    }

    notify(`Could not load online portfolios: ${error.message}`);
  }
}

function findPortfolio(id) {
  return portfolios.find(item => String(item.id) === String(id));
}

async function handlePortfolioClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const viewButton = target.closest("[data-view-id]");
  if (viewButton) {
    const id = viewButton.dataset.viewId;
    if (id) window.location.href = `./view-portfolio.html?${new URLSearchParams({ id })}`;
    return;
  }

  const editButton = target.closest("[data-edit-id]");
  if (editButton) {
    const portfolio = findPortfolio(editButton.dataset.editId);
    if (portfolio) openBuilder(portfolio.template_key || "simple", portfolio.id);
    return;
  }

  const deleteButton = target.closest("[data-delete-id]");
  if (deleteButton) {
    const portfolio = findPortfolio(deleteButton.dataset.deleteId);
    if (!portfolio) return;

    const title = portfolio.title || "Untitled portfolio";
    if (!(await confirmDeletePortfolio(title))) return;

    deleteButton.disabled = true;
    deleteButton.textContent = "Deleting…";

    try {
      await portfolioStore.remove(portfolio.id);
      await loadPortfolios();
      notify("Portfolio deleted successfully.");
    } catch (error) {
      console.error("Unable to delete portfolio:", error);
      deleteButton.disabled = false;
      deleteButton.textContent = "Delete";
      notify(`Could not delete portfolio: ${error.message}`);
    }
  }
}

function openSidebar() {
  if (!sidebar) return;
  sidebar.classList.remove("-translate-x-full");
  sidebarOverlay?.classList.remove("hidden");
  openSidebarButton?.setAttribute("aria-expanded", "true");
}

function closeSidebar() {
  if (!sidebar) return;
  sidebar.classList.add("-translate-x-full");
  sidebarOverlay?.classList.add("hidden");
  openSidebarButton?.setAttribute("aria-expanded", "false");
}

createButton?.addEventListener("click", () => openBuilder("simple"));
document.querySelector(".create-empty-state")?.addEventListener("click", () => openBuilder("simple"));
list?.addEventListener("click", handlePortfolioClick);

profileButton?.addEventListener("click", event => {
  event.stopPropagation();
  const isOpen = profileMenu?.classList.toggle("open") || false;
  profileButton.setAttribute("aria-expanded", String(isOpen));
});

profileMenu?.addEventListener("click", event => {
  const target = event.target;

  if (!(target instanceof Element)) return;

  const button = target.closest('[data-action="logout"]');
  if (!button) return;

  profileMenu.classList.remove("open");
  profileButton?.setAttribute("aria-expanded", "false");

  window.location.href = "./login.html";
});

document.querySelectorAll('[data-action="templates"]').forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    window.location.href = "./templates.html";
  });
});

openSidebarButton?.addEventListener("click", openSidebar);
closeSidebarButton?.addEventListener("click", closeSidebar);
sidebarOverlay?.addEventListener("click", closeSidebar);

document.addEventListener("click", event => {
  if (profileMenu && profileButton &&
      !profileMenu.contains(event.target) &&
      !profileButton.contains(event.target)) {
    profileMenu.classList.remove("open");
    profileButton.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    profileMenu?.classList.remove("open");
    profileButton?.setAttribute("aria-expanded", "false");
    closeSidebar();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 1024) {
    sidebarOverlay?.classList.add("hidden");
    sidebar?.classList.remove("-translate-x-full");
  } else if (sidebar && !sidebarOverlay?.classList.contains("hidden")) {
    sidebar.classList.remove("-translate-x-full");
  } else {
    sidebar?.classList.add("-translate-x-full");
  }
});
async function loadProfile() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Unable to load profile:", error);
    return;
  }

  updateProfileButton(data.user);
}

loadProfile();

loadPortfolios();

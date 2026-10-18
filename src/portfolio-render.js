const escapeHTML = (value = "") =>
  String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

function lines(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item ?? "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\n+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function splitSkills(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item ?? "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/[,\n]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function safeUrl(value) {
  const url = String(value || "").trim();

  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) {
    return url;
  }

  return "";
}

/*
 * Profile uploads from portfolio-editor.js are stored as data URLs.
 * Allow ordinary web image URLs and base64 raster images only.
 */
function safeImageSource(value) {
  const src = String(value || "").trim();

  if (/^https?:\/\//i.test(src)) {
    return src;
  }

  if (
    /^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(src)
  ) {
    return src;
  }

  return "";
}

function getInitials(name) {
  return String(name || "Your Name")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "YN";
}

function getImage(name, imageUrl, className = "avatar") {
  const src = safeImageSource(imageUrl);

  if (src) {
    return `
      <img
        class="${escapeHTML(className)}"
        src="${escapeHTML(src)}"
        alt="${escapeHTML(name || "Profile")} profile picture"
        onerror="this.style.display='none'"
      >
    `;
  }

  return `
    <div class="${escapeHTML(className)} avatar-placeholder" aria-label="Profile image placeholder">
      ${escapeHTML(getInitials(name))}
    </div>
  `;
}

function section(title, body, className = "section") {
  return body
    ? `<section class="${escapeHTML(className)}"><h2>${escapeHTML(title)}</h2>${body}</section>`
    : "";
}

function entryList(value) {
  return lines(value)
    .map(item => `<li>${escapeHTML(item)}</li>`)
    .join("");
}

function renderTextEntries(value, className = "entry") {
  return lines(value)
    .map(item => `<div class="${escapeHTML(className)}">${escapeHTML(item)}</div>`)
    .join("");
}

function parseEntry(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      date: value.date || value.period || value.year || "",
      title: value.title || value.degree || value.position || value.name || "",
      subtitle:
        value.subtitle ||
        value.school ||
        value.company ||
        value.organization ||
        "",
      description: value.description || value.details || "",
      technologies: value.technologies || value.tech || "",
      url: value.url || value.link || ""
    };
  }

  return {
    date: "",
    title: String(value || ""),
    subtitle: "",
    description: "",
    technologies: "",
    url: ""
  };
}

function normalizeEntries(value) {
  if (Array.isArray(value)) {
    return value.map(parseEntry).filter(entry =>
      entry.title ||
      entry.subtitle ||
      entry.description ||
      entry.date
    );
  }

  return lines(value)
    .map(parseEntry)
    .filter(entry => entry.title);
}

function renderTimelineEntries(value) {
  return normalizeEntries(value)
    .map(entry => `
      <article class="entry">
        ${entry.date
          ? `<p class="entry-date">${escapeHTML(entry.date)}</p>`
          : ""}
        ${entry.title
          ? `<h3 class="entry-title">${escapeHTML(entry.title)}</h3>`
          : ""}
        ${entry.subtitle
          ? `<p class="entry-sub">${escapeHTML(entry.subtitle)}</p>`
          : ""}
        ${entry.description
          ? `<p class="entry-description">${escapeHTML(entry.description)}</p>`
          : ""}
      </article>
    `)
    .join("");
}

function normalizeProjects(value) {
  if (Array.isArray(value)) {
    return value
      .map(item => {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          return {
            title: item.title || item.name || "Untitled project",
            description: item.description || item.details || "",
            technologies: item.technologies || item.tech || "",
            url: item.url || item.link || ""
          };
        }

        return {
          title: String(item || "").trim(),
          description: "",
          technologies: "",
          url: ""
        };
      })
      .filter(project => project.title);
  }

  return lines(value)
    .map(item => ({
      title: item,
      description: "",
      technologies: "",
      url: ""
    }))
    .filter(project => project.title);
}

function renderProjects(value) {
  return normalizeProjects(value)
    .map(project => {
      const url = safeUrl(project.url);

      return `
        <article class="project">
          <h3 class="entry-title">${escapeHTML(project.title)}</h3>
          ${project.description
            ? `<p class="project-desc">${escapeHTML(project.description)}</p>`
            : ""}
          ${project.technologies
            ? `<p class="project-tech">${escapeHTML(
                Array.isArray(project.technologies)
                  ? project.technologies.join(", ")
                  : project.technologies
              )}</p>`
            : ""}
          ${url
            ? `<a class="project-link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">View project ↗</a>`
            : ""}
        </article>
      `;
    })
    .join("");
}

function normalizeSocialLinks(value) {
  if (Array.isArray(value)) {
    return value.map(item => {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const url = safeUrl(item.url || item.link || "");

        return {
          label: item.label || item.name || url || "Link",
          url
        };
      }

      const text = String(item || "").trim();
      const match = text.match(/https?:\/\/\S+/);
      const url = match ? safeUrl(match[0]) : "";

      return {
        label: text.replace(match?.[0] || "", "").trim() || url || text,
        url
      };
    }).filter(item => item.label || item.url);
  }

  return lines(value).map(line => {
    const match = line.match(/https?:\/\/\S+/);
    const url = match ? safeUrl(match[0]) : "";

    const label = line
      .replace(match?.[0] || "", "")
      .replace(/^[-•\s]+/, "")
      .trim() || url || line;

    return { label, url };
  }).filter(item => item.label || item.url);
}

function linkList(value, className = "links") {
  return normalizeSocialLinks(value)
    .map(link => link.url
      ? `<a class="${escapeHTML(className)}" href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(link.label)}</a>`
      : `<span class="${escapeHTML(className)}">${escapeHTML(link.label)}</span>`
    )
    .join("");
}

function iconSvg(type) {
  const paths = {
    email: `
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <path d="m3 7 9 6 9-6"/>
    `,
    phone: `
      <path d="M5 3h3l2 5-2 2a15 15 0 0 0 6 6l2-2 5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z"/>
    `,
    location: `
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/>
      <circle cx="12" cy="10" r="2.5"/>
    `
  };

  return `
    <svg
      class="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      ${paths[type] || ""}
    </svg>
  `;
}

function renderContactItem(type, label, href = "") {
  if (!label) return "";

  const content = href
    ? `<a href="${escapeHTML(href)}">${escapeHTML(label)}</a>`
    : `<span>${escapeHTML(label)}</span>`;

  return `
    <div class="contact-item">
      ${iconSvg(type)}
      ${content}
    </div>
  `;
}

/* =========================================================
   SIMPLE TEMPLATE
   Five-page editorial portfolio (warm paper, blush panels).
   This CSS is intentionally inline because the editor preview
   is rendered through iframe.srcdoc.

   Every value on the page comes from the editor fields.
   Line formats (all optional, plain lines still work):
     Education / Experience : Title | Organization | Dates | Description
                              - bullet line (attaches to the entry above)
     Projects               : Title | Description | Technologies | URL
     Social links           : Label: https://url   (or just a URL / email)
   ========================================================= */

const TLDS =
  "com|org|net|io|dev|app|co|me|ph|ly|design|xyz|site|page|info|edu|gov|tv|us|uk|ca|au|link|studio|work|online|tech|cc|be";

/* Turns "github.com/x", "www.x.com", "me@x.com" or a full URL into a safe href. */
function toUrl(value) {
  const text = String(value || "").trim();

  if (!text || /\s/.test(text)) return "";

  if (/^(https?:\/\/|mailto:|tel:)/i.test(text)) return safeUrl(text);

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return `mailto:${text}`;

  if (
    /^www\./i.test(text) ||
    new RegExp(`^[a-z0-9-]+(\\.[a-z0-9-]+)*\\.(${TLDS})(/\\S*)?$`, "i").test(text)
  ) {
    return safeUrl(`https://${text}`);
  }

  return "";
}

function parseImageList(value) {
  let list = value;

  if (typeof value === "string") {
    try {
      list = JSON.parse(value || "[]");
    } catch {
      list = [];
    }
  }

  return Array.isArray(list) ? list.map(safeImageSource) : [];
}

function parseEntryLine(text) {
  const parts = text.split("|").map(part => part.trim());

  return {
    title: parts[0] || "",
    subtitle: parts[1] || "",
    date: parts[2] || "",
    description: parts.slice(3).filter(Boolean).join(" | "),
    bullets: []
  };
}

function parseSimpleEntries(value) {
  const source = Array.isArray(value) ? value : lines(value);
  const entries = [];

  source.forEach(item => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      entries.push({ ...parseEntry(item), bullets: lines(item.bullets || item.highlights || []) });
      return;
    }

    const text = String(item ?? "").trim();

    if (!text) return;

    const bullet = text.match(/^[-•*–]\s+(.*)$/);

    if (bullet && entries.length) {
      entries[entries.length - 1].bullets.push(bullet[1].trim());
      return;
    }

    entries.push(parseEntryLine(bullet ? bullet[1] : text));
  });

  return entries.filter(entry =>
    entry.title || entry.subtitle || entry.date || entry.description || entry.bullets.length
  );
}

function parseSimpleProjects(value) {
  const source = Array.isArray(value) ? value : lines(value);

  return source
    .map(item => {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const [project] = normalizeProjects([item]);

        return project
          ? {
              ...project,
              technologies: Array.isArray(project.technologies)
                ? project.technologies.join(", ")
                : String(project.technologies || "")
            }
          : null;
      }

      const parts = String(item ?? "").split("|").map(part => part.trim());
      const title = parts[0];

      if (!title) return null;

      const rest = parts.slice(1).filter(Boolean);
      const urlText = rest.find(part => toUrl(part));
      const others = rest.filter(part => part !== urlText);

      return {
        title,
        description: others[0] || "",
        technologies: others[1] || "",
        url: urlText ? toUrl(urlText) : ""
      };
    })
    .filter(Boolean);
}

function linkKind(label, url) {
  const haystack = `${label} ${url}`.toLowerCase();

  if (/^mailto:/i.test(url) || /^\s*e-?mail\b/i.test(label)) return "email";
  if (haystack.includes("linkedin")) return "linkedin";
  if (haystack.includes("github")) return "github";
  if (haystack.includes("behance")) return "behance";
  if (/(^|[\s/.])(x\.com|twitter\.com)/.test(haystack) || /^\s*(x|twitter)\b/i.test(label)) return "x";

  return "web";
}

function linkDisplay(url) {
  return String(url || "")
    .replace(/^(https?:\/\/|mailto:|tel:)/i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");
}

const KIND_NAMES = {
  linkedin: "LinkedIn",
  github: "GitHub",
  behance: "Behance",
  x: "X (Twitter)",
  email: "Email"
};

function parseSimpleLinks(value, email = "") {
  const source = Array.isArray(value) ? value : lines(value);

  const links = source
    .map(item => {
      let label = "";
      let url = "";

      if (item && typeof item === "object" && !Array.isArray(item)) {
        url = toUrl(item.url || item.link || "");
        label = String(item.label || item.name || "").trim();
      } else {
        const text = String(item ?? "").replace(/^[-•*\s]+/, "").trim();

        if (!text) return null;

        const match = text.match(/(https?:\/\/\S+|mailto:\S+|tel:\S+)/i);

        if (match) {
          url = toUrl(match[0]);
          label = text.replace(match[0], "").replace(/[:\-–|\s]+$/, "").trim();
        } else {
          const colon = text.indexOf(":");
          const tail = colon > -1 ? text.slice(colon + 1).trim() : text;

          if (toUrl(tail)) {
            url = toUrl(tail);
            label = colon > -1 ? text.slice(0, colon).trim() : "";
          } else {
            label = text;
          }
        }
      }

      if (!label && !url) return null;

      const kind = linkKind(label, url);

      return {
        kind,
        url,
        label: label || KIND_NAMES[kind] || linkDisplay(url).split("/")[0] || "Link",
        display: linkDisplay(url)
      };
    })
    .filter(Boolean);

  const cleanEmail = String(email || "").trim();

  if (
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) &&
    !links.some(link => link.url.toLowerCase() === `mailto:${cleanEmail}`.toLowerCase())
  ) {
    links.push({
      kind: "email",
      label: "Email",
      url: `mailto:${cleanEmail}`,
      display: cleanEmail
    });
  }

  return links;
}

function linkIcon(kind) {
  const svg = (body, extra = "") =>
    `<svg viewBox="0 0 24 24" ${extra} aria-hidden="true">${body}</svg>`;

  switch (kind) {
    case "linkedin":
      return `<span class="tile tile-linkedin">in</span>`;
    case "behance":
      return `<span class="tile tile-behance">Bē</span>`;
    case "github":
      return `<span class="tile tile-dark">${svg(
        `<path fill="currentColor" transform="scale(1.5)" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>`
      )}</span>`;
    case "x":
      return `<span class="tile tile-dark">${svg(
        `<path d="M5 4l14 16M19 4L5 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`
      )}</span>`;
    case "email":
      return `<span class="tile tile-dark">${svg(
        `<rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m3.5 7 8.5 6 8.5-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
      )}</span>`;
    default:
      return `<span class="tile tile-dark">${svg(
        `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" fill="none" stroke="currentColor" stroke-width="1.5"/>`
      )}</span>`;
  }
}

function renderSimpleDocument(d = {}) {
  const name = d.full_name || "Your Name";
  const role = d.title || "Professional Portfolio";
  const documentTitle = `Portfolio — ${name}`;

  const about = d.about || "";
  const education = parseSimpleEntries(d.education);
  const experience = parseSimpleEntries(d.experience);
  const projects = parseSimpleProjects(d.projects);
  const projectImages = parseImageList(d.project_images);
  const skills = splitSkills(d.skills);

  const email = String(d.email || "").trim();
  const phone = String(d.phone || "").trim();
  const address = String(d.address || "").trim();
  const socialLinks = parseSimpleLinks(d.social_links, email);

  const certifications = lines(d.certifications);
  const languages = lines(d.languages);
  const interests = lines(d.interests);

  const image = getImage(name, d.profile_image, "cover-photo");

  const contactField = (type, label, value, href = "") => {
    if (!value) return "";

    const content = href
      ? `<a href="${escapeHTML(href)}">${escapeHTML(value)}</a>`
      : `<span>${escapeHTML(value)}</span>`;

    return `
      <div class="field">
        ${iconSvg(type)}
        <div>
          <span class="field-label">${escapeHTML(label)}</span>
          ${content}
        </div>
      </div>
    `;
  };

  const contactMarkup = [
    contactField("email", "Email", email, email ? `mailto:${email}` : ""),
    contactField("phone", "Phone", phone, phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : ""),
    contactField("location", "Location", address)
  ].join("");

  const educationMarkup = education.length
    ? education.map(entry => `
        <article class="entry">
          ${entry.title ? `<h3 class="entry-title">${escapeHTML(entry.title)}</h3>` : ""}
          ${entry.subtitle ? `<p class="entry-sub">${escapeHTML(entry.subtitle)}</p>` : ""}
          ${entry.date ? `<p class="entry-sub">${escapeHTML(entry.date)}</p>` : ""}
          ${entry.description ? `<p class="entry-text">${escapeHTML(entry.description)}</p>` : ""}
          ${entry.bullets.length
            ? `<ul class="entry-list">${entry.bullets.map(b => `<li>${escapeHTML(b)}</li>`).join("")}</ul>`
            : ""}
        </article>
      `).join("")
    : `<p class="empty">Education details will appear here when added.</p>`;

  const experienceMarkup = experience.length
    ? experience.map(entry => {
        const meta = [entry.subtitle, entry.date].filter(Boolean).join(" · ");

        return `
          <article class="entry">
            ${entry.title ? `<h3 class="entry-title">${escapeHTML(entry.title)}</h3>` : ""}
            ${meta ? `<p class="entry-sub">${escapeHTML(meta)}</p>` : ""}
            ${entry.description ? `<p class="entry-text">${escapeHTML(entry.description)}</p>` : ""}
            ${entry.bullets.length
              ? `<ul class="entry-list">${entry.bullets.map(b => `<li>${escapeHTML(b)}</li>`).join("")}</ul>`
              : ""}
          </article>
        `;
      }).join("")
    : `<p class="empty">Experience details will appear here when added.</p>`;

  const skillsMarkup = skills.length
    ? skills.map(skill => `<span class="chip">${escapeHTML(skill)}</span>`).join("")
    : `<p class="empty">Add skills in the portfolio editor.</p>`;

  const projectsMarkup = projects.length
    ? projects.map((project, index) => {
        const url = safeUrl(project.url);
        const tech = Array.isArray(project.technologies)
          ? project.technologies.join(", ")
          : String(project.technologies || "");
        const src = projectImages[index] || "";
        const number = String(index + 1).padStart(2, "0");

        return `
          <article class="project">
            <div class="project-img${src ? "" : " project-img-empty"}">
              ${src
                ? `<img src="${escapeHTML(src)}" alt="${escapeHTML(project.title)} preview" onerror="this.style.display='none'">`
                : `<span aria-hidden="true">${number}</span>`}
            </div>
            <div class="project-card">
              <h3 class="project-title">${escapeHTML(project.title)}</h3>
              ${url
                ? `<a class="project-link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">View project ↗</a>`
                : ""}
              ${project.description
                ? `<p class="project-desc">${escapeHTML(project.description)}</p>`
                : ""}
              ${tech ? `<p class="project-tech">${escapeHTML(tech)}</p>` : ""}
            </div>
          </article>
        `;
      }).join("")
    : `<p class="empty">Your projects will appear here when added.</p>`;

  const socialMarkup = socialLinks.length
    ? socialLinks.map(link => {
        const inner = `
          ${linkIcon(link.kind)}
          <span class="link-text">
            <span class="link-label">${escapeHTML(link.label)}</span>
            ${link.display ? `<span class="link-url">${escapeHTML(link.display)}</span>` : ""}
          </span>
          ${link.url ? `<span class="link-arrow" aria-hidden="true">→</span>` : ""}
        `;

        return link.url
          ? `<a class="link" href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
          : `<div class="link">${inner}</div>`;
      }).join("")
    : `<p class="empty">Add social links in the portfolio editor to display them here.</p>`;

  const extraBlock = (title, items) => items.length
    ? `<div class="extra-block"><h3>${escapeHTML(title)}</h3><p>${items.map(escapeHTML).join("<br>")}</p></div>`
    : "";

  const extrasMarkup = [
    extraBlock("Certifications", certifications),
    extraBlock("Languages", languages),
    extraBlock("Interests", interests)
  ].join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(documentTitle)}</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">

  <style>
    :root {
      --paper: #faf7f2;
      --blush: #f2e4df;
      --blush-soft: #f6ece8;
      --panel: #efe9e0;
      --strip: #ddd6cc;
      --line: #cfc8be;
      --ink: #1c1a19;
      --muted: #6f6a64;
      --serif: "Playfair Display", Georgia, serif;
      --sans: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #e8e5e0;
    }

    body {
      color: var(--ink);
      font-family: var(--sans);
      font-size: 12px;
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
    }

    h1, h2, h3, p, ul { margin: 0; }

    a { color: inherit; text-decoration: none; overflow-wrap: anywhere; }
    a:hover { text-decoration: underline; text-underline-offset: 3px; }
    a:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }

    img { display: block; max-width: 100%; }

    #paper { width: 794px; margin: 24px auto; }

    .page {
      position: relative;
      width: 794px;
      min-height: 1122px;
      margin: 0 0 24px;
      padding: 100px 76px 120px;
      overflow: hidden;
      background: var(--paper);
      box-shadow: 0 6px 26px rgba(40, 30, 20, .12);
      break-after: page;
      page-break-after: always;
    }

    .page:last-child { break-after: auto; page-break-after: auto; }

    .sub {
      margin-bottom: 14px;
      color: var(--ink);
      font-size: 9px;
      font-weight: 500;
      letter-spacing: .2em;
      line-height: 1.5;
      text-transform: uppercase;
    }

    .heading {
      margin-bottom: 16px;
      font-family: var(--serif);
      font-size: 42px;
      font-weight: 500;
      letter-spacing: -.02em;
      line-height: 1.12;
      overflow-wrap: anywhere;
    }

    .rule { height: 1px; margin-bottom: 34px; background: var(--ink); opacity: .75; }

    .foot {
      position: absolute;
      right: 76px;
      bottom: 48px;
      left: 76px;
      display: flex;
      align-items: center;
      gap: 18px;
      color: var(--muted);
      font-size: 9px;
      letter-spacing: .12em;
    }

    .foot::before { flex: 1; height: 1px; background: var(--line); content: ""; }

    .empty { color: var(--muted); font-size: 11px; font-style: italic; line-height: 1.8; }

    /* ---------- Page 1: cover ---------- */
    .cover { padding-left: 110px; }

    .cover::before {
      position: absolute;
      top: 84px;
      bottom: 110px;
      left: 38px;
      width: 40px;
      background: linear-gradient(90deg, #f3dfd9, rgba(246, 236, 232, .55));
      content: "";
    }

    .cover-title {
      margin-bottom: 26px;
      font-family: var(--serif);
      font-size: 96px;
      font-weight: 500;
      letter-spacing: -.035em;
      line-height: 1;
    }

    .cover-name {
      margin-bottom: 6px;
      font-family: var(--serif);
      font-size: 40px;
      font-weight: 500;
      line-height: 1.15;
      overflow-wrap: anywhere;
    }

    .cover-role { margin-bottom: 30px; color: var(--ink); font-size: 15px; overflow-wrap: anywhere; }

    .cover-photo {
      width: 100%;
      height: 330px;
      margin-bottom: 0;
      object-fit: cover;
      object-position: center 25%;
      background: var(--panel);
    }

    .cover-photo.avatar-placeholder {
      display: grid;
      place-items: center;
      color: var(--muted);
      font-family: var(--serif);
      font-size: 64px;
    }

    .contact-panel {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 22px 28px;
      min-height: 150px;
      padding: 26px 28px;
      background: var(--blush);
    }

    .contact-panel:empty { display: none; }

    .field { display: flex; align-items: flex-start; gap: 12px; min-width: 0; }
    .field > div { display: grid; min-width: 0; gap: 2px; overflow-wrap: anywhere; }
    .field .icon { flex: 0 0 15px; width: 15px; height: 15px; margin-top: 2px; color: var(--ink); }
    .field-label { font-size: 8.5px; font-weight: 500; letter-spacing: .16em; text-transform: uppercase; }
    .field a, .field span:last-child { font-size: 11px; color: #3b3633; }

    /* ---------- Page 2: about + education ---------- */
    .p2 { padding-left: 72px; }

    .p2::before {
      position: absolute;
      top: 72px;
      bottom: 96px;
      left: 44px;
      width: 350px;
      background: var(--panel);
      opacity: .75;
      content: "";
    }

    .p2 > :not(.foot) { position: relative; z-index: 1; }

    .cols {
      display: grid;
      grid-template-columns: 294px minmax(0, 1fr);
      gap: 54px;
    }

    .cols > * { min-width: 0; }

    .about { font-size: 12.5px; line-height: 2.1; overflow-wrap: anywhere; white-space: pre-line; }

    .p2 .entry { padding-bottom: 20px; margin-bottom: 20px; border-bottom: 1px solid var(--line); }
    .p2 .entry:last-child { padding-bottom: 0; margin-bottom: 0; border-bottom: 0; }

    /* ---------- Page 3: skills + experience ---------- */
    .p3 { padding-left: 150px; }

    .strip {
      position: absolute;
      top: 100px;
      bottom: 96px;
      left: 44px;
      display: flex;
      width: 62px;
      align-items: center;
      justify-content: center;
      background: var(--strip);
    }

    .vert {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: .28em;
      text-transform: uppercase;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
    }

    .block { margin-bottom: 48px; }
    .block:last-child { margin-bottom: 0; }

    .chips { display: flex; flex-wrap: wrap; gap: 9px; }

    .chip {
      padding: 5px 15px;
      border: 1px solid var(--line);
      border-radius: 999px;
      font-size: 11px;
      line-height: 1.5;
      overflow-wrap: anywhere;
    }

    .entry { margin-bottom: 26px; break-inside: avoid; page-break-inside: avoid; }
    .entry:last-child { margin-bottom: 0; }

    .entry-title { font-size: 13px; font-weight: 600; line-height: 1.5; overflow-wrap: anywhere; }
    .entry-sub { margin-top: 3px; color: var(--muted); font-size: 11px; line-height: 1.6; overflow-wrap: anywhere; }
    .entry-text { margin-top: 8px; font-size: 11.5px; line-height: 1.8; overflow-wrap: anywhere; white-space: pre-line; }

    .entry-list { margin-top: 8px; padding-left: 18px; font-size: 11.5px; line-height: 1.85; }
    .entry-list li { padding-left: 2px; overflow-wrap: anywhere; }

    /* ---------- Page 4: projects ---------- */
    .project {
      display: grid;
      grid-template-columns: 210px minmax(0, 1fr);
      gap: 4px;
      margin-bottom: 14px;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .project:last-child { margin-bottom: 0; }

    .project-img {
      display: grid;
      min-height: 150px;
      place-items: stretch;
      overflow: hidden;
      background: var(--blush-soft);
    }

    .project-img img { width: 100%; height: 100%; object-fit: cover; }

    .project-img-empty {
      place-items: center;
      color: #b4a9a0;
      font-family: var(--serif);
      font-size: 34px;
    }

    .project-card { display: flex; flex-direction: column; align-items: flex-start; padding: 22px 26px; background: var(--blush); }

    .project-title { margin-bottom: 4px; font-family: var(--serif); font-size: 20px; font-weight: 500; line-height: 1.25; overflow-wrap: anywhere; }
    .project-link { margin-bottom: 8px; font-size: 10.5px; text-decoration: underline; text-underline-offset: 3px; }
    .project-desc { font-size: 11.5px; line-height: 1.8; overflow-wrap: anywhere; white-space: pre-line; }
    .project-tech { margin-top: auto; padding-top: 10px; color: var(--muted); font-size: 9.5px; letter-spacing: .04em; overflow-wrap: anywhere; }

    /* ---------- Page 5: links ---------- */
    .p5 { padding: 56px 44px 110px; }
    .p5 .foot { right: 76px; left: 76px; }

    .links-panel {
      min-height: 940px;
      padding: 52px 44px 48px;
      background: linear-gradient(180deg, var(--blush), #f4e9e5);
    }

    .links-intro { max-width: 520px; margin-bottom: 26px; font-size: 12px; line-height: 1.8; }

    .links-list { display: grid; gap: 8px; }

    .link {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 20px;
      border: 1px solid rgba(207, 200, 190, .55);
      background: var(--paper);
      break-inside: avoid;
    }

    a.link:hover { text-decoration: none; background: #fff; }

    .tile {
      display: grid;
      flex: 0 0 38px;
      width: 38px;
      height: 38px;
      place-items: center;
      border-radius: 8px;
      color: #fff;
      font-size: 17px;
      font-weight: 700;
      letter-spacing: -.03em;
    }

    .tile svg { width: 22px; height: 22px; }
    .tile-linkedin { background: #0a66c2; font-size: 20px; }
    .tile-behance { background: #1769ff; font-size: 16px; }
    .tile-dark { background: #1c1a19; }

    .link-text { display: grid; flex: 1; min-width: 0; gap: 1px; }
    .link-label { font-size: 11.5px; font-weight: 600; overflow-wrap: anywhere; }
    .link-url { color: var(--muted); font-size: 10px; overflow-wrap: anywhere; }
    .link-arrow { font-size: 15px; }

    .extras { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; margin-top: 40px; padding-top: 26px; border-top: 1px solid rgba(28, 26, 25, .25); }
    .extras:empty { display: none; }
    .extra-block h3 { margin-bottom: 6px; font-size: 9px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; }
    .extra-block p { font-size: 11px; line-height: 1.8; overflow-wrap: anywhere; }

    @media (max-width: 820px) {
      #paper { margin: 8px; zoom: calc((100vw - 16px) / 794); }
    }

    @media print {
      html, body { width: 794px; margin: 0; background: var(--paper); }
      #paper { width: 794px; margin: 0; zoom: 1; }
      .page { margin: 0; box-shadow: none; break-after: page; page-break-after: always; }
      .page:last-child { break-after: auto; page-break-after: auto; }
      @page { size: A4; margin: 0; }
    }
  </style>
</head>

<body>
  <div id="paper">

    <!-- PAGE 1: COVER -->
    <section class="page cover">
      <h1 class="cover-title">Portfolio</h1>
      <h2 class="cover-name">${escapeHTML(name)}</h2>
      <p class="cover-role">${escapeHTML(role)}</p>

      ${image}

      <div class="contact-panel">${contactMarkup}</div>

      <footer class="foot"><span>01 / 05</span></footer>
    </section>

    <!-- PAGE 2: ABOUT + EDUCATION -->
    <section class="page p2">
      <div class="cols">
        <div>
          <p class="sub">Profile / Education</p>
          <h2 class="heading">About me</h2>
          <div class="rule"></div>
          <p class="about">${about
            ? escapeHTML(about)
            : `<span class="empty">Your introduction will appear here when you add it in the portfolio editor.</span>`}</p>
        </div>

        <div>
          <p class="sub" aria-hidden="true">&nbsp;</p>
          <h2 class="heading">Education</h2>
          <div class="rule"></div>
          ${educationMarkup}
        </div>
      </div>

      <footer class="foot"><span>02 / 05</span></footer>
    </section>

    <!-- PAGE 3: SKILLS + EXPERIENCE -->
    <section class="page p3">
      <div class="strip" aria-hidden="true">
        <span class="vert">Skills &amp; Experience</span>
      </div>

      <section class="block">
        <p class="sub">Capabilities</p>
        <h2 class="heading">Skills</h2>
        <div class="rule"></div>
        <div class="chips">${skillsMarkup}</div>
      </section>

      <section class="block">
        <p class="sub">Career</p>
        <h2 class="heading">Experience</h2>
        <div class="rule"></div>
        ${experienceMarkup}
      </section>

      <footer class="foot"><span>03 / 05</span></footer>
    </section>

    <!-- PAGE 4: PROJECTS -->
    <section class="page">
      <p class="sub">Selected work</p>
      <h2 class="heading">Projects</h2>
      <div class="rule"></div>

      ${projectsMarkup}

      <footer class="foot"><span>04 / 05</span></footer>
    </section>

    <!-- PAGE 5: LINKS & PROFILES -->
    <section class="page p5">
      <div class="links-panel">
        <p class="sub">Links &amp; Profiles</p>
        <h2 class="heading">Links &amp; Profiles</h2>
        <div class="rule"></div>

        <p class="links-intro">A collection of professional profiles and selected online destinations.</p>

        <div class="links-list">${socialMarkup}</div>

        <div class="extras">${extrasMarkup}</div>
      </div>

      <footer class="foot"><span>05 / 05</span></footer>
    </section>

  </div>
</body>
</html>`;
}

/* =========================================================
   MODERN + CREATIVE TEMPLATES
   Keep their existing shared layout and template styles.
   ========================================================= */

function renderLegacyDocument(d = {}) {
  const name = escapeHTML(d.full_name || "Your Name");
  const about = escapeHTML(
    d.about || "Add an introduction about yourself in the editor."
  );
  const title = escapeHTML(d.title || "My Portfolio");

  const template = ["simple", "modern", "creative"].includes(d.template_key)
    ? d.template_key
    : "simple";

  const image = d.profile_image
    ? `<img class="avatar" src="${escapeHTML(d.profile_image)}" alt="${name} profile picture" onerror="this.style.display='none'">`
    : `<div class="avatar avatar-placeholder">${escapeHTML(
        getInitials(d.full_name || "Your Name")
      )}</div>`;

  const email = String(d.email || "").trim();
  const phone = String(d.phone || "").trim();
  const address = String(d.address || "").trim();

  const contact = [
    email && `<a href="mailto:${escapeHTML(email)}">${escapeHTML(email)}</a>`,
    phone && `<a href="tel:${escapeHTML(phone)}">${escapeHTML(phone)}</a>`,
    address && `<span>${escapeHTML(address)}</span>`
  ].filter(Boolean).join("");

  const skills = splitSkills(d.skills);

  const common = `
    <header class="hero">
      <div class="hero-inner">
        ${image}
        <div>
          <p class="eyebrow">${title}</p>
          <h1>${name}</h1>
          <p class="contact">${contact}</p>
        </div>
      </div>
    </header>

    <main class="content">
      ${section("About me", `<p>${about}</p>`)}

      ${section(
        "Educational background",
        `<ul>${entryList(d.education)}</ul>`
      )}

      ${section(
        "Skills",
        `<div class="skills">${skills.map(
          s => `<span>${escapeHTML(s)}</span>`
        ).join("")}</div>`
      )}

      ${section("Projects", `<ul>${entryList(d.projects)}</ul>`)}

      ${section(
        "Work experience",
        `<ul>${entryList(d.experience)}</ul>`
      )}

      ${section(
        "Find me online",
        `<div class="links">${linkList(d.social_links)}</div>`
      )}

      ${contact ? section(
        "Contact",
        `<div class="links">${contact}</div>`
      ) : ""}
    </main>

    <footer>Created with SOYON</footer>
  `;

  let styles = "";

  if (template === "modern") {
    styles = `
      body {
        background: #101827;
        color: #edf2ff;
        font: 16px/1.65 Inter, Arial, sans-serif;
      }
      .hero {
        background: linear-gradient(135deg, #172554, #312e81 65%, #0f172a);
        padding: 58px 7vw;
        color: white;
      }
      .hero-inner {
        max-width: 980px;
        margin: auto;
        display: flex;
        gap: 28px;
        align-items: center;
      }
      .avatar {
        width: 116px;
        height: 116px;
        border-radius: 24px;
        object-fit: cover;
      }
      .avatar-placeholder {
        display: grid;
        place-items: center;
        background: #60a5fa;
        color: #102044;
        font-size: 30px;
        font-weight: 800;
      }
      .eyebrow {
        text-transform: uppercase;
        letter-spacing: .15em;
        font-size: 12px;
        color: #93c5fd;
      }
      .hero h1 {
        font-size: clamp(34px, 6vw, 58px);
        line-height: 1.05;
        margin: 8px 0;
      }
      .contact, .links {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      .hero a { color: #bfdbfe; }
      .content {
        max-width: 980px;
        margin: 34px auto;
        padding: 0 24px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }
      .section {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 18px;
        padding: 24px;
      }
      .section h2 {
        color: #93c5fd;
        margin: 0 0 12px;
        font-size: 19px;
      }
      .section p { margin: 0; }
      .section ul { padding-left: 20px; margin: 0; }
      .skills span, .links a {
        display: inline-block;
        background: #334155;
        border-radius: 999px;
        padding: 6px 10px;
        margin: 3px;
        color: #dbeafe;
      }
      .links a { overflow-wrap: anywhere; }
      footer {
        text-align: center;
        padding: 30px;
        color: #94a3b8;
        font-size: 12px;
      }
      @media (max-width: 650px) {
        .hero-inner {
          align-items: flex-start;
          flex-direction: column;
        }
        .content { grid-template-columns: 1fr; }
        .avatar { width: 90px; height: 90px; }
      }
    `;
  } else if (template === "creative") {
    styles = `
      body {
        background: #f3e8cf;
        color: #171a19;
        font: 15px/1.65 "Space Mono", monospace;
      }
      .hero {
        padding: 42px 6vw 28px;
        background: #efc75e;
        border-bottom: 3px solid #171a19;
      }
      .hero-inner {
        max-width: 920px;
        margin: auto;
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 26px;
        align-items: center;
      }
      .avatar {
        width: 125px;
        height: 125px;
        object-fit: cover;
        border: 3px solid #171a19;
        box-shadow: 7px 7px 0 #171a19;
      }
      .avatar-placeholder {
        display: grid;
        place-items: center;
        background: #f8f5ed;
        font-size: 30px;
        font-weight: 800;
      }
      .eyebrow {
        font-size: 11px;
        letter-spacing: .12em;
        text-transform: uppercase;
      }
      .hero h1 {
        font-size: clamp(34px, 6vw, 62px);
        line-height: 1.02;
        letter-spacing: -.06em;
        margin: 7px 0;
      }
      .contact, .links {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      .content {
        max-width: 920px;
        margin: 28px auto;
        padding: 0 20px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }
      .section {
        background: #fffdf6;
        border: 2px solid #171a19;
        padding: 22px;
        box-shadow: 5px 5px 0 #171a19;
      }
      .section h2 {
        font-size: 16px;
        text-transform: uppercase;
        letter-spacing: .08em;
        border-bottom: 2px solid #171a19;
        padding-bottom: 9px;
        margin: 0 0 12px;
      }
      .section p { margin: 0; }
      .section ul { padding-left: 20px; margin: 0; }
      .skills span {
        display: inline-block;
        border: 1px solid #171a19;
        padding: 4px 8px;
        margin: 3px;
      }
      .links a { overflow-wrap: anywhere; }
      footer {
        max-width: 920px;
        margin: 0 auto;
        padding: 22px 20px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: .12em;
      }
      @media (max-width: 650px) {
        .hero-inner { grid-template-columns: 1fr; }
        .content { grid-template-columns: 1fr; }
      }
    `;
  } else {
    /*
     * The Simple template is handled by renderSimpleDocument().
     * This fallback is retained for compatibility with callers
     * that explicitly invoke the legacy renderer.
     */
    styles = `
      body {
        background: #f7f5f0;
        color: #243047;
        font: 16px/1.7 Manrope, Arial, sans-serif;
      }
      .hero {
        background: white;
        border-bottom: 1px solid #e4e0d7;
        padding: 48px 6vw;
      }
      .hero-inner {
        max-width: 900px;
        margin: auto;
        display: flex;
        align-items: center;
        gap: 28px;
      }
      .avatar {
        width: 108px;
        height: 108px;
        border-radius: 50%;
        object-fit: cover;
      }
      .avatar-placeholder {
        display: grid;
        place-items: center;
        background: #e9edf5;
        color: #243047;
        font-size: 27px;
        font-weight: 800;
      }
      .eyebrow {
        color: #64748b;
        font-size: 11px;
        letter-spacing: .15em;
        text-transform: uppercase;
      }
      .hero h1 {
        font-size: clamp(32px, 5vw, 50px);
        line-height: 1.15;
        margin: 5px 0;
      }
      .contact, .links {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        color: #475569;
      }
      .content {
        max-width: 900px;
        margin: 34px auto;
        padding: 0 22px;
      }
      .section {
        background: #fff;
        border: 1px solid #e3e0d8;
        border-radius: 14px;
        padding: 24px;
        margin-bottom: 16px;
      }
      .section h2 {
        font-size: 18px;
        margin: 0 0 10px;
      }
      .section p { margin: 0; }
      .section ul { padding-left: 20px; margin: 0; }
      .skills span {
        display: inline-block;
        background: #eef1f6;
        border-radius: 6px;
        padding: 5px 10px;
        margin: 3px;
        font-size: 13px;
      }
      .links a { overflow-wrap: anywhere; }
      footer {
        text-align: center;
        padding: 26px;
        color: #64748b;
        font-size: 12px;
      }
      @media (max-width: 650px) {
        .hero-inner {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    `;
  }

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — ${name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    a {
      color: inherit;
      text-decoration: none;
    }
    img {
      max-width: 100%;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @page {
      size: A4;
      margin: 0;
    }
    @media print {
      html, body {
        width: 100%;
        margin: 0;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .hero, .avatar-placeholder, .skills span, a, section, footer {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .hero {
        break-inside: avoid;
      }
    }
    ${styles}
  </style>
</head>
<body>
  ${common}
</body>
</html>`;
}

function renderDocument(d = {}) {
  const template = ["simple", "modern", "creative"].includes(d.template_key)
    ? d.template_key
    : "simple";

  if (template === "simple") {
    return renderSimpleDocument(d);
  }

  return renderLegacyDocument({
    ...d,
    template_key: template
  });
}

export { renderDocument };
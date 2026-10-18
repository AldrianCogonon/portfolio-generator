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
   MODERN TEMPLATE
   Multi-page portfolio document (maroon + blush palette).
   Pages are built from the editor fields and numbered
   dynamically, so empty sections never leave blank pages.
   Uses the same line formats as the Simple template.
   ========================================================= */

const MODERN_CSS = String.raw`/* =========================================================
   MODERN TEMPLATE
   Multi-page portfolio document: maroon + blush palette.
   The same stylesheet is inlined by renderModernDocument()
   in portfolio-render.js (the editor preview is an iframe).
   ========================================================= */

/* 1. GENERAL STYLES */
:root {
  --maroon: #741f42;
  --burgundy: #8d3157;
  --pink: #d8a7b9;
  --light-pink: #f3e8ed;
  --light-gray: #f4f5f7;
  --dark: #20252d;
  --gray: #68717d;
  --white: #ffffff;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  scroll-behavior: smooth;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

body {
  font-family: "Segoe UI", Arial, sans-serif;
  color: var(--dark);
  background: #dfe1e5;
  line-height: 1.6;
}

a { color: inherit; text-decoration: none; overflow-wrap: anywhere; }
h1, h2, h3 { line-height: 1.2; }
p { color: var(--gray); font-size: 13px; }

/* 2. PORTFOLIO DOCUMENT */
.portfolio {
  max-width: 1550px;
  margin: 25px auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.page {
  background: var(--white);
  min-width: 0;
  padding: 28px;
  position: relative;
  overflow: hidden;
  border: 1px solid #e6e6e9;
  box-shadow: 0 7px 20px rgba(25, 25, 35, 0.09);
  display: flex;
  flex-direction: column;
}

.page > * { flex-shrink: 0; }
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
.page-number { color: var(--maroon); font-size: 15px; font-weight: 800; }
.page-label { font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; white-space: nowrap; }
.header-line { height: 1px; background: #d7d7dc; flex: 1; }
.page-count { color: var(--gray); font-size: 9px; white-space: nowrap; }

.eyebrow { color: var(--maroon); font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; }
.section-title { font-size: 29px; margin: 8px 0 18px; letter-spacing: -1px; overflow-wrap: anywhere; }
.accent { color: var(--maroon); }
.small-title { font-size: 15px; margin-bottom: 8px; }
.muted { color: var(--gray); }
.empty { color: var(--gray); font-size: 11px; font-style: italic; line-height: 1.8; }

/* 3. COVER PAGE */
.cover { grid-row: span 2; min-height: 970px; padding: 35px; }

.cover::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 9px;
  height: 110px;
  background: var(--maroon);
}

.cover-top { font-size: 11px; letter-spacing: 3px; line-height: 1.8; margin-bottom: 45px; text-transform: uppercase; }

.cover h1 {
  font-size: clamp(42px, 4vw, 65px);
  line-height: 1.02;
  letter-spacing: -2px;
  margin-bottom: 16px;
  overflow-wrap: anywhere;
  text-transform: uppercase;
}

.cover-subtitle { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; overflow-wrap: anywhere; }
.cover-intro { margin-top: 45px; max-width: 190px; font-size: 13px; overflow-wrap: anywhere; }

.cover-photo {
  width: 100%;
  height: 340px;
  margin-top: 30px;
  overflow: hidden;
  background: var(--light-pink);
  border-radius: 150px 150px 5px 5px;
}

.cover-photo img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center top; }

.avatar-placeholder {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: var(--maroon);
  font-size: 64px;
  font-weight: 800;
}

.cover-bottom { margin-top: auto; padding-top: 28px; }
.cover-line { width: 45px; height: 2px; background: var(--maroon); margin-bottom: 14px; }
.cover-bottom p { font-size: 10px; letter-spacing: 2px; color: var(--maroon); font-weight: 700; text-transform: uppercase; }

/* 4. ABOUT ME */
.about-page { min-height: 470px; }
.about-page .section-title { font-size: 31px; }
.about-description { margin-bottom: 14px; overflow-wrap: anywhere; }
.personal-info { background: #f7f2f4; padding: 18px; margin-top: 18px; border-radius: 8px; }
.info-item { display: flex; align-items: flex-start; gap: 12px; margin-top: 13px; }

.info-icon {
  width: 30px;
  height: 30px;
  min-width: 30px;
  display: grid;
  place-items: center;
  color: white;
  background: var(--maroon);
  border-radius: 50%;
  font-size: 13px;
}

.info-item strong { font-size: 11px; display: block; }
.info-item p { font-size: 10px; overflow-wrap: anywhere; }

/* 5. EDUCATION AND SKILLS */
.education-page { min-height: 510px; }
.subheading { display: flex; align-items: center; gap: 12px; margin: 4px 0 20px; }
.subheading-icon { font-size: 25px; color: var(--maroon); }
.education-list { border-left: 2px solid var(--maroon); margin-left: 13px; padding-left: 20px; }
.education-item { position: relative; margin-bottom: 24px; }

.education-item::before {
  content: "";
  position: absolute;
  left: -26px;
  top: 6px;
  width: 9px;
  height: 9px;
  background: var(--maroon);
  border: 2px solid white;
  border-radius: 50%;
}

.education-item strong { font-size: 11px; display: block; overflow-wrap: anywhere; }
.education-item p { font-size: 10px; margin-top: 3px; overflow-wrap: anywhere; }

.date-tag {
  display: inline-block;
  background: var(--light-pink);
  color: var(--maroon);
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 700;
  border-radius: 4px;
  margin-bottom: 5px;
}

.skills-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.skill-card { background: #f5f3f5; padding: 13px 2px; text-align: center; border-radius: 6px; min-width: 0; }
.skill-card span { display: block; color: var(--maroon); font-size: 20px; font-weight: 800; margin-bottom: 4px; }
.skill-card p { font-size: 8.5px; color: var(--dark); overflow-wrap: break-word; }

/* 6. PROJECT GALLERY */
.projects-page { min-height: 510px; }

.project-card {
  display: grid;
  grid-template-columns: 42% 1fr;
  gap: 15px;
  align-items: center;
  background: #f7f7f8;
  padding: 12px;
  border: 1px solid #ececef;
  border-radius: 8px;
  margin-bottom: 13px;
  break-inside: avoid;
}

.project-card > div { min-width: 0; }
.project-image { min-height: 105px; background: #eee7eb; border-radius: 5px; overflow: hidden; }
.project-image img { display: block; width: 100%; height: 105px; object-fit: cover; }

.project-image-empty {
  display: grid;
  height: 105px;
  place-items: center;
  color: var(--pink);
  font-size: 28px;
  font-weight: 800;
}

.project-card h3 { font-size: 11px; margin-bottom: 6px; overflow-wrap: anywhere; }
.project-card p { font-size: 10px; line-height: 1.5; margin-bottom: 7px; overflow-wrap: anywhere; }
.project-link { display: inline-block; margin-bottom: 7px; color: var(--maroon); font-size: 10px; font-weight: 700; text-decoration: underline; }

.tags { display: flex; flex-wrap: wrap; gap: 4px; }
.tag { display: inline-block; padding: 3px 7px; border-radius: 4px; background: #eadce3; color: var(--maroon); font-size: 9px; font-weight: 700; }

/* 7. WORK EXPERIENCE */
.experience-page { min-height: 435px; }
.experience-list { border-left: 2px solid var(--maroon); margin-left: 8px; padding-left: 20px; }
.experience-item { position: relative; margin-bottom: 26px; }

.experience-item::before {
  content: "";
  position: absolute;
  left: -26px;
  top: 7px;
  height: 10px;
  width: 10px;
  background: var(--maroon);
  border-radius: 50%;
}

.experience-item h3 { font-size: 12px; margin: 5px 0; overflow-wrap: anywhere; }
.experience-item p, .experience-item li { font-size: 10px; overflow-wrap: anywhere; }
.experience-item ul { padding-left: 15px; }

.quote { margin-top: auto; padding: 20px 10px; text-align: center; font-size: 17px; font-style: italic; color: var(--maroon); }

/* 8. SOCIAL MEDIA */
.social-page { min-height: 435px; }
.social-page .section-title { font-size: 31px; }
.social-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 24px 0 18px; }
.social-card { display: block; padding: 18px 8px; text-align: center; background: #f7f4f6; border: 1px solid #ece5e9; border-radius: 8px; min-width: 0; }

.social-icon {
  width: 43px;
  height: 43px;
  margin: 0 auto 8px;
  display: grid;
  place-items: center;
  background: var(--maroon);
  color: white;
  border-radius: 50%;
  font-size: 17px;
  font-weight: 800;
}

.social-card strong { display: block; font-size: 11px; overflow-wrap: anywhere; }
.social-card p { font-size: 9px; overflow-wrap: anywhere; }
.thanks { margin-top: auto; padding: 22px 12px; text-align: center; background: var(--light-pink); border-radius: 8px; }
.thanks h3 { color: var(--maroon); margin-bottom: 5px; }

/* 9. PROJECT DETAILS */
.details-page { min-height: 435px; }
.project-feature { display: grid; grid-template-columns: 1.2fr 1fr; gap: 15px; align-items: start; }
.project-feature img { display: block; width: 100%; border-radius: 6px; border: 1px solid #e3e3e7; }
.project-feature p { font-size: 10px; overflow-wrap: anywhere; }
.details-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 22px; }
.details-columns h3 { font-size: 12px; margin-bottom: 8px; }
.details-columns ul { padding-left: 17px; }
.details-columns li { font-size: 10px; margin-bottom: 5px; overflow-wrap: anywhere; }

.project-button {
  display: inline-block;
  background: var(--maroon);
  color: white;
  padding: 10px 18px;
  margin-top: 20px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 5px;
}

/* 10. CONTACT PAGE */
.contact-page { min-height: 435px; }
.contact-page .section-title { font-size: 32px; }
.contact-card { background: #f7f7f8; border: 1px solid #e7e7eb; padding: 6px 16px 18px; border-radius: 8px; margin-top: 15px; }
.contact-footer { margin-top: 18px; }
.contact-footer p { margin: 8px 0; font-size: 10px; overflow-wrap: anywhere; }

.send-button:hover, .project-button:hover { background: var(--burgundy); }

/* 11. RESPONSIVE DESIGN */
@media (max-width: 1150px) {
  .portfolio { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cover { grid-row: span 2; }
}

@media (max-width: 650px) {
  .portfolio { grid-template-columns: 1fr; padding: 0 12px; margin: 12px auto; gap: 14px; }
  .page, .cover { grid-row: auto; min-height: auto; padding: 25px; }
  .cover-photo { height: 360px; }
  .cover-bottom { margin-top: 35px; }
  .project-card { grid-template-columns: 40% 1fr; }
  .section-title { font-size: 27px; }
}

/* 12. PRINT AS DOCUMENT / PDF */
@page { size: A4; margin: 0; }

@media print {
  body { background: white; }
  .portfolio { display: block; max-width: none; margin: 0; padding: 0; }

  .page {
    width: 210mm;
    min-height: 296mm;
    margin: 0;
    padding: 15mm;
    border: none;
    box-shadow: none;
    border-radius: 0;
    break-after: page;
    page-break-after: always;
  }

  .page:last-child { break-after: auto; page-break-after: auto; }
  .cover { padding: 22mm; }
  .cover-photo { height: 105mm; }
  .project-button { color: white !important; }
  a { text-decoration: none; }
  .project-link { text-decoration: underline; }
}
`;

function modernSkillSymbol(skill) {
  const text = String(skill || "").trim();
  const words = text.split(/[\s/&+-]+/).filter(Boolean);

  if (words.length > 1) {
    return words.slice(0, 3).map(word => word[0]).join("").toUpperCase();
  }

  return text.length <= 3 ? text.toUpperCase() : text.charAt(0).toUpperCase();
}

function modernSplitName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return { first: "Your", last: "Name" };
  if (parts.length === 1) return { first: parts[0], last: "" };

  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

function modernTitleMarkup(text) {
  const { first, last } = modernSplitName(text);

  return last
    ? `${escapeHTML(first)} <span class="accent">${escapeHTML(last)}</span>`
    : escapeHTML(first);
}

function modernSocialSymbol(kind) {
  return {
    linkedin: "in",
    github: "GH",
    behance: "Bē",
    x: "X",
    email: "✉"
  }[kind] || "↗";
}

function renderModernDocument(d = {}) {
  const name = d.full_name || "Your Name";
  const role = d.title || "Professional Portfolio";

  const about = String(d.about || "").trim();
  const education = parseSimpleEntries(d.education);
  const experience = parseSimpleEntries(d.experience);
  const projects = parseSimpleProjects(d.projects);
  const projectImages = parseImageList(d.project_images);
  const skills = splitSkills(d.skills);

  const email = String(d.email || "").trim();
  const phone = String(d.phone || "").trim();
  const address = String(d.address || "").trim();
  const socialLinks = parseSimpleLinks(d.social_links, email);

  const profileSrc = safeImageSource(d.profile_image);
  const { first, last } = modernSplitName(name);

  const aboutLines = lines(about);
  const intro = (aboutLines[0] || "")
    .split(/(?<=[.!?])\s+/)[0]
    .slice(0, 140);

  /* ---------- Cover ---------- */
  const photoMarkup = profileSrc
    ? `<img src="${escapeHTML(profileSrc)}" alt="${escapeHTML(name)} profile photo" onerror="this.style.display='none'">`
    : `<div class="avatar-placeholder" aria-label="Profile image placeholder">${escapeHTML(getInitials(name))}</div>`;

  const cover = `
    <section class="page cover" id="home">
      <div class="cover-top">Portfolio<br>${new Date().getFullYear()}</div>

      <h1>${escapeHTML(first)}${last ? `<br><span class="accent">${escapeHTML(last)}</span>` : ""}</h1>

      <div class="cover-subtitle">${escapeHTML(role)}</div>

      ${intro ? `<p class="cover-intro">${escapeHTML(intro)}</p>` : ""}

      <div class="cover-photo">${photoMarkup}</div>

      <div class="cover-bottom">
        <div class="cover-line"></div>
        <p>${escapeHTML(name)}</p>
        <p>Personal Portfolio</p>
      </div>
    </section>
  `;

  /* ---------- Section bodies ---------- */
  const infoItem = (icon, label, value, href = "") => value
    ? `
      <div class="info-item">
        <div class="info-icon">${icon}</div>
        <div>
          <strong>${escapeHTML(label)}</strong>
          <p>${href
            ? `<a href="${escapeHTML(href)}">${escapeHTML(value)}</a>`
            : escapeHTML(value)}</p>
        </div>
      </div>
    `
    : "";

  const personalInfo = [
    infoItem("♟", "Full Name", name),
    infoItem("✉", "Email", email, email ? `mailto:${email}` : ""),
    infoItem("☎", "Contact Number", phone, phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : ""),
    infoItem("⌖", "Address", address)
  ].join("");

  const entryDetail = entry => `
    ${entry.description ? `<p>${escapeHTML(entry.description)}</p>` : ""}
    ${entry.bullets.length
      ? `<ul>${entry.bullets.map(b => `<li>${escapeHTML(b)}</li>`).join("")}</ul>`
      : ""}
  `;

  const educationMarkup = education.length
    ? education.map(entry => `
        <div class="education-item">
          ${entry.date ? `<span class="date-tag">${escapeHTML(entry.date)}</span>` : ""}
          ${entry.title ? `<strong>${escapeHTML(entry.title)}</strong>` : ""}
          ${entry.subtitle ? `<p>${escapeHTML(entry.subtitle)}</p>` : ""}
          ${entryDetail(entry)}
        </div>
      `).join("")
    : `<p class="empty">Education details will appear here when added.</p>`;

  const skillsMarkup = skills.length
    ? skills.map(skill => `
        <div class="skill-card"><span>${escapeHTML(modernSkillSymbol(skill))}</span><p>${escapeHTML(skill)}</p></div>
      `).join("")
    : `<p class="empty">Add skills in the portfolio editor.</p>`;

  const projectsMarkup = projects.length
    ? projects.map((project, index) => {
        const url = safeUrl(project.url);
        const src = projectImages[index] || "";
        const tags = splitSkills(project.technologies);

        return `
          <div class="project-card">
            <div class="project-image">
              ${src
                ? `<img src="${escapeHTML(src)}" alt="${escapeHTML(project.title)} preview" onerror="this.style.display='none'">`
                : `<div class="project-image-empty" aria-hidden="true">${String(index + 1).padStart(2, "0")}</div>`}
            </div>
            <div>
              <h3>${escapeHTML(project.title)}</h3>
              ${project.description ? `<p>${escapeHTML(project.description)}</p>` : ""}
              ${url
                ? `<a class="project-link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">View project ↗</a>`
                : ""}
              ${tags.length
                ? `<div class="tags">${tags.map(t => `<span class="tag">${escapeHTML(t)}</span>`).join("")}</div>`
                : ""}
            </div>
          </div>
        `;
      }).join("")
    : `<p class="empty">Your projects will appear here when added.</p>`;

  const experienceMarkup = experience.length
    ? experience.map(entry => `
        <div class="experience-item">
          ${entry.date ? `<span class="date-tag">${escapeHTML(entry.date)}</span>` : ""}
          ${entry.title ? `<h3>${escapeHTML(entry.title)}</h3>` : ""}
          ${entry.subtitle ? `<p class="muted">${escapeHTML(entry.subtitle)}</p>` : ""}
          ${entryDetail(entry)}
        </div>
      `).join("")
    : `<p class="empty">Experience details will appear here when added.</p>`;

  const socialMarkup = socialLinks.length
    ? socialLinks.map(link => {
        const inner = `
          <div class="social-icon">${escapeHTML(modernSocialSymbol(link.kind))}</div>
          <strong>${escapeHTML(link.label)}</strong>
          ${link.display ? `<p>${escapeHTML(link.display)}</p>` : ""}
        `;

        return link.url
          ? `<a class="social-card" href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
          : `<div class="social-card">${inner}</div>`;
      }).join("")
    : `<p class="empty">Add social links in the portfolio editor to display them here.</p>`;

  /* ---------- Numbered pages ---------- */
  const pages = [
    {
      id: "about",
      label: "About Me",
      cls: "about-page",
      body: `
        <p class="eyebrow">Personal Introduction</p>
        <h2 class="section-title">Hello,<br>I'm ${modernTitleMarkup(name)}</h2>
        ${aboutLines.length
          ? aboutLines.map(line => `<p class="about-description">${escapeHTML(line)}</p>`).join("")
          : `<p class="empty">Your introduction will appear here when you add it in the portfolio editor.</p>`}
        ${personalInfo
          ? `<div class="personal-info"><h3 class="small-title accent">Personal Information</h3>${personalInfo}</div>`
          : ""}
      `
    },
    {
      id: "education",
      label: "Education & Skills",
      cls: "education-page",
      body: `
        <div class="subheading"><span class="subheading-icon">♧</span><h3>Education</h3></div>
        <div class="education-list">${educationMarkup}</div>

        <div class="subheading" style="margin-top: 22px;"><span class="subheading-icon">⚙</span><h3>Skills</h3></div>
        <div class="skills-grid">${skillsMarkup}</div>
      `
    },
    {
      id: "projects",
      label: "My Projects",
      cls: "projects-page",
      body: projectsMarkup
    },
    {
      id: "experience",
      label: "Work Experience",
      cls: "experience-page",
      body: `
        <div class="experience-list">${experienceMarkup}</div>
        <div class="quote">“Growth comes from<br>consistent effort.”</div>
      `
    },
    {
      id: "social",
      label: "Social Media & Links",
      cls: "social-page",
      body: `
        <p class="eyebrow">Stay Connected</p>
        <h2 class="section-title">Let's <span class="accent">Connect</span></h2>
        <p>Feel free to reach out or follow me on my social media accounts to see more of my work and updates.</p>
        <div class="social-grid">${socialMarkup}</div>
        <div class="thanks"><h3>Thanks for visiting!</h3><p>Keep learning. Keep creating. Keep growing.</p></div>
      `
    }
  ];

  /* Featured project page (first project) — only when a project exists */
  if (projects.length) {
    const project = projects[0];
    const url = safeUrl(project.url);
    const src = projectImages[0] || "";
    const tech = splitSkills(project.technologies);
    const others = projects.slice(1).map(item => item.title);

    pages.push({
      id: "project-details",
      label: "Project Details",
      cls: "details-page",
      body: `
        <h2 class="section-title">${modernTitleMarkup(project.title)}</h2>
        <div class="cover-line"></div>

        <div class="project-feature">
          ${src ? `<img src="${escapeHTML(src)}" alt="${escapeHTML(project.title)} preview" onerror="this.style.display='none'">` : ""}
          ${project.description ? `<p>${escapeHTML(project.description)}</p>` : ""}
        </div>

        <div class="details-columns">
          <div>
            <h3>Technologies Used</h3>
            ${tech.length
              ? `<ul>${tech.map(t => `<li>${escapeHTML(t)}</li>`).join("")}</ul>`
              : `<p class="empty">Add technologies after the description in the Projects box.</p>`}
          </div>

          <div>
            <h3>${others.length ? "More Projects" : "Project Link"}</h3>
            ${others.length
              ? `<ul>${others.map(t => `<li>${escapeHTML(t)}</li>`).join("")}</ul>`
              : url
                ? `<p>${escapeHTML(linkDisplay(url))}</p>`
                : `<p class="empty">No link added.</p>`}
          </div>
        </div>

        ${url
          ? `<div><a class="project-button" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">View Project &nbsp; →</a></div>`
          : ""}
      `
    });
  }

  /* Contact page */
  const contactItems = [
    infoItem("✉", "Email", email, email ? `mailto:${email}` : ""),
    infoItem("☎", "Contact Number", phone, phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : ""),
    infoItem("⌖", "Location", address)
  ].join("");

  const profileNames = socialLinks
    .filter(link => link.kind !== "email")
    .map(link => escapeHTML(link.label))
    .join(" &nbsp; | &nbsp; ");

  pages.push({
    id: "contact",
    label: "Contact",
    cls: "contact-page",
    body: `
      <h2 class="section-title">Get in <span class="accent">Touch</span></h2>
      <p>Have a project in mind or just want to say hello? I'd love to hear from you!</p>

      ${contactItems
        ? `<div class="contact-card">${contactItems}</div>`
        : `<p class="empty" style="margin-top:15px">Add your contact details in the portfolio editor.</p>`}

      ${profileNames
        ? `<div class="contact-footer"><p class="accent">${profileNames}</p></div>`
        : ""}
    `
  });

  const pagesMarkup = pages.map((page, index) => `
    <section class="page ${page.cls}" id="${page.id}">
      <div class="page-header">
        <span class="page-number">${String(index + 1).padStart(2, "0")}</span>
        <span class="page-label">${escapeHTML(page.label)}</span>
        <span class="header-line"></span>
        <span class="page-count">Page ${index + 2}</span>
      </div>
      ${page.body}
    </section>
  `).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(`${name} | Personal Portfolio`)}</title>
  <style>
${MODERN_CSS}
  </style>
</head>
<body>
  <main class="portfolio">
    ${cover}
    ${pagesMarkup}
  </main>
</body>
</html>`;
}

/* =========================================================
   CREATIVE TEMPLATE
   One-page profile layout: banner + avatar, contacts, project
   cards, education and experience. All content comes from the
   editor fields (cover_image is the optional banner photo).
   Uses the same line formats as the Simple template.
   ========================================================= */

const CREATIVE_CSS = String.raw`/* =========================================================
   CREATIVE TEMPLATE
   Single-page profile layout: banner + avatar, contacts,
   project card grid, education and experience cards.
   The same stylesheet is inlined by renderCreativeDocument()
   in portfolio-render.js (the editor preview is an iframe).
   ========================================================= */

:root {
  --ink: #0e1a3f;
  --body: #2a3558;
  --muted: #7b8bb0;
  --bg: #f4f6fb;
  --card: #ffffff;
  --line: #e8ecf5;
  --accent: #7c5cf0;
  --icon-bg: #e4e7fb;
  --sticky: #fff27a;
  --font: "Plus Jakarta Sans", "Segoe UI", system-ui, -apple-system, sans-serif;
  --hand: "Caveat", "Segoe Print", "Comic Sans MS", cursive;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration: none; overflow-wrap: anywhere; }
a:hover { text-decoration: underline; text-underline-offset: 3px; }
img { display: block; max-width: 100%; }
h1, h2, h3 { line-height: 1.2; }

.wrap {
  display: grid;
  gap: 22px;
  max-width: 1040px;
  margin: 0 auto;
  padding: 28px 24px 60px;
}

.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(20, 35, 80, 0.05);
}

.empty { color: var(--muted); font-size: 13px; font-style: italic; }

/* ---------- Top row: profile + contacts ---------- */
.top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 290px;
  gap: 24px;
  align-items: start;
}

.profile { position: relative; overflow: hidden; padding-bottom: 28px; }

.banner {
  position: relative;
  height: 230px;
  overflow: hidden;
  background:
    radial-gradient(circle at 78% 18%, rgba(255, 255, 255, .55) 0 90px, transparent 91px),
    linear-gradient(135deg, #5eb6f2 0%, #9bd4f8 55%, #d9eefc 100%);
}

.banner img { width: 100%; height: 100%; object-fit: cover; object-position: center 25%; }

.sticky {
  position: absolute;
  top: 44px;
  left: 36px;
  max-width: 230px;
  padding: 8px 18px;
  background: var(--sticky);
  color: #3a3410;
  font-family: var(--hand);
  font-size: 23px;
  line-height: 1.15;
  transform: rotate(-9deg);
  box-shadow: 0 4px 10px rgba(0, 0, 0, .12);
  overflow-wrap: anywhere;
}

.handwritten {
  position: absolute;
  right: 26px;
  bottom: 20px;
  color: #fff27a;
  font-family: var(--hand);
  font-size: 26px;
  line-height: 1.1;
  text-align: left;
  text-shadow: 0 1px 4px rgba(0, 0, 0, .25);
  transform: rotate(-9deg);
}

.avatar-ring {
  position: absolute;
  top: 168px;
  left: 18px;
  width: 146px;
  height: 146px;
  padding: 5px;
  border-radius: 50%;
  background: conic-gradient(from 200deg, #ff5fa2, #ff9a3d, #ffd23d, #b45cff, #ff5fa2);
}

.avatar {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  overflow: hidden;
  border: 5px solid #fff;
  border-radius: 50%;
  background: var(--icon-bg);
  color: var(--accent);
  font-size: 40px;
  font-weight: 800;
}

.avatar img { width: 100%; height: 100%; object-fit: cover; }

.profile-body { padding: 20px 30px 0 196px; min-height: 120px; }
.profile-name { font-size: 29px; font-weight: 800; letter-spacing: -.02em; overflow-wrap: anywhere; }
.profile-handle { margin-top: 2px; color: var(--muted); font-size: 14px; overflow-wrap: anywhere; }
.profile-about { margin-top: 16px; color: var(--body); font-size: 15px; line-height: 1.65; overflow-wrap: anywhere; white-space: pre-line; }

.contacts { padding: 24px 26px 26px; }
.contacts h2 { margin-bottom: 14px; font-size: 22px; font-weight: 800; }
.contact-row { display: flex; align-items: center; gap: 14px; margin-top: 14px; min-width: 0; font-size: 14px; }
.contact-row svg { flex: 0 0 22px; width: 22px; height: 22px; fill: none; stroke: var(--ink); stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.contact-row span, .contact-row a { min-width: 0; overflow-wrap: anywhere; }

/* ---------- Projects ---------- */
.projects { padding: 28px 28px 30px; }

.heading { font-size: 36px; font-weight: 800; letter-spacing: -.03em; line-height: 1.1; }
.squiggle { display: block; width: 74px; height: 6px; margin: 8px 0 24px 2px; border-radius: 6px; background: var(--accent); transform: rotate(-4deg); }

.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }

.project { padding: 12px 12px 22px; min-width: 0; border: 1px solid var(--line); border-radius: 16px; background: #fff; break-inside: avoid; }

.project-img {
  display: grid;
  aspect-ratio: 16 / 9;
  place-items: center;
  overflow: hidden;
  border-radius: 10px;
  background: linear-gradient(135deg, #e4e7fb, #fbe3ef);
  color: #b9b4e8;
  font-size: 34px;
  font-weight: 800;
}

.project-img img { width: 100%; height: 100%; object-fit: cover; }
.project h3 { margin: 16px 4px 6px; font-size: 17px; font-weight: 700; overflow-wrap: anywhere; }
.project p { margin: 0 4px; color: var(--muted); font-size: 13.5px; line-height: 1.55; overflow-wrap: anywhere; }
.project .tech { margin-top: 8px; font-size: 11.5px; font-weight: 600; color: var(--accent); }
.project .link { display: inline-block; margin: 8px 4px 0; font-size: 12px; font-weight: 700; color: var(--accent); }

/* ---------- Education & experience ---------- */
.section { padding: 24px 28px 28px; }
.section-head { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
.section-head h2 { font-size: 23px; font-weight: 800; letter-spacing: -.01em; }

.icon-badge { display: grid; flex: 0 0 42px; width: 42px; height: 42px; place-items: center; border-radius: 50%; background: var(--icon-bg); }
.icon-badge svg { width: 21px; height: 21px; fill: none; stroke: var(--ink); stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }

.entries { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-left: 56px; row-gap: 22px; }
.entry { min-width: 0; padding-right: 24px; break-inside: avoid; }
.entry:nth-child(even) { padding-right: 0; padding-left: 36px; border-left: 1px solid var(--line); }
.entry .date { color: var(--muted); font-size: 12px; }
.entry h3 { font-size: 14px; font-weight: 700; overflow-wrap: anywhere; }
.entry .org { color: var(--muted); font-size: 13px; overflow-wrap: anywhere; }
.entry p.text { margin-top: 10px; color: var(--muted); font-size: 12.5px; line-height: 1.6; overflow-wrap: anywhere; white-space: pre-line; }
.entry ul { margin: 10px 0 0 16px; color: var(--muted); font-size: 12.5px; line-height: 1.6; }
.entry li { overflow-wrap: anywhere; }

.extras { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; padding: 22px 28px; }
.extras:empty { display: none; }
.extras h3 { margin-bottom: 6px; font-size: 13px; font-weight: 800; }
.extras p { color: var(--muted); font-size: 12.5px; overflow-wrap: anywhere; }

.skills { display: flex; flex-wrap: wrap; gap: 8px; margin-left: 56px; }
.skill { padding: 5px 14px; border: 1px solid var(--line); border-radius: 999px; background: #fafbff; font-size: 12.5px; font-weight: 600; }

.links { display: flex; flex-wrap: wrap; gap: 10px; margin-left: 56px; }
.links a { padding: 7px 16px; border: 1px solid var(--line); border-radius: 999px; font-size: 12.5px; font-weight: 600; }

/* ---------- Responsive ---------- */
@media (max-width: 860px) {
  .top { grid-template-columns: minmax(0, 1fr); }
  .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 580px) {
  .wrap { padding: 16px 12px 40px; }
  .grid { grid-template-columns: minmax(0, 1fr); }
  .banner { height: 190px; }
  .avatar-ring { top: 134px; left: 20px; width: 118px; height: 118px; }
  .profile-body { padding: 82px 22px 0; }
  .entries { margin-left: 0; grid-template-columns: minmax(0, 1fr); }
  .entry, .entry:nth-child(even) { padding: 0; border-left: 0; }
  .skills, .links { margin-left: 0; }
  .extras { grid-template-columns: minmax(0, 1fr); }
  .heading { font-size: 30px; }
}

/* ---------- Print / PDF ---------- */
@page { size: A4; margin: 10mm; }

@media print {
  body { background: #fff; }
  .wrap { max-width: none; padding: 0; gap: 14px; }
  .card { box-shadow: none; }
  .top { grid-template-columns: minmax(0, 1fr) 230px; }
  .card, .project, .entry { break-inside: avoid; }
}
`;

const CREATIVE_ICONS = {
  mail: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h3l2 5-2 2a15 15 0 0 0 6 6l2-2 5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z"/></svg>`,
  cap: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m2 9 10-5 10 5-10 5Z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6"/></svg>`,
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/></svg>`,
  star: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z"/></svg>`,
  link: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>`
};

function renderCreativeDocument(d = {}) {
  const name = d.full_name || "Your Name";
  const role = String(d.title || "").trim();

  const about = String(d.about || "").trim();
  const education = parseSimpleEntries(d.education);
  const experience = parseSimpleEntries(d.experience);
  const projects = parseSimpleProjects(d.projects);
  const projectImages = parseImageList(d.project_images);
  const skills = splitSkills(d.skills);

  const email = String(d.email || "").trim();
  const phone = String(d.phone || "").trim();
  const address = String(d.address || "").trim();
  const socialLinks = parseSimpleLinks(d.social_links, email);
  const otherLinks = socialLinks.filter(link => link.kind !== "email");

  const certifications = lines(d.certifications);
  const languages = lines(d.languages);
  const interests = lines(d.interests);

  const profileSrc = safeImageSource(d.profile_image);
  const coverSrc = safeImageSource(d.cover_image);

  const website = otherLinks.find(link => link.kind === "web" && link.url) || null;
  const handle = otherLinks.find(link => link.display) || null;

  /* ---------- Banner + profile ---------- */
  const bannerMarkup = `
    <div class="banner">
      ${coverSrc
        ? `<img src="${escapeHTML(coverSrc)}" alt="" onerror="this.style.display='none'">`
        : ""}
      ${role ? `<div class="sticky">${escapeHTML(role)}</div>` : ""}
      ${skills.length
        ? `<div class="handwritten" aria-hidden="true">${skills.slice(0, 3).map(escapeHTML).join("<br>")}</div>`
        : ""}
    </div>
  `;

  const avatarMarkup = profileSrc
    ? `<img src="${escapeHTML(profileSrc)}" alt="${escapeHTML(name)}" onerror="this.style.display='none'">`
    : escapeHTML(getInitials(name));

  const contactRow = (icon, text, href = "") => text
    ? `<div class="contact-row">${CREATIVE_ICONS[icon]}${href
        ? `<a href="${escapeHTML(href)}"${/^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : ""}>${escapeHTML(text)}</a>`
        : `<span>${escapeHTML(text)}</span>`}</div>`
    : "";

  const contactsMarkup = [
    contactRow("mail", email, email ? `mailto:${email}` : ""),
    contactRow("phone", phone, phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : ""),
    contactRow("pin", address),
    contactRow("globe", website ? website.display : "", website ? website.url : "")
  ].join("");

  /* ---------- Projects ---------- */
  const projectsMarkup = projects.length
    ? projects.map((project, index) => {
        const url = safeUrl(project.url);
        const src = projectImages[index] || "";
        const tech = Array.isArray(project.technologies)
          ? project.technologies.join(", ")
          : String(project.technologies || "");

        return `
          <article class="project">
            <div class="project-img">
              ${src
                ? `<img src="${escapeHTML(src)}" alt="${escapeHTML(project.title)} preview" onerror="this.style.display='none'">`
                : `<span aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>`}
            </div>
            <h3>${escapeHTML(project.title)}</h3>
            ${project.description ? `<p>${escapeHTML(project.description)}</p>` : ""}
            ${tech ? `<p class="tech">${escapeHTML(tech)}</p>` : ""}
            ${url
              ? `<a class="link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">View project ↗</a>`
              : ""}
          </article>
        `;
      }).join("")
    : `<p class="empty">Your projects will appear here when added.</p>`;

  /* ---------- Education / experience ---------- */
  const entryMarkup = entries => entries.map(entry => `
    <article class="entry">
      ${entry.date ? `<div class="date">${escapeHTML(entry.date)}</div>` : ""}
      ${entry.title ? `<h3>${escapeHTML(entry.title)}</h3>` : ""}
      ${entry.subtitle ? `<div class="org">${escapeHTML(entry.subtitle)}</div>` : ""}
      ${entry.description ? `<p class="text">${escapeHTML(entry.description)}</p>` : ""}
      ${entry.bullets.length
        ? `<ul>${entry.bullets.map(b => `<li>${escapeHTML(b)}</li>`).join("")}</ul>`
        : ""}
    </article>
  `).join("");

  const sectionCard = (icon, title, body) => `
    <section class="card section">
      <div class="section-head">
        <span class="icon-badge">${CREATIVE_ICONS[icon]}</span>
        <h2>${escapeHTML(title)}</h2>
      </div>
      ${body}
    </section>
  `;

  const educationCard = sectionCard(
    "cap",
    "Education",
    education.length
      ? `<div class="entries">${entryMarkup(education)}</div>`
      : `<p class="empty" style="margin-left:56px">Education details will appear here when added.</p>`
  );

  const experienceCard = sectionCard(
    "bag",
    "Work Experience",
    experience.length
      ? `<div class="entries">${entryMarkup(experience)}</div>`
      : `<p class="empty" style="margin-left:56px">Experience details will appear here when added.</p>`
  );

  const skillsCard = skills.length
    ? sectionCard(
        "star",
        "Skills",
        `<div class="skills">${skills.map(skill => `<span class="skill">${escapeHTML(skill)}</span>`).join("")}</div>`
      )
    : "";

  const linksCard = otherLinks.length
    ? sectionCard(
        "link",
        "Links & Profiles",
        `<div class="links">${otherLinks.map(link => link.url
          ? `<a href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(link.label)}</a>`
          : `<span>${escapeHTML(link.label)}</span>`).join("")}</div>`
      )
    : "";

  const extraBlock = (title, items) => items.length
    ? `<div><h3>${escapeHTML(title)}</h3><p>${items.map(escapeHTML).join("<br>")}</p></div>`
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
  <title>${escapeHTML(`${name} | Portfolio`)}</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
${CREATIVE_CSS}
  </style>
</head>
<body>
  <main class="wrap">

    <div class="top">
      <section class="card profile">
        ${bannerMarkup}
        <div class="avatar-ring"><div class="avatar">${avatarMarkup}</div></div>

        <div class="profile-body">
          <h1 class="profile-name">${escapeHTML(name)}</h1>
          ${handle ? `<p class="profile-handle">${escapeHTML(handle.display)}</p>` : ""}
          <p class="profile-about">${about
            ? escapeHTML(about)
            : `<span class="empty">Your introduction will appear here when you add it in the portfolio editor.</span>`}</p>
        </div>
      </section>

      <aside class="card contacts">
        <h2>Contacts</h2>
        ${contactsMarkup || `<p class="empty">Add your contact details in the portfolio editor.</p>`}
      </aside>
    </div>

    <section class="card projects">
      <h2 class="heading">Projects</h2>
      <span class="squiggle" aria-hidden="true"></span>
      <div class="grid">${projectsMarkup}</div>
    </section>

    ${educationCard}
    ${experienceCard}
    ${skillsCard}
    ${linksCard}

    ${extrasMarkup ? `<section class="card extras">${extrasMarkup}</section>` : ""}

  </main>
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

  if (template === "modern") {
    return renderModernDocument(d);
  }

  if (template === "creative") {
    return renderCreativeDocument(d);
  }

  return renderLegacyDocument({
    ...d,
    template_key: template
  });
}

export { renderDocument };
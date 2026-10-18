const escapeHTML = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));

function lines(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitSkills(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/[,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function safeUrl(value) {
  const url = String(value || "").trim();

  if (!url) return "";

  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) {
    return url;
  }

  return "";
}

function getInitials(name) {
  return String(name || "Your Name")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getImage(name, imageUrl, className = "avatar") {
  const safeImageUrl = safeUrl(imageUrl);

  if (safeImageUrl) {
    return `
      <img
        class="${className}"
        src="${escapeHTML(safeImageUrl)}"
        alt="${escapeHTML(name)} profile picture"
        onerror="this.style.display='none'"
      >
    `;
  }

  return `
    <div class="${escapeHTML(className)} avatar-placeholder" aria-label="${escapeHTML(name)} initials">
      ${escapeHTML(getInitials(name))}
    </div>
  `;
}

function section(title, body, className = "section") {
  if (!body || !String(body).trim()) return "";

  return `
    <section class="${escapeHTML(className)}">
      <h2>${escapeHTML(title)}</h2>
      ${body}
    </section>
  `;
}

function entryList(value) {
  return lines(value)
    .map((item) => `<li>${escapeHTML(item)}</li>`)
    .join("");
}

function renderTextEntries(value, className = "entry") {
  return lines(value)
    .map((item) => `
      <div class="${escapeHTML(className)}">
        <p>${escapeHTML(item)}</p>
      </div>
    `)
    .join("");
}

function parseEntry(value) {
  if (value && typeof value === "object") {
    return {
      date: value.date || value.period || value.year || "",
      title: value.title || value.degree || value.position || value.name || "",
      subtitle: value.subtitle || value.school || value.company || value.organization || "",
      description: value.description || value.details || "",
      technologies: value.technologies || value.tech || "",
      url: value.url || value.link || ""
    };
  }

  const text = String(value || "").trim();

  return {
    date: "",
    title: text,
    subtitle: "",
    description: "",
    technologies: "",
    url: ""
  };
}

function normalizeEntries(value) {
  if (Array.isArray(value)) {
    return value
      .map(parseEntry)
      .filter((entry) =>
        entry.title ||
        entry.subtitle ||
        entry.description ||
        entry.date
      );
  }

  return lines(value).map(parseEntry);
}

function renderTimelineEntries(value) {
  return normalizeEntries(value)
    .map((entry) => `
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
      .map((project) => ({
        title: project && typeof project === "object"
          ? project.title || project.name || "Project"
          : String(project || "").trim(),
        description: project && typeof project === "object"
          ? project.description || project.details || ""
          : "",
        technologies: project && typeof project === "object"
          ? project.technologies || project.tech || ""
          : "",
        url: project && typeof project === "object"
          ? project.url || project.link || ""
          : ""
      }))
      .filter((project) =>
        project.title ||
        project.description ||
        project.technologies
      );
  }

  return lines(value).map((item) => ({
    title: item,
    description: "",
    technologies: "",
    url: ""
  }));
}

function renderProjects(value) {
  return normalizeProjects(value)
    .map((project) => {
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
            ? `<a
                 class="project-link"
                 href="${escapeHTML(url)}"
                 target="_blank"
                 rel="noopener noreferrer"
               >View project</a>`
            : ""}
        </article>
      `;
    })
    .join("");
}

function normalizeSocialLinks(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === "object") {
          return {
            label: item.label || item.name || item.platform || "Website",
            url: item.url || item.link || ""
          };
        }

        const text = String(item || "").trim();
        const match = text.match(/https?:\/\/\S+/i);

        return {
          label: match
            ? text.replace(match[0], "").replace(/^[-•\s]+/, "").trim() ||
              match[0].replace(/^https?:\/\//i, "")
            : text,
          url: match ? match[0] : ""
        };
      })
      .filter((item) => item.label || item.url);
  }

  return lines(value).map((item) => {
    const match = item.match(/https?:\/\/\S+/i);
    const url = match ? match[0] : "";
    const label = item
      .replace(url, "")
      .replace(/^[-•\s]+/, "")
      .trim();

    return {
      label: label || url.replace(/^https?:\/\//i, "") || item,
      url
    };
  });
}

function linkList(value, className = "links") {
  return normalizeSocialLinks(value)
    .map((item) => {
      const url = safeUrl(item.url);

      if (!url) {
        return `<span>${escapeHTML(item.label)}</span>`;
      }

      return `
        <a
          href="${escapeHTML(url)}"
          target="_blank"
          rel="noopener noreferrer"
        >${escapeHTML(item.label || url)}</a>
      `;
    })
    .join("");
}

function iconSvg(type) {
  const paths = {
    email: `
      <rect x="3" y="5" width="18" height="14" rx="2"></rect>
      <path d="m3 7 9 6 9-6"></path>
    `,
    phone: `
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2
        19.8 19.8 0 0 1-8.6-3.1
        19.4 19.4 0 0 1-6-6
        19.8 19.8 0 0 1-3.1-8.6
        A2 2 0 0 1 4.1 2h3
        a2 2 0 0 1 2 1.7
        c.1 1 .4 2 .7 2.9
        a2 2 0 0 1-.5 2.1L8 10
        a16 16 0 0 0 6 6l1.3-1.3
        a2 2 0 0 1 2.1-.5
        c.9.3 1.9.6 2.9.7
        a2 2 0 0 1 1.7 2z"></path>
    `,
    location: `
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z"></path>
      <circle cx="12" cy="10" r="2.5"></circle>
    `
  };

  return `
    <svg
      class="icon"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      viewBox="0 0 24 24"
    >${paths[type] || ""}</svg>
  `;
}

function renderContactItem(type, label, href = "") {
  if (!label) return "";

  const content = `
    ${iconSvg(type)}
    <span>${escapeHTML(label)}</span>
  `;

  if (href) {
    return `
      <li class="contact-item">
        <a href="${escapeHTML(href)}">${content}</a>
      </li>
    `;
  }

  return `<li class="contact-item">${content}</li>`;
}

/* =========================================================
   SIMPLE TEMPLATE
   Uses the layout and visual system from simple.html/simple.css
   ========================================================= */

function renderSimpleDocument(d = {}) {
  const name = d.full_name || "Your Name";
  const title = d.title || "My Portfolio";
  const about = d.about || "Add an introduction about yourself in the editor.";

  const image = getImage(name, d.profile_image);

  const email = String(d.email || "").trim();
  const phone = String(d.phone || "").trim();
  const address = String(d.address || "").trim();

  const education = renderTimelineEntries(d.education);
  const experience = renderTimelineEntries(d.experience);
  const projects = renderProjects(d.projects);
  const skills = splitSkills(d.skills);
  const socialLinks = normalizeSocialLinks(d.social_links);

  const languages = lines(d.languages);
  const certifications = lines(d.certifications);
  const interests = lines(d.interests);

  const contactItems = [
    renderContactItem(
      "email",
      email,
      email ? `mailto:${email}` : ""
    ),
    renderContactItem(
      "phone",
      phone,
      phone ? `tel:${phone}` : ""
    ),
    renderContactItem("location", address)
  ].filter(Boolean).join("");

  const skillsMarkup = skills.length
    ? skills.map((skill) => `
        <span class="chip">${escapeHTML(skill)}</span>
      `).join("")
    : `<p class="empty-state">Add your skills in the editor.</p>`;

  const socialMarkup = socialLinks.length
    ? socialLinks.map((item) => {
        const url = safeUrl(item.url);

        if (!url) {
          return `<li><span class="link-placeholder">${escapeHTML(item.label)}</span></li>`;
        }

        return `
          <li>
            <a
              href="${escapeHTML(url)}"
              target="_blank"
              rel="noopener noreferrer"
            >${escapeHTML(item.label || url)}</a>
          </li>
        `;
      }).join("")
    : `<li class="empty-state">Add your social links in the editor.</li>`;

  const additionalInformation = [
    languages.length
      ? `<p><strong>Languages:</strong> ${escapeHTML(languages.join(", "))}</p>`
      : "",
    certifications.length
      ? `<p><strong>Certifications:</strong> ${escapeHTML(certifications.join(", "))}</p>`
      : "",
    interests.length
      ? `<p><strong>Interests:</strong> ${escapeHTML(interests.join(", "))}</p>`
      : ""
  ].filter(Boolean).join("");

  const educationMarkup = education ||
    `<p class="empty-state">Add your educational background in the editor.</p>`;

  const experienceMarkup = experience ||
    `<p class="empty-state">Add your work experience in the editor.</p>`;

  const projectsMarkup = projects
    ? `<div class="project-grid">${projects}</div>`
    : `<p class="empty-state">Add your projects in the editor.</p>`;

  const additionalMarkup = additionalInformation ||
    `<p class="empty-state">Add languages, certifications, or interests in the editor.</p>`;

  const contactSection = contactItems
    ? `
      <section class="card">
        <h2 class="section-title">Contact</h2>
        <ul class="contact-list contact-list-dark">
          ${contactItems}
        </ul>
      </section>
    `
    : "";

  const safeTitle = escapeHTML(title);
  const safeName = escapeHTML(name);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${safeTitle} — ${safeName}</title>

  <link
    href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
    rel="stylesheet"
  >

  <style>
    :root {
      --blue: #1d4ed8;
      --blue-dark: #1e3a8a;
      --blue-tint: #eff6ff;
      --blue-line: #dbeafe;
      --ink: #0f1e45;
      --text: #475677;
      --white: #ffffff;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    html {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      margin: 0;
      background: var(--blue-tint);
      color: var(--text);
      font-family: "Manrope", system-ui, sans-serif;
      font-size: 0.9375rem;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    h1, h2, h3, p, ul {
      margin: 0;
      padding: 0;
    }

    ul {
      list-style: none;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    a:focus-visible {
      outline: 2px solid var(--blue);
      outline-offset: 3px;
      border-radius: 4px;
    }

    img {
      max-width: 100%;
    }

    .hero {
      background: var(--blue);
      color: var(--white);
      padding: 3rem 1.25rem 5.5rem;
    }

    .hero-inner {
      max-width: 64rem;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      text-align: center;
    }

    .avatar {
      width: 9.5rem;
      height: 9.5rem;
      flex-shrink: 0;
      border-radius: 50%;
      object-fit: cover;
      border: 5px solid var(--white);
      background: var(--white);
    }

    .avatar-placeholder {
      display: grid;
      place-items: center;
      color: var(--blue);
      font-size: 2rem;
      font-weight: 800;
    }

    .hero-text {
      min-width: 0;
      width: 100%;
    }

    .name {
      font-size: 2.25rem;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: -0.02em;
      overflow-wrap: anywhere;
    }

    .role {
      margin-top: 0.25rem;
      font-weight: 500;
      color: var(--blue-line);
      overflow-wrap: anywhere;
    }

    .contact-list {
      margin-top: 1.25rem;
      display: grid;
      gap: 0.6rem;
      font-size: 0.875rem;
      justify-items: center;
    }

    .contact-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      min-width: 0;
      text-align: left;
      overflow-wrap: anywhere;
    }

    .contact-item a {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      overflow-wrap: anywhere;
    }

    .icon {
      width: 1.1rem;
      height: 1.1rem;
      margin-top: 0.15rem;
      flex-shrink: 0;
    }

    .page {
      max-width: 64rem;
      margin: -3rem auto 0;
      padding: 0 1.25rem;
      display: grid;
      gap: 1.25rem;
    }

    .main,
    .side {
      display: grid;
      gap: 1.25rem;
      align-content: start;
      min-width: 0;
    }

    .card {
      min-width: 0;
      background: var(--white);
      padding: 1.5rem;
      border-radius: 1rem;
      display: grid;
      gap: 0.75rem;
      box-shadow:
        0 1px 2px rgba(29, 78, 216, 0.08),
        0 0 0 1px var(--blue-line);
      overflow-wrap: anywhere;
      break-inside: avoid;
    }

    .section-title {
      font-size: 1.0625rem;
      font-weight: 800;
      color: var(--blue);
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--blue-line);
    }

    .card strong {
      color: var(--ink);
    }

    .entry {
      padding-left: 1rem;
      border-left: 3px solid var(--blue);
    }

    .entry + .entry {
      margin-top: 0.5rem;
    }

    .entry-date {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--blue);
    }

    .entry-title {
      font-weight: 700;
      color: var(--ink);
    }

    .entry-sub {
      font-size: 0.875rem;
    }

    .entry-description {
      margin-top: 0.35rem;
      font-size: 0.875rem;
    }

    .project-grid {
      display: grid;
      gap: 1rem;
    }

    .project {
      min-width: 0;
      display: flex;
      flex-direction: column;
      padding: 1.1rem;
      border-radius: 0.75rem;
      background: var(--blue-tint);
      break-inside: avoid;
    }

    .project-desc {
      margin-top: 0.35rem;
      flex: 1;
      font-size: 0.875rem;
    }

    .project-tech {
      margin-top: 0.6rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--blue);
    }

    .project-link {
      align-self: flex-start;
      margin-top: 0.5rem;
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--blue-dark);
      text-decoration: underline;
      text-underline-offset: 4px;
      overflow-wrap: anywhere;
    }

    .chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .chip {
      padding: 0.3rem 0.8rem;
      border-radius: 999px;
      background: var(--blue-tint);
      color: var(--blue-dark);
      font-size: 0.8125rem;
      font-weight: 700;
      overflow-wrap: anywhere;
    }

    .link-list {
      display: grid;
      gap: 0.5rem;
    }

    .link-list a,
    .link-placeholder {
      display: block;
      padding: 0.6rem 0.9rem;
      border-radius: 0.6rem;
      background: var(--blue);
      color: var(--white);
      font-weight: 700;
      overflow-wrap: anywhere;
    }

    .link-list a:hover {
      background: var(--blue-dark);
      text-decoration: none;
    }

    .contact-list-dark {
      justify-items: start;
      color: var(--text);
    }

    .contact-list-dark .contact-item a {
      color: var(--blue-dark);
    }

    .empty-state {
      color: #64748b;
      font-size: 0.875rem;
      font-style: italic;
    }

    .footer {
      padding: 2rem 1rem;
      text-align: center;
      font-size: 0.8125rem;
      color: var(--text);
    }

    @media (min-width: 840px) {
      .hero {
        padding: 3.5rem 2rem 6rem;
      }

      .hero-inner {
        flex-direction: row;
        text-align: left;
        gap: 2.5rem;
      }

      .avatar {
        width: 11rem;
        height: 11rem;
      }

      .name {
        font-size: 2.75rem;
      }

      .contact-list {
        justify-items: start;
      }

      .page {
        grid-template-columns: minmax(0, 1fr) 19rem;
        gap: 1.5rem;
        padding: 0 2rem;
      }

      .project-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 420px) {
      .hero {
        padding-left: 1rem;
        padding-right: 1rem;
      }

      .page {
        padding-left: 0.875rem;
        padding-right: 0.875rem;
      }

      .card {
        padding: 1.15rem;
      }

      .name {
        font-size: 1.9rem;
      }
    }

    @page {
      size: A4;
      margin: 12mm;
    }

    @media print {
      body {
        background: #ffffff;
      }

      .hero {
        padding: 1.5rem;
      }

      .page {
        margin: 1.25rem auto 0;
        padding: 0;
        grid-template-columns: minmax(0, 1fr) 15rem;
        gap: 0.75rem;
      }

      .main,
      .side {
        gap: 0.75rem;
      }

      .card {
        padding: 1rem;
        box-shadow: 0 0 0 1px var(--blue-line);
      }

      .avatar {
        width: 7rem;
        height: 7rem;
      }

      .name {
        font-size: 1.8rem;
      }

      .footer {
        padding: 1rem;
      }

      a {
        text-decoration: none;
      }
    }
  </style>
</head>

<body>
  <header class="hero">
    <div class="hero-inner">
      ${image}

      <div class="hero-text">
        <h1 class="name">${safeName}</h1>
        <p class="role">${safeTitle}</p>

        ${contactItems
          ? `<ul class="contact-list">${contactItems}</ul>`
          : ""}
      </div>
    </div>
  </header>

  <div class="page">
    <main class="main">
      <section class="card">
        <h2 class="section-title">About me</h2>
        <p>${escapeHTML(about)}</p>
      </section>

      <section class="card">
        <h2 class="section-title">Educational background</h2>
        ${educationMarkup}
      </section>

      <section class="card">
        <h2 class="section-title">Work experience</h2>
        ${experienceMarkup}
      </section>

      <section class="card">
        <h2 class="section-title">Projects</h2>
        ${projectsMarkup}
      </section>
    </main>

    <aside class="side">
      <section class="card">
        <h2 class="section-title">Skills</h2>
        <div class="chip-list">${skillsMarkup}</div>
      </section>

      <section class="card">
        <h2 class="section-title">Links</h2>
        <ul class="link-list">${socialMarkup}</ul>
      </section>

      <section class="card">
        <h2 class="section-title">Additional information</h2>
        ${additionalMarkup}
      </section>

      ${contactSection}
    </aside>
  </div>

  <footer class="footer">Created with SOYON</footer>
</body>
</html>`;
}

/* =========================================================
   LEGACY RENDERER
   Preserves the existing Modern and Creative templates.
   ========================================================= */

function renderLegacyDocument(d = {}) {
  const name = escapeHTML(d.full_name || "Your Name");
  const about = escapeHTML(
    d.about || "Add an introduction about yourself in the editor."
  );
  const title = escapeHTML(d.title || "My Portfolio");

  const template = ["modern", "creative"].includes(d.template_key)
    ? d.template_key
    : "modern";

  const image = d.profile_image
    ? `<img class="avatar" src="${escapeHTML(d.profile_image)}" alt="${name} profile picture" onerror="this.style.display='none'">`
    : `<div class="avatar avatar-placeholder">${escapeHTML(
        getInitials(d.full_name || "Y")
      )}</div>`;

  const contact = [
    d.email && `<a href="mailto:${escapeHTML(d.email)}">${escapeHTML(d.email)}</a>`,
    d.phone && `<a href="tel:${escapeHTML(d.phone)}">${escapeHTML(d.phone)}</a>`,
    d.address && `<span>${escapeHTML(d.address)}</span>`
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
          (skill) => `<span>${escapeHTML(skill)}</span>`
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

      ${contact
        ? section("Contact", `<div class="links">${contact}</div>`)
        : ""}
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
        flex-shrink: 0;
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

      .contact,
      .links {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .hero a {
        color: #bfdbfe;
      }

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
        overflow-wrap: anywhere;
      }

      .section h2 {
        color: #93c5fd;
        margin: 0 0 12px;
        font-size: 19px;
      }

      .section p {
        margin: 0;
      }

      .section ul {
        padding-left: 20px;
        margin: 0;
      }

      .skills span,
      .links a {
        display: inline-block;
        background: #334155;
        border-radius: 999px;
        padding: 6px 10px;
        margin: 3px;
        color: #dbeafe;
        overflow-wrap: anywhere;
      }

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

        .content {
          grid-template-columns: 1fr;
        }

        .avatar {
          width: 90px;
          height: 90px;
        }
      }
    `;
  } else {
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

      .contact,
      .links {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        overflow-wrap: anywhere;
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
        overflow-wrap: anywhere;
      }

      .section h2 {
        font-size: 16px;
        text-transform: uppercase;
        letter-spacing: .08em;
        border-bottom: 2px solid #171a19;
        padding-bottom: 9px;
        margin: 0 0 12px;
      }

      .section p {
        margin: 0;
      }

      .section ul {
        padding-left: 20px;
        margin: 0;
      }

      .skills span {
        display: inline-block;
        border: 1px solid #171a19;
        padding: 4px 8px;
        margin: 3px;
      }

      .links a {
        overflow-wrap: anywhere;
      }

      footer {
        max-width: 920px;
        margin: 0 auto;
        padding: 22px 20px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: .12em;
      }

      @media (max-width: 650px) {
        .hero-inner {
          grid-template-columns: 1fr;
        }

        .content {
          grid-template-columns: 1fr;
        }
      }
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — ${name}</title>

  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
    rel="stylesheet"
  >

  <style>
    *,
    *::before,
    *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    html {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      margin: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    img {
      max-width: 100%;
    }

    @page {
      size: A4;
      margin: 0;
    }

    @media print {
      html,
      body {
        width: 100%;
        margin: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .hero,
      .avatar-placeholder,
      .skills span,
      a,
      section,
      footer {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
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

/* =========================================================
   TEMPLATE DISPATCHER
   ========================================================= */

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
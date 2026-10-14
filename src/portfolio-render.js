const escapeHTML = (value = "") =>
  String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

function lines(value) {
  return String(value || "")
    .split(/\n+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function linkList(value) {
  return lines(value).map(line => {
    const match = line.match(/https?:\/\/\S+/);
    const url = match ? match[0] : "";

    const label = line
      .replace(url, "")
      .replace(/^[-•\s]+/, "")
      .trim() || url.replace(/^https?:\/\//, "");

    return url
      ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener">${escapeHTML(label)}</a>`
      : `<span>${escapeHTML(label)}</span>`;
  }).join("");
}

function section(title, body) {
  return body
    ? `<section class="section"><h2>${escapeHTML(title)}</h2>${body}</section>`
    : "";
}

function entryList(value) {
  return lines(value)
    .map(item => `<li>${escapeHTML(item)}</li>`)
    .join("");
}

function renderDocument(d = {}) {
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
        (d.full_name || "Y")
          .split(/\s+/)
          .map(x => x[0])
          .join("")
          .slice(0, 2)
      )}</div>`;

  const contact = [
    d.email && `<a href="mailto:${escapeHTML(d.email)}">${escapeHTML(d.email)}</a>`,
    d.phone && `<a href="tel:${escapeHTML(d.phone)}">${escapeHTML(d.phone)}</a>`,
    d.address && `<span>${escapeHTML(d.address)}</span>`
  ].filter(Boolean).join("");

  const skills = lines((d.skills || "").replace(/,/g, "\n"));

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
    * { box-sizing: border-box; }
    body { margin: 0; }
    a { color: inherit; }
    img { max-width: 100%; }
    ${styles}
  </style>
</head>
<body>
  ${common}
</body>
</html>`;
}

export { renderDocument };

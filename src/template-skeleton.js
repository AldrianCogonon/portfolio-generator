/*
  Skeleton thumbnails for the three templates.
  Each one follows the layout of the real rendered screen:
    simple   - cream pages: cover, about + education, skills + experience
    modern   - maroon cover with about, education + skills, projects, experience pages
    creative - banner profile card, contacts, projects grid, education, experience
*/

const shape = (x, y, w, h, css = "") =>
  `<i style="left:${x}%;top:${y}%;width:${w}%;${
    h == null ? "aspect-ratio:1;" : `height:${h}%;`
  }${css}"></i>`;

/* Simple pages are drawn on a 100 x 141.4 grid so squares and circles stay true. */
const PAGE_H = 141.4;
const sp = (x, y, w, h, css = "") =>
  shape(x, (y / PAGE_H) * 100, w, h == null ? null : (h / PAGE_H) * 100, css);

const lines = (count, x, y, w, step, color, h = 1.8, sp_ = sp, shrink = 0.35) =>
  Array.from({ length: count }, (_, i) =>
    sp_(x, y + i * step, i === count - 1 ? w * (1 - shrink) : w, h, `background:${color}`)
  ).join("");

function simpleSkeleton() {
  const ink = "#1c1a19";
  const mute = "#9a948c";
  const faint = "#cfc8be";
  const foot = n =>
    sp(17, 131, 60, 0.4, `background:${faint}`) + sp(83, 130, 9, 2, `background:${mute}`);

  const cover = `
    <div class="tsk-page">
      ${sp(7, 12, 6, 112, "background:#f3dfd9")}
      ${sp(17, 14, 56, 10, `background:${ink}`)}
      ${sp(17, 30, 40, 5, `background:${ink};opacity:.85`)}
      ${sp(17, 38, 26, 3, `background:${mute}`)}
      ${sp(17, 46, 76, 34, "background:#d6cfc4")}
      ${sp(48, 51, 14, null, "background:#bdb4a6;border-radius:50%")}
      ${sp(40, 65, 30, 15, "background:#bdb4a6;border-radius:50% 50% 0 0")}
      ${sp(17, 80, 76, 24, "background:#f2e4df")}
      ${sp(21, 86, 4, null, `background:${ink};border-radius:50%`)}
      ${sp(28, 85, 11, 1.6, `background:${ink}`)}
      ${sp(28, 89, 24, 2, `background:${mute}`)}
      ${sp(60, 86, 4, null, `background:${ink};border-radius:50%`)}
      ${sp(67, 85, 11, 1.6, `background:${ink}`)}
      ${sp(67, 89, 20, 2, `background:${mute}`)}
      ${sp(21, 96, 4, null, `background:${ink};border-radius:50%`)}
      ${sp(28, 95, 11, 1.6, `background:${ink}`)}
      ${sp(28, 99, 18, 2, `background:${mute}`)}
      ${foot()}
    </div>`;

  const about = `
    <div class="tsk-page">
      ${sp(7, 12, 42, 112, "background:#efe9e0")}
      ${sp(12, 18, 16, 1.6, `background:${ink};opacity:.7`)}
      ${sp(12, 24, 26, 6, `background:${ink}`)}
      ${sp(12, 34, 30, 0.5, `background:${ink}`)}
      ${lines(8, 12, 42, 32, 5, mute, 2, sp)}
      ${sp(56, 24, 26, 6, `background:${ink}`)}
      ${sp(56, 34, 34, 0.5, `background:${ink}`)}
      ${sp(56, 42, 30, 2.6, `background:${ink}`)}
      ${sp(56, 47, 24, 2, `background:${mute}`)}
      ${sp(56, 51, 16, 2, `background:${mute}`)}
      ${sp(56, 58, 34, 0.4, `background:${faint}`)}
      ${sp(56, 64, 26, 2.6, `background:${ink}`)}
      ${sp(56, 69, 20, 2, `background:${mute}`)}
      ${sp(56, 73, 14, 2, `background:${mute}`)}
      ${foot()}
    </div>`;

  const chips = [
    [24, 42, 9], [35, 42, 11], [48, 42, 13], [63, 42, 9],
    [24, 49, 12], [38, 49, 8], [48, 49, 11], [61, 49, 14]
  ].map(([x, y, w]) => sp(x, y, w, 5, `border:1px solid ${faint};border-radius:99px`)).join("");

  const skills = `
    <div class="tsk-page">
      ${sp(7, 12, 10, 112, "background:#ddd6cc")}
      ${sp(10.5, 52, 2.6, 34, `background:${mute}`)}
      ${sp(26, 18, 14, 1.6, `background:${ink};opacity:.7`)}
      ${sp(26, 24, 20, 6, `background:${ink}`)}
      ${sp(26, 34, 66, 0.5, `background:${ink}`)}
      ${chips.replace(/left:(\d+)%/g, (_, n) => `left:${Number(n) + 2}%`)}
      ${sp(26, 66, 14, 1.6, `background:${ink};opacity:.7`)}
      ${sp(26, 72, 26, 6, `background:${ink}`)}
      ${sp(26, 82, 66, 0.5, `background:${ink}`)}
      ${sp(26, 90, 34, 2.8, `background:${ink}`)}
      ${sp(26, 95, 22, 2, `background:${mute}`)}
      ${lines(3, 30, 101, 50, 5, mute, 2, sp, 0.3)}
      ${foot()}
    </div>`;

  return `<div class="tsk tsk-simple" aria-hidden="true">${cover}${about}${skills}</div>`;
}

function modernSkeleton() {
  const m = "#741f42";
  const ink = "#20252d";
  const gray = "#c9ccd2";
  const pink = "#f3e8ed";

  const header = (label = 22) =>
    shape(9, 7, 7, 3, `background:${m}`) +
    shape(20, 7.6, label, 2, `background:${ink}`) +
    shape(48, 8.4, 44, 0.5, "background:#d7d7dc");

  const cover = `
    <div class="tsk-mpage tsk-mcover">
      ${shape(0, 0, 9, 7, `background:${m}`)}
      ${shape(14, 8, 34, 1.5, `background:${ink};opacity:.7`)}
      ${shape(14, 15, 66, 6.5, `background:${ink}`)}
      ${shape(14, 23.5, 52, 6.5, `background:${m}`)}
      ${shape(14, 33, 70, 1.4, `background:${ink}`)}
      ${shape(14, 38, 40, 1.4, `background:${gray}`)}
      ${shape(14, 41, 34, 1.4, `background:${gray}`)}
      ${shape(12, 49, 76, 36, `background:${pink};border-radius:999px 999px 3px 3px`)}
      ${shape(43, 56, 14, null, "background:#e6cbd6;border-radius:50%")}
      ${shape(36, 66, 28, 19, "background:#e6cbd6;border-radius:999px 999px 0 0")}
      ${shape(14, 91, 9, 0.5, `background:${m}`)}
      ${shape(14, 93.5, 30, 1.3, `background:${m}`)}
      ${shape(14, 96, 38, 1.3, `background:${m}`)}
    </div>`;

  const about = `
    <div class="tsk-mpage">
      ${header(26)}
      ${shape(9, 18, 26, 2.4, `background:${m}`)}
      ${shape(9, 25, 62, 5.5, `background:${ink}`)}
      ${shape(9, 33, 46, 5.5, `background:${ink}`)}
      ${shape(9, 43, 82, 1.8, `background:${gray}`)}
      ${shape(9, 47, 78, 1.8, `background:${gray}`)}
      ${shape(9, 51, 50, 1.8, `background:${gray}`)}
      ${shape(7, 58, 86, 34, `background:#f7f2f4;border-radius:5px`)}
      ${shape(11, 62, 30, 2.6, `background:${m}`)}
      ${shape(11, 69, 8, null, `background:${m};border-radius:50%`)}
      ${shape(22, 69.5, 30, 1.8, `background:${ink}`)}
      ${shape(22, 74, 42, 1.6, `background:${gray}`)}
      ${shape(11, 80, 8, null, `background:${m};border-radius:50%`)}
      ${shape(22, 80.5, 26, 1.8, `background:${ink}`)}
      ${shape(22, 85, 50, 1.6, `background:${gray}`)}
    </div>`;

  const skills = Array.from({ length: 12 }, (_, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    return (
      shape(9 + col * 21, 68 + row * 10.5, 19, 9, "background:#f5f3f5;border-radius:3px") +
      shape(12 + col * 21, 70 + row * 10.5, 13, 3.2, `background:${m}`)
    );
  }).join("");

  const education = `
    <div class="tsk-mpage">
      ${header(32)}
      ${shape(10, 18, 8, null, `background:${m};border-radius:50%;opacity:.85`)}
      ${shape(22, 20, 24, 3, `background:${ink}`)}
      ${shape(14, 33, 0.9, 26, `background:${m}`)}
      ${shape(11.6, 33, 5.5, null, `background:${m};border-radius:50%`)}
      ${shape(21, 32, 26, 4, `background:${pink};border-radius:2px`)}
      ${shape(21, 39, 62, 2, `background:${ink}`)}
      ${shape(21, 43, 44, 1.6, `background:${gray}`)}
      ${shape(11.6, 50, 5.5, null, `background:${m};border-radius:50%`)}
      ${shape(21, 49, 26, 4, `background:${pink};border-radius:2px`)}
      ${shape(21, 56, 54, 2, `background:${ink}`)}
      ${shape(10, 63, 8, null, `background:${m};border-radius:50%;opacity:.85`)}
      ${shape(22, 65, 16, 3, `background:${ink}`)}
      ${skills}
    </div>`;

  const projects = `
    <div class="tsk-mpage">
      ${header(24)}
      ${[0, 1, 2].map(i => `
        ${shape(7, 18 + i * 25, 86, 22, "background:#f7f7f8;border:1px solid #ececef;border-radius:5px")}
        ${shape(10, 21 + i * 25, 34, 16, "background:#eee7eb;border-radius:3px")}
        ${shape(49, 22 + i * 25, 30, 2.4, `background:${ink}`)}
        ${shape(49, 27 + i * 25, 40, 1.6, `background:${gray}`)}
        ${shape(49, 30.5 + i * 25, 32, 1.6, `background:${gray}`)}
        ${shape(49, 35 + i * 25, 14, 3, "background:#eadce3;border-radius:2px")}
        ${shape(65, 35 + i * 25, 14, 3, "background:#eadce3;border-radius:2px")}
      `).join("")}
    </div>`;

  const experience = `
    <div class="tsk-mpage">
      ${header(30)}
      ${shape(12, 20, 0.9, 52, `background:${m}`)}
      ${[0, 1, 2].map(i => `
        ${shape(10, 21 + i * 17, 5.5, null, `background:${m};border-radius:50%`)}
        ${shape(20, 19 + i * 17, 24, 4, `background:${pink};border-radius:2px`)}
        ${shape(20, 26 + i * 17, 46, 2.2, `background:${ink}`)}
        ${shape(20, 30.5 + i * 17, 62, 1.6, `background:${gray}`)}
      `).join("")}
      ${shape(24, 82, 52, 2.4, `background:${m};opacity:.8`)}
      ${shape(32, 87, 36, 2.4, `background:${m};opacity:.8`)}
    </div>`;

  return `<div class="tsk tsk-modern" aria-hidden="true">${cover}${about}${education}${projects}${experience}</div>`;
}

function creativeSkeleton() {
  const ink = "#0e1a3f";
  const mute = "#b4bdd6";
  const iconBg = "#e4e7fb";
  const card = (x, y, w, h) =>
    `<i class="card" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%;border-radius:10px"></i>`;

  const tiles = [
    ["linear-gradient(135deg,#e4e7fb,#fbe3ef)", 7],
    ["linear-gradient(135deg,#fff3c4,#ffe0b8)", 36.5],
    ["linear-gradient(135deg,#d6ecff,#c9f0ea)", 66]
  ].map(([bg, x]) =>
    shape(x, 56, 27, 14.5, `background:${bg};border-radius:5px`) +
    shape(x + 1.5, 72.5, 14, 2, `background:${ink}`) +
    shape(x + 1.5, 76, 22, 1.4, `background:${mute}`)
  ).join("");

  const sectionCard = (y, h) => `
    ${card(4, y, 92, h)}
    ${shape(7, y + h * 0.28, 4.4, null, `background:${iconBg};border-radius:50%`)}
    ${shape(13.5, y + h * 0.38, 15, 2.2, `background:${ink}`)}
    ${shape(13.5, y + h * 0.7, 26, 1.6, `background:${mute}`)}
    ${shape(55, y + h * 0.7, 26, 1.6, `background:${mute}`)}
    ${shape(52, y + h * 0.28, 0.4, h * 0.58, "background:#e8ecf5")}`;

  return `<div class="tsk tsk-creative" aria-hidden="true">
    ${card(4, 4, 66, 37)}
    ${shape(4, 4, 66, 17, "background:linear-gradient(135deg,#5eb6f2,#9bd4f8 60%,#d9eefc);border-radius:10px 10px 0 0")}
    ${shape(8, 8, 18, 5, "background:#fff27a;transform:rotate(-7deg)")}
    ${shape(57, 13.5, 9, 1.3, "background:#fff27a;transform:rotate(-7deg)")}
    ${shape(58, 16, 7, 1.3, "background:#fff27a;transform:rotate(-7deg)")}
    ${shape(7, 13, 13, null, "background:conic-gradient(from 200deg,#ff5fa2,#ff9a3d,#ffd23d,#b45cff,#ff5fa2);border-radius:50%")}
    ${shape(8, 14, 11, null, `background:${iconBg};border:2px solid #fff;border-radius:50%`)}
    ${shape(24, 25, 24, 3, `background:${ink}`)}
    ${shape(24, 30, 13, 1.6, `background:${mute}`)}
    ${shape(24, 34, 42, 1.5, `background:${mute}`)}
    ${shape(24, 37, 34, 1.5, `background:${mute}`)}

    ${card(73, 4, 23, 26)}
    ${shape(76, 8, 11, 2.4, `background:${ink}`)}
    ${[0, 1, 2].map(i =>
      shape(76, 14 + i * 5.4, 3, null, `background:${iconBg};border-radius:50%`) +
      shape(81, 15 + i * 5.4, 12, 1.6, `background:${mute}`)
    ).join("")}

    ${card(4, 44, 92, 37)}
    ${shape(7, 47, 14, 3.6, `background:${ink}`)}
    ${shape(7, 52, 7, 0.9, "background:#7c5cf0;border-radius:3px")}
    ${tiles}

    ${sectionCard(83.5, 7)}
    ${sectionCard(91.5, 7)}
  </div>`;
}

const builders = {
  simple: simpleSkeleton,
  modern: modernSkeleton,
  creative: creativeSkeleton
};

export function renderTemplateSkeleton(templateKey) {
  return (builders[templateKey] || builders.simple)();
}

/* Fills any <element data-skeleton="simple|modern|creative"> (used by static HTML pages). */
export function fillTemplateSkeletons(root = document) {
  root.querySelectorAll("[data-skeleton]").forEach(element => {
    element.innerHTML = renderTemplateSkeleton(element.dataset.skeleton);
  });
}
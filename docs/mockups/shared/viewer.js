// The tabs (one group per open decision), the sections, and the frames of the application.
// Decided on 2026-11-01: style D · Néon, the electric blue, a logo from an RJ45 jack
// (docs/branding.md). The open decision: which drawing of the jack.
const LOGO_NAMES = { frame: "Cadre", solid: "Prise pleine", tile: "Bloc évidé", plug: "Fiche" };
const VARIANTS = {
  logo: { label: "Logo RJ45", options: LOGO_NAMES, fallback: "frame" },
};
const params = new URLSearchParams(location.search);
const chosen = Object.fromEntries(Object.entries(VARIANTS).map(([key, v]) => [key, params.get(key) in v.options ? params.get(key) : v.fallback]));

// The newest section first. Each slot: [label, device, address of app.html].
const SECTIONS = [
  ["Logo", "Four drawings of the RJ45 jack (tab Logo RJ45), each with its contacts in the blue signal: here at every size, down to the 16 px of a browser tab, and in the header and the welcome of the other sections.", [
    ["Board", "board", "screen=logo"],
  ]],
  ["Who voted and the confirmation", "Tap a score (or hover it on a PC) to see who voted; « Retirer » opens the confirmation, as a sheet from the bottom on a phone and a window on a PC.", [
    ["Phone · who voted (a friend)", "phone", "screen=bag&panel=voters"],
    ["Phone · removing one’s game", "phone", "screen=bag&panel=remove"],
    ["PC · removing a game (the admin)", "pc", "screen=bag&as=admin&panel=remove"],
  ]],
  ["Welcome", "The three fields; the errors come in a later section.", [
    ["Phone", "phone", "screen=welcome"],
    ["PC", "pc", "screen=welcome"],
  ]],
  ["The bag", "The main screen, with real covers of Steam. Everything reacts: vote, filter, tap a score, « Retirer ». The phone frame scrolls.", [
    ["Phone · a friend (Nova)", "phone", "screen=bag"],
    ["PC · the admin (Sylent)", "pc", "screen=bag&as=admin"],
  ]],
];

function frame([label, device, query]) {
  const src = `app.html?${query}&logo=${chosen.logo}`;
  return `<div class="slot"><span>${label} · <a href="${src}" target="_blank">open alone</a></span>
    <div class="frame is-${device}"><iframe src="${src}" title="${label}" loading="lazy"></iframe></div></div>`;
}

function render() {
  document.getElementById("tabs").innerHTML = Object.entries(VARIANTS).map(([key, v]) =>
    `<div class="group"><span>${v.label}</span>${Object.entries(v.options).map(([value, label]) =>
      `<button type="button" data-variant="${key}" data-value="${value}" aria-pressed="${chosen[key] === value}">${label}</button>`).join("")}</div>`).join("");
  document.getElementById("sheet").innerHTML = `
    <header class="intro"><h1>Idealan · Néon, electric blue · logo ${LOGO_NAMES[chosen.logo]}</h1><p>A grid floor running to the horizon, scanlines, chamfered covers, a glowing title, cards that tilt under the pointer; Chakra Petch and Manrope. Sample data; the covers come from the Steam CDN.</p></header>
    ${SECTIONS.map(([title, text, slots], i) => `<section id="section-${i + 1}"><h2>${title}</h2><p>${text}</p><div class="row">${slots.map(frame).join("")}</div></section>`).join("")}`;
}

document.getElementById("tabs").addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;
  chosen[button.dataset.variant] = button.dataset.value;
  history.replaceState(null, "", "?" + new URLSearchParams(chosen));
  render();
});
render();

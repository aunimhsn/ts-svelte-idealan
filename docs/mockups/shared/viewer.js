// The tabs (one group per open decision), the sections, and the frames of the application.
const THEMES = {
  night: { title: "A · Nuit", text: "sylent.art as it is: neutral blacks, white as the main accent, sharp corners, glass cards, Manrope and Anaheim, a large faded word behind the title. The blue only marks your vote, an active filter and the score you raised." },
  screen: { title: "B · Écran de LAN", text: "The covers light the page like screens in a dark room: each card carries a blurred halo of its own cover, soft corners, Manrope everywhere, a header of frosted glass. The blue stays rare." },
  scores: { title: "C · Tableau des scores", text: "The ranking first: a large rank on each cover (the top three in blue), the scores and the names in Barlow Condensed, solid gray blocks; the score jumps when you vote." },
  neon: { title: "D · Néon", text: "The temperature goes up: a grid floor running to the horizon, scanlines, chamfered covers, a glowing title, cards that tilt under the pointer. Here the blue stops being rare and becomes the light of the room (white buttons turn blue)." },
};
const BLUES = {
  cobalt: ["Cobalt", "#2a52e0"],
  electric: ["Électrique", "#2e6bff"],
  ultramarine: ["Outremer", "#4338ff"],
  azure: ["Azur", "#0a7cff"],
  sky: ["Ciel (Steam)", "#1a9fff"],
  glacier: ["Glacier", "#56c6ff"],
};
const LOGO_NAMES = { bulb: "Ampoule LAN", bag: "Sac", i: "i qui vote", port: "Prise RJ45", stripes: "Galons", network: "Réseau" };
const VARIANTS = {
  theme: { label: "Style", options: Object.fromEntries(Object.entries(THEMES).map(([k, v]) => [k, v.title])), fallback: "night" },
  blue: { label: "Blue", options: Object.fromEntries(Object.entries(BLUES).map(([k, v]) => [k, v[0]])), fallback: "electric" },
  logo: { label: "Logo", options: LOGO_NAMES, fallback: "bulb" },
};
const params = new URLSearchParams(location.search);
const chosen = Object.fromEntries(Object.entries(VARIANTS).map(([key, v]) => [key, params.get(key) in v.options ? params.get(key) : v.fallback]));

// The newest section first. Each slot: [label, device, address of app.html].
const SECTIONS = [
  ["Logo", "Six symbols to compare (tab Logo), each with one detail in the blue signal: here at every size, down to the 16 px of a browser tab, and in the header and the welcome of the other sections.", [
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
  const src = `app.html?${query}&theme=${chosen.theme}&blue=${chosen.blue}&logo=${chosen.logo}`;
  return `<div class="slot"><span>${label} · <a href="${src}" target="_blank">open alone</a></span>
    <div class="frame is-${device}"><iframe src="${src}" title="${label}" loading="lazy"></iframe></div></div>`;
}

function render() {
  document.getElementById("tabs").innerHTML = Object.entries(VARIANTS).map(([key, v]) =>
    `<div class="group"><span>${v.label}</span>${Object.entries(v.options).map(([value, label]) =>
      `<button type="button" data-variant="${key}" data-value="${value}" aria-pressed="${chosen[key] === value}">${key === "blue" ? `<i class="swatch" style="background:${BLUES[value][1]}"></i>` : ""}${label}</button>`).join("")}</div>`).join("");
  const t = THEMES[chosen.theme];
  document.getElementById("sheet").innerHTML = `
    <header class="intro"><h1>Style ${t.title} · blue ${BLUES[chosen.blue][0]} · logo ${LOGO_NAMES[chosen.logo]}</h1><p>${t.text} Sample data; the covers come from the Steam CDN.</p></header>
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

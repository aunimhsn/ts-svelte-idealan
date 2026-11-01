// The tabs (one group per open decision), the sections, and the frames of the application.
// Decided on 2026-11-01: style D · Néon, the electric blue, the logo « Bloc évidé » (an RJ45 jack
// cut out of a square), the name in Montserrat 800 at −0.02 em (docs/branding.md).
const LOGO_NAMES = { tile: "Bloc évidé" };
const VARIANTS = {
  line: { label: "Bordures", fallback: "now", options: { now: "Actuelles · 55 %", fields: "Champs à 80 %", all: "Tout à 80 %" } },
};
const params = new URLSearchParams(location.search);
const chosen = Object.fromEntries(Object.entries(VARIANTS).map(([key, v]) => [key, params.get(key) in v.options ? params.get(key) : v.fallback]));

// The newest section first. Each slot: [label, device, address of app.html].
const SECTIONS = [
  ["Design system · the borders", "Today the borders of the fields and buttons are the blue at 55 % (2.1:1 on the background); WCAG asks 3:1 for the border that shows where a field is. « Champs à 80 % » lights only the fields (3.2:1), « Tout à 80 % » also the buttons, chips and votes.", [
    ["Phone · welcome", "phone", "screen=welcome"],
    ["Phone · the bag", "phone", "screen=bag"],
    ["PC · settings", "pc", "screen=bag&as=admin&panel=settings"],
  ]],
  ["States of the bag", "Each message sits where it comes from: under the adding block, or in a banner under the header.", [
    ["Phone · empty bag", "phone", "screen=bag&state=empty"],
    ["Phone · a link being read", "phone", "screen=bag&state=reading"],
    ["Phone · a link refused", "phone", "screen=bag&state=refused"],
    ["Phone · Steam doesn’t answer", "phone", "screen=bag&state=steam-down"],
    ["Phone · the bag is full", "phone", "screen=bag&state=full"],
    ["Phone · the server doesn’t answer", "phone", "screen=bag&state=server-down"],
    ["Phone · a game without cover", "phone", "screen=bag&state=no-cover"],
    ["Phone · « Jouable à » open", "phone", "screen=bag&state=players-open"],
    ["Phone · filters with no game", "phone", "screen=bag&state=no-result"],
    ["PC · « Jouable à » open", "pc", "screen=bag&state=players-open"],
  ]],
  ["Errors of the welcome", "One at a time: the access code first, then the nickname, then the personal code.", [
    ["Phone · wrong access code", "phone", "screen=welcome&state=wrong-code"],
    ["Phone · nickname refused", "phone", "screen=welcome&state=nick-refused"],
    ["Phone · wrong personal code", "phone", "screen=welcome&state=wrong-pin"],
    ["Phone · a code changed by the owner", "phone", "screen=welcome&state=code-changed"],
  ]],
  ["Panels of the admin", "« Réglages » and « Vider le sac » in the header of the admin; the boxes of the emptying count what is kept. Everything works: open, check, confirm, « Échap » closes.", [
    ["Phone · the bag of the admin", "phone", "screen=bag&as=admin"],
    ["Phone · settings", "phone", "screen=bag&as=admin&panel=settings"],
    ["Phone · emptying the bag", "phone", "screen=bag&as=admin&panel=empty"],
    ["Phone · deleting a player", "phone", "screen=bag&as=admin&panel=delete"],
    ["Phone · emptying, confirmed", "phone", "screen=bag&as=admin&panel=confirm-empty"],
    ["PC · settings", "pc", "screen=bag&as=admin&panel=settings"],
    ["PC · emptying the bag", "pc", "screen=bag&as=admin&panel=empty"],
  ]],
  ["Logo", "The chosen logo, « Bloc évidé », at every size, down to the 16 px of a browser tab; the name in Montserrat 800, letters tightened by 0.02 em.", [
    ["Board", "board", "screen=logo"],
  ]],
  ["Who voted and the confirmation", "Tap a score (or hover it on a PC) to see who voted; « Retirer » opens the confirmation, as a sheet from the bottom on a phone and a window on a PC: its « Retirer » fills in blue for 2 seconds before it can be clicked.", [
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
  const src = `app.html?${query}&${new URLSearchParams(chosen)}`;
  return `<div class="slot"><span>${label} · <a href="${src}" target="_blank">open alone</a></span>
    <div class="frame is-${device}"><iframe src="${src}" title="${label}" loading="lazy"></iframe></div></div>`;
}

function render() {
  document.getElementById("tabs").innerHTML = Object.entries(VARIANTS).map(([key, v]) =>
    `<div class="group"><span>${v.label}</span>${Object.entries(v.options).map(([value, label]) =>
      `<button type="button" data-variant="${key}" data-value="${value}" aria-pressed="${chosen[key] === value}">${label}</button>`).join("")}</div>`).join("");
  document.getElementById("sheet").innerHTML = `
    <header class="intro"><h1>Idealan · Néon, electric blue · logo Bloc évidé · « Idealan » in Montserrat 800</h1><p>A grid floor running to the horizon, scanlines, chamfered covers, a glowing title, cards that tilt under the pointer; Chakra Petch and Manrope. Sample data; the covers come from the Steam CDN.</p></header>
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

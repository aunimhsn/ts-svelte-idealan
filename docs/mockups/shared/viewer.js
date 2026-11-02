// The tabs (one group per open decision), the sections, and the frames of the application.
// Decided on 2026-11-01: style D · Néon, the electric blue, the logo « Bloc évidé » (an RJ45 jack
// cut out of a square), the name in Montserrat 800 at −0.02 em (docs/branding.md).
const LOGO_NAMES = { tile: "Bloc évidé" };
const VARIANTS = {};
const params = new URLSearchParams(location.search);
const chosen = Object.fromEntries(Object.entries(VARIANTS).map(([key, v]) => [key, params.get(key) in v.options ? params.get(key) : v.fallback]));

// The newest section first. Each slot: [label, device, address of app.html].
const SECTIONS = [
  ["9a · Renaming oneself", "A friend opens « Réglages » from the menu of their nickname: 3 renames at most, those made by the admin don’t count. « Renommer » works: it spends one.", [
    ["Phone · 3 renames left", "phone", "screen=bag&panel=me"],
    ["Phone · a nickname taken", "phone", "screen=bag&panel=me&state=rename-me-taken"],
    ["Phone · 1 rename left", "phone", "screen=bag&panel=me&state=renames-one"],
    ["Phone · none left", "phone", "screen=bag&panel=me&state=renames-none"],
    ["PC · 3 renames left", "pc", "screen=bag&panel=me"],
  ]],
  ["9a · The renames and the emptying, for the admin", "« Redonner les 3 » next to « Renommer » once a friend used a rename (try it), « Supprimer » in red, a red padlock for a locked nickname, the journal of the renames under the list; « Vider le sac » in red down to its confirmation.", [
    ["Phone · settings of the admin", "phone", "screen=bag&as=admin&panel=settings"],
    ["PC · settings of the admin", "pc", "screen=bag&as=admin&panel=settings"],
    ["Phone · emptying, in red", "phone", "screen=bag&as=admin&panel=empty"],
    ["Phone · emptying, confirmed", "phone", "screen=bag&as=admin&panel=confirm-empty"],
  ]],
  ["9a · The menu of the nickname", "The nickname on the right, « admin » under it as « facultatif » under « Joueurs max »; a tap opens « Réglages », « Vider le sac » in red (the admin only) and « Se déconnecter ».", [
    ["Phone · a friend, menu open", "phone", "screen=bag&state=menu-open"],
    ["Phone · the admin, menu open", "phone", "screen=bag&as=admin&state=menu-open"],
    ["PC · the admin, menu open", "pc", "screen=bag&as=admin&state=menu-open"],
  ]],
  ["9a · The cards and the count", "No more categories on the cards (the filters keep them), « Ajouté par » in blue under the title, the cross of « Retirer » on a cover without its cut corner (on Nova’s games for a friend, on every game for the admin), a tap anywhere else on the card opens the Steam page in a new tab. « Coop » and « Action » are on: press the filters, the count follows. « Jouable à » goes from 1 to 25.", [
    ["Phone · a friend (Nova)", "phone", "screen=bag"],
    ["Phone · filters on", "phone", "screen=bag&state=filtered"],
    ["PC · the admin, filters on", "pc", "screen=bag&as=admin&state=filtered"],
  ]],
  ["Settings: a rename refused, a locked nickname", "Step 7a. Mira renamed « Lou », already taken: a red bubble under the line. Lou is locked after 5 wrong personal codes; Krak’s code was reset and Krak hasn’t chosen a new one yet.", [
    ["Phone · settings, a rename refused", "phone", "screen=bag&as=admin&panel=settings&state=rename-taken"],
    ["PC · settings, a rename refused", "pc", "screen=bag&as=admin&panel=settings&state=rename-taken"],
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
  ["Panels of the admin", "« Réglages » and « Vider le sac » in the menu of the admin’s nickname; the boxes of the emptying count what is kept. Everything works: open, check, confirm, « Échap » closes.", [
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
    <header class="intro"><h1>Idealan · Néon, electric blue · logo Bloc évidé · « Idealan » in Montserrat 800</h1><p>A grid floor running to the horizon, scanlines, a glowing title, cards that tilt under the pointer; Chakra Petch and Manrope. Sample data; the covers come from the Steam CDN.</p></header>
    <nav class="toc" aria-label="Sections">${SECTIONS.map(([title], i) => `<a href="#section-${i + 1}">${title}</a>`).join("")}</nav>
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

// The application, drawn from its address: ?screen=bag|welcome|logo, as=friend|admin,
// panel=voters|remove|settings|empty|delete|confirm-empty, state=…. The viewer (index.html) shows this page in a phone frame and a PC frame.
const params = new URLSearchParams(location.search);
const view = {
  screen: params.get("screen") || "bag",
  as: params.get("as") || "friend",
  panel: params.get("panel") || "",
};
const viewer = view.as === "admin" ? "Sylent" : "Nova";
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Icons as SVG lines in the color of the text.
const icon = (body, size = 20, width = 2) =>
  `<svg class="app-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const ICON = {
  up: size => icon('<path d="M6 15l6-6 6 6"/>', size, 2.4),
  down: size => icon('<path d="M6 9l6 6 6-6"/>', size, 2.4),
  refresh: size => icon('<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v4.5h-4.5"/>', size),
  chevron: size => icon('<path d="M7 10l5 5 5-5"/>', size),
  people: size => icon('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.3c2.2.2 3.7 1.8 4.1 4.2"/>', size, 1.8),
};
// The mark of Sylent (sylent.art), filled with the color of the text.
const MARK = `<svg class="app-mark" viewBox="0 0 908 2000.3" fill="currentColor" aria-hidden="true"><rect x="8.8" y="218.2" transform="matrix(0.6503 -0.7597 0.7597 0.6503 -171.45 428.7256)" width="742.3" height="364.9"/><rect x="156.9" y="1417.3" transform="matrix(0.6503 -0.7597 0.7597 0.6503 -1030.6389 960.5798)" width="742.3" height="364.9"/><rect x="82.9" y="818.4" transform="matrix(0.6503 -0.7597 0.7597 0.6503 -601.5629 694.9067)" width="742.3" height="364.9"/></svg>`;

// The logo « Bloc évidé », on a 32 px grid: an RJ45 jack cut out of a square in the color of the
// text, its four contacts in the blue signal (class app-logo-accent). The symbols set aside are
// listed in docs/branding.md; the Git history keeps their drawings.
const LOGOS = {
  tile: { name: "Bloc évidé", body: `<path class="is-filled" fill-rule="evenodd" d="M3 3h26v26H3zM8 9v11h4v4h8v-4h4V9z"/><path class="app-logo-accent" d="M11.5 9v4.5M14.5 9v4.5M17.5 9v4.5M20.5 9v4.5" stroke-width="1.8"/>` },
};
const logo = size =>
  `<svg class="app-logo" width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${LOGOS.tile.body}</svg>`;

const voteOf = game => (game.by === viewer ? "own" : game.up.includes(viewer) ? "up" : game.down.includes(viewer) ? "down" : null);
const score = game => game.up.length - game.down.length;
const signed = n => (n > 0 ? `+${n}` : String(n));
const escape = text => text.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);


// The states drawn from the address (?state=…): the errors of the welcome, the states of the bag.
const STATES = {
  "wrong-code": { values: { code: "••••••••" }, errors: { code: "Ce code d’accès n’est pas le bon&nbsp;: vérifie-le dans la conversation." } },
  "nick-refused": { values: { code: "••••••••", nick: "Nova 2" }, errors: { nick: "3 à 16 lettres ou chiffres, sans accents ni espace." } },
  "wrong-pin": { values: { code: "••••••••", nick: "Nova", pin: "••••" }, errors: { pin: "Ce n’est pas le code perso de Nova. Oublié&nbsp;? Demande à l’admin de le réinitialiser." } },
  "code-changed": { values: { nick: "Nova" }, banner: "Le code d’accès a changé&nbsp;: redemande-le dans la conversation." },
  empty: { games: [], count: 0 },
  reading: { add: { link: "https://store.steampowered.com/app/1966720/Lethal_Company/", players: "4", busy: true, note: "Lecture du jeu sur Steam…" } },
  refused: { add: { link: "https://store.steampowered.com/bundle/232/", players: "4", invalid: true }, toast: "Ce lien est un pack&nbsp;: colle le lien d’un des jeux." },
  "steam-down": { add: { link: "https://store.steampowered.com/app/1966720/", players: "4" }, toast: "Steam ne répond pas&nbsp;: réessaie dans une minute." },
  full: { count: 50, add: { link: "https://store.steampowered.com/app/1966720/" }, toast: "Le sac est plein&nbsp;: vois avec l’admin." },
  "server-down": { toast: "Le serveur ne répond pas&nbsp;: le sac affiché date de 21&nbsp;h&nbsp;04. « Rafraîchir » réessaie." },
  "no-cover": { noCover: true },
  "players-open": { playersOpen: true },
  "no-result": { games: [], count: 47, active: ["players", "Coop en LAN", "Écran partagé"], noResult: true },
};
const state = STATES[params.get("state")] || {};

function footer() {
  return `<footer class="app-footer">
    <span class="app-footer-mark" aria-hidden="true">${MARK}</span>
    <p>Données et images&nbsp;: Steam. Idealan n’est pas affilié à Valve.</p>
    <a class="app-signature" href="https://sylent.art" aria-label="Sylent, sur sylent.art"><span class="app-wordmark" aria-hidden="true"></span></a>
  </footer>`;
}

// The errors of the bag: a red, translucent strip under the header, over the page, closed with its cross.
function toast(text) {
  return text ? `<div class="app-toast" role="alert"><div class="app-toast-in"><p>${text}</p>
    <button type="button" class="app-toast-close" aria-label="Fermer le message">${icon('<path d="M6 6l12 12M18 6L6 18"/>', 18, 2.4)}</button></div></div>` : "";
}

function header() {
  const admin = view.as === "admin";
  return `<header class="app-header">
    <div class="app-header-in">
      <span class="app-brand">${logo(28)}<span>Idealan</span></span>
      <div class="app-header-actions">
        ${admin ? `<button type="button" class="app-button is-ghost" data-open="settings">Réglages</button><button type="button" class="app-button is-ghost" data-open="empty">Vider le sac</button>` : ""}
        <span class="app-nick">${viewer}${admin ? ` <span class="app-role">admin</span>` : ""}</span>
        <button type="button" class="app-button is-ghost is-small">Se déconnecter</button>
      </div>
    </div>
    ${toast(state.toast)}
  </header>`;
}

function banner(text) {
  return text ? `<p class="app-banner" role="status">${text}</p>` : "";
}

function addBlock(add = {}) {
  const message = add.error || add.note;
  return `<section class="app-add${add.busy ? " is-busy" : ""}" aria-label="Ajouter un jeu">
    <label class="app-field app-field-link${add.invalid ? " is-invalid" : ""}"><span>Lien Steam</span>
      <input type="url" placeholder="https://store.steampowered.com/app/…" value="${add.link || ""}" ${add.busy ? "disabled" : ""} ${add.invalid ? 'aria-invalid="true"' : ""}></label>
    <label class="app-field app-field-players"><span class="app-field-name">Joueurs max<small>facultatif</small></span>
      <input type="text" inputmode="numeric" placeholder="10" size="3" value="${add.players || ""}" ${add.busy ? "disabled" : ""}></label>
    <button type="button" class="app-button is-primary app-add-button" ${add.busy ? "disabled" : ""}>${add.busy ? `<span class="app-spinner" aria-hidden="true"></span>Lecture…` : "Ajouter"}</button>
    ${message ? `<p class="app-message${add.error ? " is-error" : ""}" role="${add.error ? "alert" : "status"}">${message}</p>` : ""}
  </section>`;
}

function playersPopover() {
  return `<div class="app-popover" role="dialog" aria-label="Jouable à">
    <p class="app-popover-title">Jouable à</p>
    <div class="app-stepper">
      <button type="button" class="app-button is-ghost" data-step="-1" aria-label="Un joueur de moins">−</button>
      <output class="app-stepper-value">9</output>
      <button type="button" class="app-button is-ghost" data-step="1" aria-label="Un joueur de plus">+</button>
    </div>
    <p class="app-popover-note">9 joueurs dans le sac. Les jeux sans nombre restent affichés.</p>
    <button type="button" class="app-button is-ghost is-small" data-clear-players>Retirer ce filtre</button>
  </div>`;
}

function bar() {
  const active = new Set(state.active || (state.playersOpen ? ["players"] : []));
  const count = state.count ?? BAG_COUNT;
  const text = state.noResult
    ? `<strong>0</strong> jeu sur ${count} <span>· filtres actifs</span>`
    : `<strong>${count}</strong> / 50 jeux <span>· triés par score</span>`;
  const chips = count === 0 ? "" : `<div class="app-chips" role="group" aria-label="Filtres">
      <button type="button" class="app-chip is-players" aria-pressed="${active.has("players")}" aria-expanded="${!!state.playersOpen}">${ICON.people(16)}Jouable à <span class="app-players-n">9</span>${ICON.chevron(14)}</button>
      ${FILTERS.map(f => `<button type="button" class="app-chip" aria-pressed="${active.has(f)}">${f}</button>`).join("")}
    </div>`;
  return `<div class="app-bar">
    <p class="app-count">${text}</p>
    <button type="button" class="app-button is-ghost is-small app-refresh">${ICON.refresh(16)}<span>Rafraîchir</span></button>
    ${chips}
    ${state.playersOpen ? playersPopover() : ""}
  </div>`;
}

function cover(game, missing) {
  return missing
    ? `<div class="app-cover is-missing"><span>${escape(game.name)}</span></div>`
    : `<div class="app-cover"><img src="${COVER(game.appid)}" alt="" loading="lazy" width="460" height="215" onerror="this.parentElement.classList.add('is-missing');this.parentElement.innerHTML='<span>${escape(game.name).replace(/'/g, "\\'")}</span>'"></div>`;
}

function card(game, index) {
  const vote = voteOf(game);
  const canRemove = vote === "own" || view.as === "admin";
  return `<li class="app-card" data-index="${index}">
    ${cover(game, state.noCover && index === 0)}
    <div class="app-card-body">
      <div class="app-card-info">
        <h3 class="app-card-title">${escape(game.name)}</h3>
        <p class="app-tags">${game.categories.join(" · ")}</p>
        ${game.players ? `<p class="app-players-line">${ICON.people(15)}Jusqu’à ${game.players} joueurs</p>` : ""}
        <p class="app-by">ajouté par ${vote === "own" ? "toi" : game.by}</p>
        ${canRemove ? `<button type="button" class="app-button is-ghost is-small app-remove">Retirer</button>` : ""}
      </div>
      <div class="app-votes" data-vote="${vote || ""}">
        <button type="button" class="app-vote is-up" aria-label="Pour" aria-pressed="${vote === "up" || vote === "own"}" ${vote === "own" ? "disabled" : ""}>${ICON.up(22)}</button>
        <button type="button" class="app-score" aria-label="Score ${signed(score(game))} : voir qui a voté" aria-expanded="false">${signed(score(game))}</button>
        <button type="button" class="app-vote is-down" aria-label="Contre" aria-pressed="${vote === "down"}" ${vote === "own" ? "disabled" : ""}>${ICON.down(22)}</button>
        <div class="app-voters" role="tooltip" hidden></div>
      </div>
    </div>
  </li>`;
}

// Who voted: two columns, « Pour » and « Contre », one nickname per line.
function voters(game) {
  const column = (title, names) => `<div class="app-voters-column"><p class="app-voters-title">${title} <span>${names.length}</span></p>
    <ul>${names.length ? names.map(n => `<li>${n}</li>`).join("") : `<li class="is-none">personne</li>`}</ul></div>`;
  return column("Pour", game.up) + column("Contre", game.down);
}

function emptyBox() {
  if (state.noResult) {
    return `<div class="app-empty"><p class="app-empty-title">Aucun jeu ne correspond à ces filtres.</p>
      <button type="button" class="app-button is-ghost" data-clear-filters>Retirer les filtres</button></div>`;
  }
  return `<div class="app-empty"><p class="app-empty-title">Le sac est vide.</p>
    <p>Colle le lien d’un jeu Steam ci-dessus pour lancer le premier.</p></div>`;
}

function bag() {
  const games = state.games || GAMES;
  return `<div class="app">
    <div class="app-floor" aria-hidden="true"></div>
    ${header()}
    <main class="app-main">
      ${banner(state.banner)}
      ${addBlock(state.add)}
      ${bar()}
      ${games.length ? `<ul class="app-games">${games.map(card).join("")}</ul>
      <p class="app-more">… et ${BAG_COUNT - GAMES.length} autres jeux dans le vrai sac</p>` : emptyBox()}
    </main>
    ${footer()}
  </div>`;
}

function welcomeField(key, label, type, placeholder, hint, extra = "") {
  const value = state.values?.[key];
  const error = state.errors?.[key];
  return `<label class="app-field${error ? " is-invalid" : ""}"><span>${label}</span>
    <input type="${type}" placeholder="${placeholder}" value="${value || ""}" ${extra} ${error ? 'aria-invalid="true"' : ""}>
    ${error ? `<small class="app-message is-error">${error}</small>` : hint ? `<small>${hint}</small>` : ""}</label>`;
}

function welcome() {
  return `<div class="app app-is-welcome">
    <div class="app-floor" aria-hidden="true"></div>
    <main class="app-welcome">
      ${banner(state.banner)}
      <div class="app-welcome-head">
        <div class="app-welcome-logo">${logo(72)}</div>
        <h1 class="app-display">Idealan</h1>
        <p class="app-lead">Le sac à jeux de la LAN</p>
      </div>
      <form class="app-form" onsubmit="return false">
        ${welcomeField("code", "Code d’accès", "password", "Reçu dans la conversation", "")}
        ${welcomeField("nick", "Pseudo du joueur", "text", "Nova", "3 à 16 lettres ou chiffres, sans accents")}
        ${welcomeField("pin", "Code perso", "password", "4 chiffres", "Nouveau venu&nbsp;: choisis-le. Déjà venu&nbsp;: redonne-le.", 'inputmode="numeric" maxlength="4"')}
        <button type="submit" class="app-button is-primary is-wide">Entrer</button>
      </form>
    </main>
    ${footer()}
  </div>`;
}

// Panels: a sheet from the bottom on a phone, a window in the middle on a PC.
function dialog(content, tall) {
  return `<div class="app-overlay" data-close>
    <div class="app-dialog${tall ? " is-tall" : ""}" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <span class="app-handle" aria-hidden="true"></span>
      ${content}
    </div>
  </div>`;
}

// arm: the action button fills in blue before it can be clicked (asked by the owner for removing a game,
// kept for deleting a player and emptying the bag).
function confirmDialog(title, name, text, action, arm) {
  return dialog(`<h2 id="dialog-title" class="app-dialog-title">${title}</h2>
    ${name ? `<p class="app-dialog-name">${escape(name)}</p>` : ""}
    <p class="app-dialog-text">${text}</p>
    <div class="app-dialog-actions">
      <button type="button" class="app-button is-ghost" data-close>Annuler</button>
      <button type="button" class="app-button is-primary${arm ? " is-arming" : ""}" data-close ${arm ? 'data-arm aria-disabled="true"' : ""}>${action}</button>
    </div>`);
}

function settingsDialog() {
  return dialog(`<div class="app-dialog-head"><h2 id="dialog-title" class="app-dialog-title">Réglages</h2>
      <button type="button" class="app-button is-ghost is-small" data-close>Fermer</button></div>
    <p class="app-dialog-note">${PLAYERS.length} joueurs. Un pseudo en double se supprime ici.</p>
    <ul class="app-players">${PLAYERS.map(([nick, votes, games]) => `<li class="app-player">
      <input class="app-player-name" value="${nick}" aria-label="Pseudo de ${nick}">
      <button type="button" class="app-button is-ghost is-small app-player-rename">Renommer</button>
      <span class="app-player-stats"><strong>${votes}</strong> votes · <strong>${games}</strong> jeux</span>
      <button type="button" class="app-button is-ghost is-small app-player-reset">Réinitialiser le code perso</button>
      ${nick === viewer ? `<span class="app-player-self">toi</span>` : `<button type="button" class="app-button is-ghost is-small app-player-delete" data-delete="${nick}" data-games="${games}" data-votes="${votes}">Supprimer</button>`}
    </li>`).join("")}</ul>`, true);
}

const KEPT = new Set([0, 1, 2, 4, 7]);
function emptyDialog() {
  const removed = BAG_COUNT - KEPT.size;
  return dialog(`<div class="app-dialog-head"><h2 id="dialog-title" class="app-dialog-title">Vider le sac</h2>
      <button type="button" class="app-button is-ghost is-small" data-close>Fermer</button></div>
    <p class="app-dialog-note">Coche les jeux à garder&nbsp;: leurs votes restent.</p>
    <ul class="app-keep-list">${GAMES.map((game, i) => `<li><label class="app-keep">
      <input type="checkbox" ${KEPT.has(i) ? "checked" : ""} data-keep="${i}">
      <img src="${COVER(game.appid)}" alt="" loading="lazy" width="460" height="215">
      <span class="app-keep-name">${escape(game.name)}</span>
      <span class="app-keep-score">${signed(score(game))}</span>
    </label></li>`).join("")}</ul>
    <p class="app-more">… et ${BAG_COUNT - GAMES.length} autres jeux</p>
    <div class="app-dialog-bar">
      <p><strong class="app-kept">${KEPT.size}</strong> gardés · <span class="app-removed">${removed}</span> retirés</p>
      <button type="button" class="app-button is-primary" data-open="confirm-empty"><span>Vider (<span class="app-removed">${removed}</span> jeux)</span></button>
    </div>`, true);
}

const PANELS = {
  remove: () => confirmDialog("Retirer ce jeu du sac&nbsp;?", GAMES[1].name, `Il a ${GAMES[1].up.length + GAMES[1].down.length} votes.`, "Retirer", true),
  settings: settingsDialog,
  empty: emptyDialog,
  delete: (nick = "Nova2", games = 3, votes = 12) => confirmDialog("Supprimer ce joueur&nbsp;?", nick, `Ses ${games} jeux et ses ${votes} votes partent avec lui.`, "Supprimer", true),
  "confirm-empty": () => confirmDialog("Vider le sac&nbsp;?", "", `${document.querySelector(".app-removed")?.textContent || BAG_COUNT - KEPT.size} jeux seront retirés. Cette action est définitive.`, "Vider", true),
};

function logoBoard() {
  const tile = (size, light) => `<span class="app-tile${light ? " is-light" : ""}" style="--tile:${size}px">${logo(Math.round(size * 0.8))}</span>`;
  return `<div class="app app-board">
    <div class="app-floor" aria-hidden="true"></div>
    <div class="app-board-lockup">${logo(120)}<span class="app-board-word">Idealan</span></div>
    <div class="app-board-row">
      <figure>${tile(180)}<figcaption>Icône d’appli · 180</figcaption></figure>
      <figure>${tile(48)}<figcaption>48</figcaption></figure>
      <figure>${tile(32)}<figcaption>32</figcaption></figure>
      <figure>${tile(16)}<figcaption>16</figcaption></figure>
      <figure>${tile(32, true)}<figcaption>32 sur blanc</figcaption></figure>
      <figure>${tile(16, true)}<figcaption>16 sur blanc</figcaption></figure>
      <figure><span class="app-browser-tab">${tile(16)}<span>Idealan</span><i>×</i></span><figcaption>Onglet du navigateur</figcaption></figure>
    </div>
    <div class="app-board-row">
      <span class="app-brand">${logo(28)}<span>Idealan</span></span>
      <span class="app-board-name">${LOGOS.tile.name}</span>
    </div>
  </div>`;
}

document.body.innerHTML = view.screen === "welcome" ? welcome() : view.screen === "logo" ? logoBoard() : bag();

// Interactions: votes, filters, who voted, the panels.
const root = document.querySelector(".app");

function setVote(votes, game, next) {
  game.up = game.up.filter(n => n !== viewer);
  game.down = game.down.filter(n => n !== viewer);
  if (next === "up") game.up.push(viewer);
  if (next === "down") game.down.push(viewer);
  votes.dataset.vote = next || "";
  votes.querySelector(".is-up").setAttribute("aria-pressed", next === "up");
  votes.querySelector(".is-down").setAttribute("aria-pressed", next === "down");
  const scoreButton = votes.querySelector(".app-score");
  scoreButton.textContent = signed(score(game));
  if (!reducedMotion) {
    scoreButton.classList.remove("is-bumped");
    void scoreButton.offsetWidth;
    scoreButton.classList.add("is-bumped");
  }
}

function closeVoters(except) {
  document.querySelectorAll(".app-voters:not([hidden])").forEach(box => {
    if (box === except) return;
    box.hidden = true;
    box.parentElement.querySelector(".app-score").setAttribute("aria-expanded", "false");
  });
}

const ARM_DELAY = 2000;
function openPanel(name, ...args) {
  root.insertAdjacentHTML("beforeend", PANELS[name](...args));
  const overlay = root.querySelector(".app-overlay:last-child");
  overlay.querySelector(".app-dialog button")?.focus({ preventScroll: true });
  const armed = overlay.querySelector("[data-arm]");
  if (armed) {
    setTimeout(() => {
      armed.classList.replace("is-arming", "is-armed");
      armed.removeAttribute("aria-disabled");
    }, ARM_DELAY);
  }
}

function togglePlayers(chip) {
  const open = root.querySelector(".app-popover");
  if (open) {
    open.remove();
    chip.setAttribute("aria-expanded", "false");
    return;
  }
  chip.parentElement.insertAdjacentHTML("afterend", playersPopover());
  root.querySelector(".app-stepper-value").textContent = chip.querySelector(".app-players-n").textContent;
  chip.setAttribute("aria-pressed", "true");
  chip.setAttribute("aria-expanded", "true");
}

function countKept() {
  const kept = root.querySelectorAll("[data-keep]:checked").length;
  root.querySelector(".app-kept").textContent = kept;
  root.querySelectorAll(".app-removed").forEach(el => (el.textContent = BAG_COUNT - kept));
}

root.addEventListener("change", event => {
  if (event.target.matches("[data-keep]")) countKept();
});

root.addEventListener("click", event => {
  const target = event.target;
  const cardElement = target.closest(".app-card");
  const game = cardElement && GAMES[Number(cardElement.dataset.index)];
  const vote = target.closest(".app-vote");
  if (vote && game) {
    const current = voteOf(game);
    const wanted = vote.classList.contains("is-up") ? "up" : "down";
    setVote(vote.parentElement, game, current === wanted ? null : wanted);
    return;
  }
  const scoreButton = target.closest(".app-score");
  if (scoreButton && game) {
    const box = scoreButton.parentElement.querySelector(".app-voters");
    closeVoters(box);
    box.innerHTML = voters(game);
    box.hidden = !box.hidden;
    scoreButton.setAttribute("aria-expanded", String(!box.hidden));
    return;
  }
  const chip = target.closest(".app-chip");
  if (chip) {
    if (chip.classList.contains("is-players")) togglePlayers(chip);
    else chip.setAttribute("aria-pressed", String(chip.getAttribute("aria-pressed") !== "true"));
    return;
  }
  const step = target.closest("[data-step]");
  if (step) {
    const output = root.querySelector(".app-stepper-value");
    const next = Math.min(16, Math.max(2, Number(output.textContent) + Number(step.dataset.step)));
    output.textContent = next;
    root.querySelector(".app-players-n").textContent = next;
    return;
  }
  if (target.closest("[data-clear-players]")) {
    root.querySelector(".app-popover")?.remove();
    const players = root.querySelector(".app-chip.is-players");
    players.setAttribute("aria-pressed", "false");
    players.setAttribute("aria-expanded", "false");
    return;
  }
  if (target.closest("[data-clear-filters]")) {
    root.querySelectorAll(".app-chip").forEach(c => c.setAttribute("aria-pressed", "false"));
    return;
  }
  if (target.closest(".app-remove") && game) {
    openPanel("remove");
    return;
  }
  const remove = target.closest("[data-delete]");
  if (remove) {
    openPanel("delete", remove.dataset.delete, remove.dataset.games, remove.dataset.votes);
    return;
  }
  const opener = target.closest("[data-open]");
  if (opener) {
    openPanel(opener.dataset.open);
    return;
  }
  if (target.closest(".app-toast-close")) {
    target.closest(".app-toast").remove();
    root.querySelector(".app-field.is-invalid")?.classList.remove("is-invalid");
    return;
  }
  if (target.closest('[aria-disabled="true"]')) return;
  const closer = target.closest("[data-close]");
  if (closer && (closer.matches("button") || target === closer)) {
    closer.closest(".app-overlay").remove();
    return;
  }
  closeVoters();
});
document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  closeVoters();
  const overlays = document.querySelectorAll(".app-overlay");
  overlays[overlays.length - 1]?.remove();
});

// On a computer, who voted also shows on hover.
if (matchMedia("(hover: hover)").matches) {
  root.addEventListener("pointerover", event => {
    const scoreButton = event.target.closest(".app-score");
    if (!scoreButton) return;
    const game = GAMES[Number(scoreButton.closest(".app-card").dataset.index)];
    const box = scoreButton.parentElement.querySelector(".app-voters");
    closeVoters(box);
    box.innerHTML = voters(game);
    box.hidden = false;
  });
  root.addEventListener("pointerout", event => {
    if (event.target.closest(".app-score") && !event.relatedTarget?.closest?.(".app-voters")) closeVoters();
  });
}

// The card under the pointer sinks a little, on the side of the pointer, as if pressed.
if (!reducedMotion && matchMedia("(hover: hover)").matches) {
  root.addEventListener("pointermove", event => {
    const cardElement = event.target.closest(".app-card");
    document.querySelectorAll(".app-card.is-tilted").forEach(c => {
      if (c !== cardElement) {
        c.classList.remove("is-tilted");
        c.style.removeProperty("--tilt-x");
        c.style.removeProperty("--tilt-y");
      }
    });
    if (!cardElement || event.target.closest(".app-voters")) return;
    const box = cardElement.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    cardElement.classList.add("is-tilted");
    cardElement.style.setProperty("--tilt-x", `${(-y * 5).toFixed(2)}deg`);
    cardElement.style.setProperty("--tilt-y", `${(x * 6).toFixed(2)}deg`);
  });
}

// A panel asked by the address, for the viewer.
if (view.panel === "voters") root.querySelector(".app-card .app-score")?.click();
else if (view.panel in PANELS) openPanel(view.panel);

// The application, drawn from its address: ?screen=bag|welcome|logo, as=friend|admin,
// panel=voters|remove, logo. The viewer (index.html) shows this page in a phone frame and a PC frame.
const params = new URLSearchParams(location.search);
const view = {
  screen: params.get("screen") || "bag",
  as: params.get("as") || "friend",
  panel: params.get("panel") || "",
  logo: params.get("logo") || "frame",
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

// The proposals of logo, on a 32 px grid: lines in the color of the text, one detail in the blue
// signal (class app-logo-accent).
const LOGOS = {
  frame: { name: "Cadre", body: `<path d="M4.5 4.5h23v23h-23z" stroke-width="2.4"/><path d="M9 10h14v9.5h-3.5V24h-7v-4.5H9z" stroke-width="2.4"/><path class="app-logo-accent" d="M12.5 10v4M15 10v4M17.5 10v4M20 10v4" stroke-width="1.8"/>` },
  solid: { name: "Prise pleine", body: `<path class="is-filled" d="M3 6h26v15h-6v6H9v-6H3z"/><path class="app-logo-accent" d="M9 6v6M14 6v6M18 6v6M23 6v6" stroke-width="2.6"/>` },
  tile: { name: "Bloc évidé", body: `<path class="is-filled" fill-rule="evenodd" d="M3 3h26v26H3zM8 9v11h4v4h8v-4h4V9z"/><path class="app-logo-accent" d="M11.5 9v4.5M14.5 9v4.5M17.5 9v4.5M20.5 9v4.5" stroke-width="1.8"/>` },
  plug: { name: "Fiche", body: `<path d="M8 4h16v13l-3.5 3.5h-9L8 17z" stroke-width="2.6"/><path class="app-logo-accent" d="M12 4v5M16 4v5M20 4v5" stroke-width="2.2"/><path d="M16 20.5V30" stroke-width="4"/>` },
};
const logo = (size, key = view.logo) =>
  `<svg class="app-logo" width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${(LOGOS[key] || LOGOS.frame).body}</svg>`;

const voteOf = game => (game.by === viewer ? "own" : game.up.includes(viewer) ? "up" : game.down.includes(viewer) ? "down" : null);
const score = game => game.up.length - game.down.length;
const signed = n => (n > 0 ? `+${n}` : String(n));
const escape = text => text.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function footer() {
  return `<footer class="app-footer">
    <p>Données et images&nbsp;: Steam. Idealan n’est pas affilié à Valve.</p>
    <a class="app-signature" href="https://sylent.art">${MARK}<span>Fait par Sylent</span></a>
  </footer>`;
}

function header() {
  const admin = view.as === "admin";
  return `<header class="app-header">
    <div class="app-header-in">
      <span class="app-brand">${logo(28)}<span>Idealan</span></span>
      <div class="app-header-actions">
        ${admin ? `<button type="button" class="app-button is-ghost">Réglages</button><button type="button" class="app-button is-ghost">Vider le sac</button>` : ""}
        <span class="app-nick">${viewer}${admin ? ` <span class="app-role">admin</span>` : ""}</span>
        <button type="button" class="app-button is-ghost is-small">Se déconnecter</button>
      </div>
    </div>
  </header>`;
}

function addBlock() {
  return `<section class="app-add" aria-label="Ajouter un jeu">
    <label class="app-field app-field-link"><span>Lien Steam</span>
      <input type="url" placeholder="https://store.steampowered.com/app/…"></label>
    <label class="app-field app-field-players"><span>Joueurs max</span>
      <input type="text" inputmode="numeric" placeholder="10" size="3"><small>facultatif</small></label>
    <button type="button" class="app-button is-primary app-add-button">Ajouter</button>
  </section>`;
}

function bar() {
  return `<div class="app-bar">
    <p class="app-count"><strong>${BAG_COUNT}</strong> / 50 jeux <span>· triés par score</span></p>
    <button type="button" class="app-button is-ghost is-small app-refresh">${ICON.refresh(16)}<span>Rafraîchir</span></button>
    <div class="app-chips" role="group" aria-label="Filtres">
      <button type="button" class="app-chip is-players" aria-pressed="false">${ICON.people(16)}Jouable à 9${ICON.chevron(14)}</button>
      ${FILTERS.map(f => `<button type="button" class="app-chip" aria-pressed="false">${f}</button>`).join("")}
    </div>
  </div>`;
}

function card(game, index) {
  const vote = voteOf(game);
  const canRemove = vote === "own" || view.as === "admin";
  return `<li class="app-card" style="--cover: url('${COVER(game.appid)}')" data-index="${index}">
    <div class="app-cover">
      <img src="${COVER(game.appid)}" alt="" loading="lazy" width="460" height="215">
    </div>
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

function voters(game) {
  const up = game.up.map(n => (n === game.by ? `${n} (a ajouté)` : n)).join(", ");
  const down = game.down.length ? game.down.join(", ") : "personne";
  return `<p><strong>Pour&nbsp;:</strong> ${up}</p><p><strong>Contre&nbsp;:</strong> ${down}</p>`;
}

function bag() {
  return `<div class="app">
    <div class="app-floor" aria-hidden="true"></div>
    ${header()}
    <main class="app-main">
      ${addBlock()}
      ${bar()}
      <ul class="app-games">${GAMES.map(card).join("")}</ul>
      <p class="app-more">… et ${BAG_COUNT - GAMES.length} autres jeux dans le vrai sac</p>
    </main>
    ${footer()}
  </div>`;
}

function welcome() {
  return `<div class="app app-is-welcome">
    <div class="app-floor" aria-hidden="true"></div>
    <main class="app-welcome">
      <div class="app-welcome-head">
        <div class="app-welcome-logo">${logo(72)}</div>
        <h1 class="app-display">Idealan</h1>
        <p class="app-lead">Le sac à jeux de la LAN</p>
      </div>
      <form class="app-form" onsubmit="return false">
        <label class="app-field"><span>Code d’accès</span><input type="password" placeholder="Reçu dans la conversation"></label>
        <label class="app-field"><span>Pseudo du joueur</span><input type="text" placeholder="Nova"><small>3 à 16 lettres sans accents et chiffres</small></label>
        <label class="app-field"><span>Code perso</span><input type="password" inputmode="numeric" placeholder="4 chiffres" maxlength="4"><small>Nouveau pseudo&nbsp;: choisis-le. Déjà venu&nbsp;: redonne-le.</small></label>
        <button type="submit" class="app-button is-primary is-wide">Entrer</button>
      </form>
    </main>
    ${footer()}
  </div>`;
}

function confirmRemove(game) {
  return `<div class="app-overlay" data-close>
    <div class="app-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <span class="app-handle" aria-hidden="true"></span>
      <h2 id="dialog-title" class="app-dialog-title">Retirer ce jeu du sac&nbsp;?</h2>
      <p class="app-dialog-name">${escape(game.name)}</p>
      <p class="app-dialog-text">Il a ${game.up.length + game.down.length} votes.</p>
      <div class="app-dialog-actions">
        <button type="button" class="app-button is-ghost" data-close>Annuler</button>
        <button type="button" class="app-button is-primary" data-close>Retirer</button>
      </div>
    </div>
  </div>`;
}

// The board of the logo: every size where it appears, down to the 16 px of a browser tab.
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
      <span class="app-board-name">${LOGOS[view.logo]?.name || ""}</span>
    </div>
  </div>`;
}

document.body.innerHTML = view.screen === "welcome" ? welcome() : view.screen === "logo" ? logoBoard() : bag();

// Interactions: votes, filters, who voted, the confirmation.
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

function openDialog(game) {
  root.insertAdjacentHTML("beforeend", confirmRemove(game));
}

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
    chip.setAttribute("aria-pressed", String(chip.getAttribute("aria-pressed") !== "true"));
    return;
  }
  if (target.closest(".app-remove") && game) {
    openDialog(game);
    return;
  }
  if (target.hasAttribute("data-close")) {
    target.closest(".app-overlay").remove();
    return;
  }
  closeVoters();
});
document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  closeVoters();
  document.querySelector(".app-overlay")?.remove();
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

// The cards tilt under the pointer.
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
    if (!cardElement) return;
    const box = cardElement.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    cardElement.classList.add("is-tilted");
    cardElement.style.setProperty("--tilt-x", `${(-y * 8).toFixed(2)}deg`);
    cardElement.style.setProperty("--tilt-y", `${(x * 10).toFixed(2)}deg`);
  });
}

// A panel asked by the address, for the viewer.
if (view.panel === "voters") {
  const first = document.querySelector(".app-card .app-score");
  first?.click();
}
if (view.panel === "remove") openDialog(GAMES[1]);

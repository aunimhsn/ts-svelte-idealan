// Sample data close to the real ones: real Steam games (their covers come from the Steam CDN,
// never copied into the repository), nine players, plausible votes.
const COVER = appid => `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;

const PLAYERS = [
  // nickname, votes, games, status: "locked" after 5 wrong personal codes, "reset" while the
  // friend hasn't chosen their new code yet.
  ["Krak", 31, 7, "reset"], ["Lou", 18, 4, "locked"], ["Mira", 22, 6], ["Nova", 27, 8], ["Nova2", 12, 3],
  ["Orka", 9, 2], ["Pixel", 25, 6], ["Sylent", 30, 7], ["Zed", 14, 4],
];

// vote: the vote of the friend who looks (Nova): "up", "down", "own" (their own game) or null.
const GAMES = [
  { appid: 892970, name: "Valheim", categories: ["Coop", "Action", "Aventure", "Indépendant"], by: "Krak", up: ["Krak", "Nova", "Mira", "Pixel", "Sylent", "Zed"], down: ["Lou"], vote: "up", players: 10 },
  { appid: 813780, name: "Age of Empires II: Definitive Edition", categories: ["Coop en LAN", "JcJ en LAN", "Stratégie"], by: "Nova", up: ["Nova", "Krak", "Sylent", "Orka", "Zed"], down: ["Pixel"], vote: "own", players: 8 },
  { appid: 550, name: "Left 4 Dead 2", categories: ["Coop", "Coop en LAN", "JcJ en LAN", "Action"], by: "Pixel", up: ["Pixel", "Krak", "Mira", "Sylent"], down: ["Nova"], vote: "down", players: null },
  { appid: 1426210, name: "It Takes Two", categories: ["Coop", "Écran partagé", "Action", "Aventure"], by: "Sylent", up: ["Sylent", "Mira", "Lou"], down: ["Krak"], vote: null, players: 2 },
  { appid: 1966720, name: "Lethal Company", categories: ["Coop", "Action", "Indépendant"], by: "Pixel", up: ["Pixel", "Nova", "Zed"], down: ["Orka"], vote: "up", players: 4 },
  { appid: 730, name: "Counter-Strike 2", categories: ["JcJ en LAN", "Action"], by: "Krak", up: ["Krak", "Zed"], down: ["Mira"], vote: null, players: 10 },
  { appid: 728880, name: "Overcooked! 2", categories: ["Coop", "Coop en LAN", "Écran partagé"], by: "Nova", up: ["Nova", "Lou"], down: ["Krak"], vote: "own", players: 4 },
  { appid: 413150, name: "Stardew Valley", categories: ["Coop", "Coop en LAN", "Simulation"], by: "Mira", up: ["Mira", "Lou"], down: ["Zed"], vote: null, players: 8 },
  { appid: 548430, name: "Deep Rock Galactic", categories: ["Coop", "Action", "Indépendant"], by: "Sylent", up: ["Sylent"], down: ["Orka"], vote: null, players: 4 },
  { appid: 632360, name: "Risk of Rain 2", categories: ["Coop", "Action", "Indépendant"], by: "Krak", up: ["Krak", "Nova"], down: ["Lou", "Mira"], vote: "up", players: 4 },
  { appid: 322330, name: "Don’t Starve Together", categories: ["Coop", "Aventure", "Indépendant"], by: "Mira", up: ["Mira"], down: ["Pixel"], vote: null, players: null },
  { appid: 105600, name: "Terraria", categories: ["Coop", "Action", "Aventure"], by: "Pixel", up: ["Pixel"], down: ["Nova", "Zed"], vote: "down", players: null },
  { appid: 620, name: "Portal 2", categories: ["Coop", "Écran partagé", "Action"], by: "Nova", up: ["Nova"], down: ["Krak", "Orka"], vote: "own", players: 2 },
  { appid: 1172620, name: "Sea of Thieves", categories: ["Coop", "JcJ", "Action", "Aventure"], by: "Krak", up: ["Krak"], down: ["Lou", "Mira", "Zed"], vote: null, players: null },
  { appid: 526870, name: "Satisfactory", categories: ["Coop", "Simulation", "Indépendant"], by: "Mira", up: ["Mira"], down: ["Krak", "Nova", "Sylent", "Pixel"], vote: null, players: 4 },
];

const FILTERS = ["Coop", "Coop en LAN", "JcJ en LAN", "Écran partagé", "Action", "Aventure", "Stratégie", "Simulation", "Indépendant"];
const BAG_COUNT = 47;

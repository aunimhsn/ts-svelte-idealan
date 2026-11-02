// Checks that no screen of the built application (dist/) is wider than the screen, on a phone and
// on a computer. A block that runs past the right edge (a long game name, a wide cover) lets
// Chrome on Android widen the page to show it, which the build can't see: only a browser that
// lays the page out does. Each screen is loaded in the Chromium of Playwright, then scrolled to
// the bottom. It also fails on an element marked `data-one-line` that takes more than one line
// (none since step 9b, kept for the next ones), on a script error, on a file that doesn't load and
// on what the Content Security Policy of netlify.toml blocks. On a phone, it then checks the taps
// on a card: a tap that closes a bubble or the menu doesn't open the Steam page, and the menu of
// the nickname stays over the strip of the errors.
// The functions don't run here: the bag answers the test data of check-overflow-bag.json, for a
// friend kept in the storage of the browser, or doesn't answer at all; the settings answer the
// same data; any other call to /api/ answers 404.
// Run after `npm run build`: `node scripts/check-overflow.mjs [dist]`. Install the browser once
// with `npx playwright install --only-shell chromium`.
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { chromium } from "playwright";

const [folder = "dist"] = process.argv.slice(2);
const dist = resolve(folder);

// The screens of the application: a single page, the welcome or the bag, by what the browser
// keeps of the friend (src/lib/session.ts, under the key `idealan`) and what the bag answers.
const bag = readFileSync(new URL("check-overflow-bag.json", import.meta.url));
const kept = JSON.stringify({
  accessCode: "code",
  nickname: "Abcdefghijklmnop",
  playerId: "j1",
  personalCode: "1234",
});
const screens = [
  { name: "the welcome", path: "/" },
  { name: "the bag", path: "/", kept, bag: "answers" },
  // The small window of « Jouable à N », opened under the filters.
  {
    name: "the bag with « Jouable à » open",
    path: "/",
    kept,
    bag: "answers",
    clicks: ["[aria-controls$='-players']"],
    opens: "[aria-labelledby$='-players-title']",
  },
  // The menu of the nickname, a list under it.
  {
    name: "the menu of the nickname",
    path: "/",
    kept,
    bag: "answers",
    clicks: ["header [aria-controls$='-menu']"],
    opens: "header [id$='-menu']",
  },
  // The settings of the admin, opened from the menu of the nickname.
  {
    name: "the settings",
    path: "/",
    kept,
    bag: "answers",
    clicks: ["header [aria-controls$='-menu']", "header .open-settings"],
    opens: "dialog[open]",
  },
  // Emptying the bag, opened from the menu of the nickname.
  {
    name: "emptying the bag",
    path: "/",
    kept,
    bag: "answers",
    clicks: ["header [aria-controls$='-menu']", "header .open-empty"],
    opens: "dialog[open]",
  },
  { name: "the bag without the server", path: "/", kept, bag: "down" },
];

// The narrowest screen still met, the narrowest common Android one and a wider one; then a small
// and a large computer screen, as the big screen of the LAN.
const phones = [320, 360, 412];
const desktops = [1024, 1920];

// The Content Security Policy of netlify.toml, served with every page, as Netlify does.
const policy = readFileSync("netlify.toml", "utf8").match(
  /Content-Security-Policy = "([^"]+)"/,
)?.[1];
if (!policy) {
  console.error("No Content-Security-Policy found in netlify.toml.");
  process.exit(1);
}

const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

if (!existsSync(join(dist, "index.html"))) {
  console.error(`No index.html in ${folder}/: build the application first.`);
  process.exit(1);
}

// The file of dist/ that a URL path asks for, or null when it is malformed or outside dist/.
const fileOf = (url) => {
  try {
    const path = resolve(dist, `.${decodeURIComponent(url.split("?")[0])}`);
    return path === dist || path.startsWith(dist + sep) ? path : null;
  } catch {
    return null;
  }
};

// A static server, as Netlify serves dist/: a folder serves its index.html.
const server = createServer((request, response) => {
  let path = fileOf(request.url ?? "/");
  if (path && existsSync(path) && statSync(path).isDirectory()) {
    path = join(path, "index.html");
  }
  if (!path || !existsSync(path)) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, {
    "content-type": types[extname(path)] ?? "application/octet-stream",
    "content-security-policy": policy,
  });
  createReadStream(path).pipe(response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

// Scrolls the page down to the bottom and returns the largest width it reached. It runs in the
// page, with the globals of the browser.
/* global document, getComputedStyle, innerHeight, scrollTo */
const widest = async () => {
  await document.fonts.ready;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const root = document.documentElement;
  let width = root.scrollWidth;
  for (let y = 0; y <= root.scrollHeight; y += innerHeight / 2) {
    scrollTo({ top: y, behavior: "instant" });
    await wait(50);
    width = Math.max(width, root.scrollWidth);
  }
  return width;
};

// The elements marked data-one-line that take more than one line. Runs in the page.
const wrapped = () =>
  [...document.querySelectorAll("[data-one-line]")].flatMap((element) => {
    const style = getComputedStyle(element);
    const line =
      parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
    const lines = Math.round(element.getBoundingClientRect().height / line);
    return lines > 1
      ? [`« ${element.textContent.trim()} » on ${lines} lines`]
      : [];
  });

const browser = await chromium.launch();
const errors = [];

// Loads one screen at one width, in a browser of its own, and records what is wrong.
const check = async (width, screen) => {
  const phone = phones.includes(width);
  const context = await browser.newContext({
    viewport: { width, height: 800 },
    deviceScaleFactor: phone ? 3 : 1,
    isMobile: phone,
    hasTouch: phone,
  });
  const where = `${screen.name} at ${width} px`;
  try {
    // Only the local server is reached: the Steam CDN or a slow third party would fail the check.
    await context.route(
      (url) => url.origin !== origin,
      (route) => route.abort(),
    );
    await context.route("**/api/get-{bag,settings}", (route) =>
      screen.bag === "answers"
        ? route.fulfill({ contentType: "application/json", body: bag })
        : route.abort(),
    );
    // What the browser keeps of the friend, written before the application starts.
    if (screen.kept) {
      await context.addInitScript((value) => {
        localStorage.setItem("idealan", value);
      }, screen.kept);
    }
    const page = await context.newPage();
    page.on("pageerror", (error) => {
      errors.push(`${where}: script error, ${error.message}`);
    });
    // A file, a style or an image blocked by the Content Security Policy fails the check.
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        message.text().includes("Content Security Policy")
      ) {
        errors.push(`${where}: ${message.text()}`);
      }
    });
    // A file of the build that doesn't load (a script, a style) leaves a blank or unstyled screen
    // that would fit any width: it fails the check. Only the calls to the functions may fail.
    page.on("response", (answer) => {
      const { pathname } = new URL(answer.url());
      if (answer.status() >= 400 && !pathname.startsWith("/api/")) {
        errors.push(`${where}: ${pathname} answers ${answer.status()}`);
      }
    });
    const answer = await page.goto(`${origin}${screen.path}`, {
      waitUntil: "networkidle",
    });
    if (!answer?.ok()) {
      errors.push(`${where}: answers ${answer?.status()}`);
      return;
    }
    // The application has mounted into #app: an empty page would fit any width.
    if (!(await page.locator("#app > *").count())) {
      errors.push(`${where}: the application didn't show`);
      return;
    }
    // The screen expected: the welcome has its form, the bag its header.
    const shown = screen.kept ? "header" : "form";
    if (!(await page.locator(shown).count())) {
      errors.push(`${where}: the screen expected didn't show`);
      return;
    }
    if (screen.clicks) {
      for (const click of screen.clicks) await page.locator(click).click();
      if (!(await page.locator(screen.opens).isVisible())) {
        errors.push(`${where}: the click didn't open what it should`);
        return;
      }
    }
    const reached = await page.evaluate(widest);
    if (reached > width) {
      errors.push(`${where}: ${reached} px wide`);
    }
    for (const element of await page.evaluate(wrapped)) {
      errors.push(`${where}: ${element}`);
    }
  } catch (error) {
    errors.push(`${where}: not checked, ${error.message}`);
  } finally {
    await context.close();
  }
};

// The taps on a card, on a phone: the card opens the Steam page in a new tab, but not when the tap
// closes the bubble of the votes or the menu of the nickname; the menu stays over the strip of the
// errors, so that « Se déconnecter » can be tapped when the server doesn't answer.
const checkTaps = async () => {
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    isMobile: true,
    hasTouch: true,
  });
  const where = "the taps at 360 px";
  try {
    await context.route(
      (url) => url.origin !== origin,
      (route) => route.abort(),
    );
    let answers = true;
    await context.route("**/api/get-{bag,settings}", (route) =>
      answers
        ? route.fulfill({ contentType: "application/json", body: bag })
        : route.abort(),
    );
    await context.addInitScript((value) => {
      localStorage.setItem("idealan", value);
    }, kept);
    const page = await context.newPage();
    await page.goto(origin, { waitUntil: "networkidle" });
    const tabs = () => context.pages().length;
    const name = page.locator(".games a").first();
    const menu = "header [aria-controls$='-menu']";

    await page.locator(".games .score").first().tap();
    await name.tap();
    await page.locator(menu).tap();
    await name.tap();
    if (tabs() > 1) {
      errors.push(`${where}: a tap that closes a layer opened the Steam page`);
    }
    await name.tap();
    await page.waitForTimeout(200);
    if (tabs() < 2) {
      errors.push(`${where}: a tap on a card didn't open the Steam page`);
    }

    // The strip of the errors, when « Rafraîchir » doesn't reach the server.
    answers = false;
    await page.locator(".refresh").tap();
    await page.locator("header [role='alert']").waitFor();
    await page.locator(menu).tap();
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll("header [id$='-menu'] button")]
        .filter((item) => {
          const box = item.getBoundingClientRect();
          const top = document.elementFromPoint(
            box.left + box.width / 2,
            box.top + box.height / 2,
          );
          return !item.contains(top);
        })
        .map((item) => item.textContent.trim()),
    );
    for (const item of hidden) {
      errors.push(`${where}: « ${item} » is under the strip of the errors`);
    }
  } catch (error) {
    errors.push(`${where}: not checked, ${error.message}`);
  } finally {
    await context.close();
  }
};

try {
  for (const width of [...phones, ...desktops]) {
    for (const screen of screens) await check(width, screen);
  }
  await checkTaps();
} finally {
  await browser.close();
  server.close();
}

if (errors.length > 0) {
  const report = errors.sort().join("\n- ");
  console.error(
    `Screens wider than the screen, elements on several lines, taps gone wrong, or screens not checked:\n- ${report}`,
  );
  process.exit(1);
}
console.log(
  `${screens.length} screens fit a screen of ${[...phones, ...desktops].join(", ")} px; the taps on a card are right.`,
);

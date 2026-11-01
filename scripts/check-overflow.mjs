// Checks that no screen of the built application (dist/) is wider than the screen, on a phone and
// on a computer. A block that runs past the right edge (a long game name, a wide cover) lets
// Chrome on Android widen the page to show it, which the build can't see: only a browser that
// lays the page out does. Each screen is loaded in the Chromium of Playwright, then scrolled to
// the bottom. It also fails on an element marked `data-one-line` that takes more than one line,
// on a script error, on a file that doesn't load and on what the Content Security Policy of
// netlify.toml blocks.
// The functions don't run here: a call to /api/ answers 404, so each screen is checked in its
// error state until the bag gets test data.
// Run after `npm run build`: `node scripts/check-overflow.mjs [dist]`. Install the browser once
// with `npx playwright install --only-shell chromium`.
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { chromium } from "playwright";

const [folder = "dist"] = process.argv.slice(2);
const dist = resolve(folder);

// The screens of the application, as their URL path: a single page for now.
const screens = ["/"];

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

try {
  for (const width of [...phones, ...desktops]) {
    const phone = phones.includes(width);
    const context = await browser.newContext({
      viewport: { width, height: 800 },
      deviceScaleFactor: phone ? 3 : 1,
      isMobile: phone,
      hasTouch: phone,
    });
    // Only the local server is reached: the Steam CDN or a slow third party would fail the check.
    await context.route(
      (url) => url.origin !== origin,
      (route) => route.abort(),
    );
    const page = await context.newPage();
    let current = "";
    page.on("pageerror", (error) => {
      errors.push(`${current}: script error at ${width} px, ${error.message}`);
    });
    // A file, a style or an image blocked by the Content Security Policy fails the check.
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        message.text().includes("Content Security Policy")
      ) {
        errors.push(`${current}: ${message.text()} at ${width} px`);
      }
    });
    // A file of the build that doesn't load (a script, a style) leaves a blank or unstyled screen
    // that would fit any width: it fails the check. Only the calls to the functions may fail.
    page.on("response", (answer) => {
      const { pathname } = new URL(answer.url());
      if (answer.status() >= 400 && !pathname.startsWith("/api/")) {
        errors.push(
          `${current}: ${pathname} answers ${answer.status()} at ${width} px`,
        );
      }
    });
    for (const path of screens) {
      current = path;
      try {
        const answer = await page.goto(`${origin}${path}`, {
          waitUntil: "networkidle",
        });
        if (!answer?.ok()) {
          errors.push(`${path}: answers ${answer?.status()} at ${width} px`);
          continue;
        }
        // The application has mounted into #app: an empty page would fit any width.
        if (!(await page.locator("#app > *").count())) {
          errors.push(`${path}: the application didn't show at ${width} px`);
          continue;
        }
        const reached = await page.evaluate(widest);
        if (reached > width) {
          errors.push(`${path}: ${reached} px wide on a ${width} px screen`);
        }
        for (const element of await page.evaluate(wrapped)) {
          errors.push(`${path}: ${element} at ${width} px`);
        }
      } catch (error) {
        errors.push(`${path}: not checked at ${width} px, ${error.message}`);
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

if (errors.length > 0) {
  const report = errors.sort().join("\n- ");
  console.error(
    `Screens wider than the screen, elements on several lines, or screens not checked:\n- ${report}`,
  );
  process.exit(1);
}
console.log(
  `${screens.length} screens fit a screen of ${[...phones, ...desktops].join(", ")} px.`,
);

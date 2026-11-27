import { createRequire } from "module";
import { writeFileSync } from "fs";

const require = createRequire("/tmp/node_modules/puppeteer-core/package.json");
const puppeteer = require("puppeteer-core");

const base = process.env.QC_BASE || "http://127.0.0.1:8765";
const outDir = new URL(".", import.meta.url).pathname;
const pages = [
  { name: "home", path: "/" },
  { name: "work", path: "/work/" },
  { name: "free-audit", path: "/free-audit/" },
  { name: "privacy", path: "/privacy/" }
];
const viewports = [
  { name: "1280", width: 1280, height: 800 },
  { name: "390", width: 390, height: 844 }
];
const failures = [];

function fail(message) {
  failures.push(message);
  console.error("FAIL", message);
}

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars", "--font-render-hinting=none"]
});

async function settle(page) {
  await page.evaluate(async () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await wait(reduce ? 200 : 1200);
    const height = document.documentElement.scrollHeight;
    const step = Math.max(window.innerHeight * 0.7, 400);
    for (let y = 0; y < height; y += step) {
      window.scrollTo(0, y);
      if (window.ScrollTrigger) window.ScrollTrigger.update();
      await wait(reduce ? 30 : 80);
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    if (window.ScrollTrigger) window.ScrollTrigger.update();
    await wait(reduce ? 80 : 1400);
    window.scrollTo(0, 0);
    if (window.ScrollTrigger) window.ScrollTrigger.update();
    await wait(100);
  });
}

async function dismissConsent(page) {
  const button = await page.$("#consent-decline");
  if (!button) return;
  const visible = await page.$eval("#consent", (el) => getComputedStyle(el).display !== "none");
  if (visible) await button.click();
}

async function measure(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - doc.clientWidth;
    const nodes = [...document.querySelectorAll("h1, h2, p, a, button, li, label, figcaption, dt, dd, legend")];
    const boxes = [];
    nodes.forEach((el) => {
      if (el.closest("[aria-hidden='true']")) return;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) return;
      const text = (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 60);
      if (!text) return;
      boxes.push({ text, rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }, el });
    });
    const hits = [];
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const x = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
        const y = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
        if (x > 6 && y > 6) hits.push({ a: a.text, b: b.text, x: Math.round(x), y: Math.round(y) });
      }
    }
    const headings = [...document.querySelectorAll("h1, h2")].map((el) => ({
      tag: el.tagName,
      text: (el.innerText || "").replace(/\s+/g, " ").trim(),
      opacity: getComputedStyle(el).opacity,
      display: getComputedStyle(el).display
    }));
    const bodyText = document.body.innerText || "";
    return {
      overflow,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      hits: hits.slice(0, 12),
      hitCount: hits.length,
      headings,
      hasPhoneDigits: /\(\d{3}\)|\d{3}-\d{3}-\d{4}/.test(bodyText),
      banned: ["25+ clients", "40+ hours", "99.9%", "99.9"].filter((item) => bodyText.includes(item))
    };
  });
}

async function shoot(page, file) {
  await page.screenshot({ path: outDir + file, fullPage: true });
  console.log("shot", file);
}

for (const viewport of viewports) {
  for (const item of pages) {
    const page = await browser.newPage();
    const logs = [];
    page.on("pageerror", (error) => logs.push(String(error)));
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      if (/404/.test(text) || /Failed to load resource/.test(text)) return;
      logs.push(text);
    });
    await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
    await page.goto(base + item.path, { waitUntil: "networkidle0", timeout: 30000 });
    await dismissConsent(page);
    await settle(page);
    const result = await measure(page);
    if (result.overflow > 1) fail(`${item.name} ${viewport.name} horizontal overflow ${result.overflow}px`);
    if (result.hitCount) fail(`${item.name} ${viewport.name} overlapping text (${result.hitCount}): ${JSON.stringify(result.hits[0])}`);
    if (result.headings.some((heading) => !heading.text || heading.display === "none" || Number(heading.opacity) === 0)) {
      fail(`${item.name} ${viewport.name} hidden heading ${JSON.stringify(result.headings)}`);
    }
    if (result.banned.length) fail(`${item.name} banned copy ${result.banned.join(",")}`);
    if (result.hasPhoneDigits) fail(`${item.name} looks like a phone number`);
    if (logs.length) fail(`${item.name} ${viewport.name} console ${logs.slice(0, 3).join(" | ")}`);
    await shoot(page, `${item.name}-${viewport.name}.png`);
    await page.close();
  }
}

for (const viewport of viewports) {
  for (const item of pages) {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
    await page.goto(base + item.path, { waitUntil: "networkidle0", timeout: 30000 });
    const result = await measure(page);
    if (result.overflow > 1) fail(`${item.name} ${viewport.name} nojs overflow ${result.overflow}`);
    if (result.hitCount) fail(`${item.name} ${viewport.name} nojs overlap ${JSON.stringify(result.hits[0])}`);
    if (result.headings.some((heading) => !heading.text)) fail(`${item.name} nojs empty heading`);
    const visible = await page.evaluate(() => {
      const main = document.querySelector("main");
      const style = getComputedStyle(main);
      return {
        text: (main.innerText || "").replace(/\s+/g, " ").trim().slice(0, 80),
        opacity: style.opacity,
        panels: document.querySelectorAll(".index-panel").length,
        openPanels: [...document.querySelectorAll(".index-panel")].filter((el) => getComputedStyle(el).display !== "none").length
      };
    });
    if (!visible.text || Number(visible.opacity) === 0) fail(`${item.name} nojs main hidden`);
    if (item.name === "work" && visible.panels && visible.openPanels !== visible.panels) {
      fail(`work nojs panels hidden ${visible.openPanels}/${visible.panels}`);
    }
    await shoot(page, `${item.name}-${viewport.name}-nojs.png`);
    await page.close();
  }
}

{
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(base + "/", { waitUntil: "networkidle0" });
  await dismissConsent(page);
  const motion = await page.evaluate(() => {
    const track = document.querySelector(".marquee-track");
    const line = document.querySelector(".line-in");
    const ink = document.querySelector(".inked");
    const trackStyle = track ? getComputedStyle(track) : null;
    const lineStyle = line ? getComputedStyle(line) : null;
    const inkStyle = ink ? getComputedStyle(ink) : null;
    return {
      animation: trackStyle ? trackStyle.animationName : "",
      lineTransform: lineStyle ? lineStyle.transform : "",
      inkOpacity: inkStyle ? inkStyle.opacity : "",
      lineText: line ? line.textContent : ""
    };
  });
  if (motion.animation && motion.animation !== "none") fail(`reduced motion marquee still animating ${motion.animation}`);
  if (!motion.lineText) fail("reduced motion hero line empty");
  if (motion.inkOpacity !== "" && Number(motion.inkOpacity) < 0.99) fail(`reduced motion ink not finished ${motion.inkOpacity}`);
  await shoot(page, "home-1280-reduced.png");
  await page.close();
}

{
  const page = await browser.newPage();
  const blocked = [];
  const leads = [];
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("comms.ngx.agency")) {
      if (request.method() === "POST") leads.push({ url, method: request.method(), body: request.postData() || "" });
      request.respond({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        },
        body: request.method() === "OPTIONS" ? "" : "{\"ok\":true}"
      });
      return;
    }
    if (url.startsWith(base) || url.startsWith("data:")) {
      request.continue();
      return;
    }
    blocked.push(url);
    request.abort();
  });
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(base + "/free-audit/?utm_source=qc&utm_medium=cpc&utm_campaign=audit&fbclid=fb123", { waitUntil: "networkidle0" });
  await dismissConsent(page);
  await page.click("#audit-submit");
  await page.waitForSelector("#form-alert.is-on");
  const errorText = await page.$eval("#form-alert", (el) => el.textContent || "");
  if (!/Error:/.test(errorText)) fail(`form error missing: ${errorText}`);
  if (leads.length) fail("empty submit hit the endpoint");
  const fieldError = await page.$eval("#err-name", (el) => getComputedStyle(el).display);
  if (fieldError === "none") fail("name error hidden after invalid submit");

  await page.type("#f-name", "Ada Lovelace");
  await page.type("#f-email", "ada@example.com");
  await page.type("#f-company", "Analytical Engines");
  await page.type("#f-website", "https://example.com");
  await page.click("input[name='staff_size'][value='6-20']");
  await page.type("#f-role", "Founder");
  await page.type("#f-hours", "12");
  await page.type("#f-message", "Scheduling slips.");
  await page.click("#audit-submit");
  await page.waitForSelector("#audit-confirm.is-on", { timeout: 8000 });
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const ref = await page.$eval("#audit-ref", (el) => (el.textContent || "").trim());
  if (!/^NGX-[A-Z0-9]{6}$/.test(ref)) fail(`reference not settled: ${ref}`);
  if (leads.length !== 1) fail(`expected 1 mocked lead, got ${leads.length}`);
  const payload = leads.length ? JSON.parse(leads[0].body) : {};
  const expected = ["name", "email", "phone", "company", "industry", "revenue", "message", "website", "staff_size", "role", "admin_hours_per_week", "source", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "li_fat_id", "landing_path"];
  const missing = expected.filter((key) => !(key in payload));
  if (missing.length) fail(`payload missing ${missing.join(",")}`);
  if (payload.source !== "ngx-site-v1") fail(`source ${payload.source}`);
  if (payload.email !== "ada@example.com") fail(`email ${payload.email}`);
  if (payload.phone !== "") fail("phone was not empty");
  if (payload.revenue !== "") fail("revenue was not empty");
  if (payload.staff_size !== "6-20") fail(`staff ${payload.staff_size}`);
  if (payload.admin_hours_per_week !== "12") fail(`hours ${payload.admin_hours_per_week}`);
  if (payload.utm_source !== "qc" || payload.fbclid !== "fb123") fail(`utm ${payload.utm_source} ${payload.fbclid}`);
  if (payload.website !== "https://example.com") fail(`website ${payload.website}`);
  const trackers = blocked.filter((url) => /facebook|tiktok|google-analytics|googletagmanager|clarity\.ms/.test(url));
  if (trackers.length) fail(`trackers loaded ${trackers.join(",")}`);
  writeFileSync(outDir + "form-payload.json", JSON.stringify(payload, null, 2));
  await shoot(page, "free-audit-1280-confirm.png");
  await page.setViewport({ width: 390, height: 844 });
  await shoot(page, "free-audit-390-confirm.png");
  await page.close();
}

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} failure(s)`);
  process.exit(1);
}
console.log("QC passed");

// W-8 refined probe — flags only REAL offenders: elements outside any scroll/clip container
import { chromium } from "playwright";

const slug = process.argv[2];
const width = parseInt(process.argv[3] || "390");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 844 } });
await page.goto(`http://localhost:3000/ar/app/${slug}`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);

const r = await page.evaluate(() => {
  const innerW = window.innerWidth;
  const real = [];
  const inScroller = (el) => {
    let p = el.parentElement;
    while (p && p !== document.body) {
      const cs = getComputedStyle(p);
      if (cs.overflowX !== "visible" || cs.overflow !== "visible") {
        // scroll or clip container: is the element within its scroll range?
        const pr = p.getBoundingClientRect();
        if (el.getBoundingClientRect().right <= pr.right + 2 && el.getBoundingClientRect().left >= pr.left - 2) return true;
        // beyond the scroller's visible box → still scrollable if scrollWidth > clientWidth
        if (p.scrollWidth > p.clientWidth + 2) return true;
        if (cs.overflowX === "hidden" || cs.overflow === "hidden") return true; // clipped decor
      }
      p = p.parentElement;
    }
    return false;
  };
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.position === "fixed" || cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") continue;
    if (el.closest("[data-state='closed']")) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) continue;
    const overR = rect.right - innerW;
    const overL = 0 - rect.left;
    if ((overR > 2 || overL > 2) && !inScroller(el)) {
      const cls = typeof el.className === "string" ? el.className.split(" ").slice(0, 2).join(".") : "";
      real.push({ tag: el.tagName.toLowerCase(), cls, text: (el.textContent || "").trim().slice(0, 20), left: Math.round(rect.left), right: Math.round(rect.right) });
    }
  }
  return { docW: document.documentElement.scrollWidth, innerW, count: real.length, items: real.slice(0, 8) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();

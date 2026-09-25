// W-8 geometric diagnosis — DOM truth for owner-flagged issues
// Usage: node scripts/visual-qa/w8-probe.mjs <slug>
const slug = process.argv[2] || "settings";
const VW = process.argv[3] || "390";
const base = "http://localhost:3000/ar/app/" + slug;

import { chromium } from "playwright";
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: parseInt(VW), height: 844 } });
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  const report = await page.evaluate(() => {
    const out = { viewport: { w: innerWidth, h: innerHeight }, docW: document.documentElement.scrollWidth, overflows: [], suspects: [] };
    // 1) any element extending past viewport edge
    const all = document.querySelectorAll("*");
    for (const el of all) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const style = getComputedStyle(el);
      if (style.position === "fixed") continue;
      const overR = Math.round(r.right - innerWidth);
      const overL = Math.round(0 - r.left);
      if (overR > 1 || overL > 1) {
        out.overflows.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className && typeof el.className === "string" ? el.className : "").split(" ").slice(0, 3).join("."),
          text: (el.textContent || "").trim().slice(0, 25),
          right: Math.round(r.right), left: Math.round(r.left), w: Math.round(r.width),
          overR, overL,
        });
      }
    }
    out.overflows = out.overflows.slice(0, 25);
    // 2) card size consistency: any element whose class contains card-like names
    const cardSel = ["[class*='card']", "[class*='tile']", "[class*='option']", "[class*='choice']", "[class*='chip']"];
    const seen = new Set();
    for (const sel of cardSel) {
      document.querySelectorAll(sel).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        const r = el.getBoundingClientRect();
        if (r.width < 40 || r.height < 20) return;
        out.suspects.push({
          sel,
          cls: (typeof el.className === "string" ? el.className : "").slice(0, 60),
          text: (el.textContent || "").trim().slice(0, 30).replace(/\s+/g, " "),
          w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top),
        });
      });
    }
    out.suspects = out.suspects.slice(0, 40);
    return out;
  });

  console.log(JSON.stringify(report, null, 1));
  await browser.close();
})();

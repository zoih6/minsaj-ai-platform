// W-8 responsive matrix — every page × every width: zero-overflow + settings strip audit
import { chromium } from "playwright";

const pages = ["home", "chat", "learn", "research", "create", "code", "analyze", "explore", "library", "settings", "team", "usage", "billing", "runs"];
const widths = [390, 768, 1024, 1440];

const browser = await chromium.launch();
const results = [];

for (const width of widths) {
  for (const slug of pages) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    try {
      await page.goto(`http://localhost:3000/ar/app/${slug}`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(1200);
      const r = await page.evaluate(() => {
        const docW = document.documentElement.scrollWidth;
        const innerW = window.innerWidth;
        // find REAL offenders (exclude the off-canvas drawer which is intentionally outside)
        const offenders = [];
        for (const el of document.querySelectorAll("body *")) {
          const cs = getComputedStyle(el);
          if (cs.position === "fixed" || cs.display === "none" || cs.visibility === "hidden") continue;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0) continue;
          // drawer + overlays are teleported/hidden intentionally
          if (el.closest("[data-state='closed']")) continue;
          const overR = rect.right - innerW;
          const overL = 0 - rect.left;
          if (overR > 2 || overL > 2) {
            const cls = typeof el.className === "string" ? el.className.split(" ").slice(0, 2).join(".") : el.tagName;
            offenders.push(`${el.tagName.toLowerCase()}.${cls}@R${Math.round(overR)}/L${Math.round(overL)}`);
          }
        }
        return { docW, innerW, offenders: offenders.slice(0, 3), offenderCount: offenders.length };
      });
      const overflow = r.docW > r.innerW + 1;
      results.push({ width, slug, docW: r.docW, overflow, offenderCount: r.offenderCount, offenders: r.offenders });
    } catch (e) {
      results.push({ width, slug, error: String(e).slice(0, 60) });
    }
    await page.close();
  }
}
await browser.close();

// print compact table
let bad = 0;
for (const r of results) {
  const w = String(r.width).padEnd(5);
  if (r.error) { console.log(`ERR  ${w} ${r.slug.padEnd(9)} ${r.error}`); bad++; continue; }
  if (r.overflow || r.offenderCount > 0) {
    console.log(`OVER ${w} ${r.slug.padEnd(9)} docW=${r.docW} offenders=${r.offenderCount} ${r.offenders.join(" | ")}`);
    bad++;
  }
}
console.log(bad === 0 ? "\nALL CLEAR — zero overflow across the matrix" : `\n${bad} cells with overflow`);

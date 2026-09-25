// W-8 accurate capture — scrolls through the page to trigger reveal, then shoots full page
// Usage: node scripts/visual-qa/w8-shot.mjs <slug> <width> <outPath>
import { chromium } from "playwright";

const slug = process.argv[2] || "home";
const width = parseInt(process.argv[3] || "390");
const out = process.argv[4] || `/home/z/my-project/repo/evidence/baselines/w8/after/${slug}-${width}.png`;
const height = width > 1000 ? 900 : 844;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height } });
await page.goto(`http://localhost:3000/ar/app/${slug}`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1800);

// Scroll through the whole page to trigger scroll-reveal
await page.evaluate(async () => {
  const step = Math.round(innerHeight * 0.8);
  for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 90));
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 250));
});
await page.waitForTimeout(700);

await page.screenshot({ path: out, fullPage: true });
console.log(`saved ${out}`);
await browser.close();

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import puppeteer from "puppeteer-core";

const repoRoot = process.cwd();
const chromeCandidates = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
];

async function findExecutablePath() {
  for (const candidate of chromeCandidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // continue
    }
  }
  return undefined;
}

function htmlFor({ size, textSize, padding }) {
  const bg = "#F9F8F4";
  const fg = "#D94528";

  // Use Google Fonts for Playfair Display 700.
  // Note: When generating assets, network access is assumed.
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=${size}, height=${size}, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
    <style>
      html, body {
        margin: 0;
        width: ${size}px;
        height: ${size}px;
        background: ${bg};
        overflow: hidden;
      }
      .wrap {
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: ${padding}px;
        box-sizing: border-box;
      }
      .wordmark {
        font-family: 'Playfair Display', serif;
        font-weight: 700;
        font-size: ${textSize}px;
        line-height: 1;
        color: ${fg};
        letter-spacing: -0.02em;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="wordmark">Poly.</div>
    </div>
  </body>
</html>`;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  const executablePath = await findExecutablePath();
  if (!executablePath) {
    console.error(
      "Could not find Chrome/Chromium executable. Install Chrome or update scripts/generate-pwa-icons.mjs."
    );
    process.exit(1);
  }

  const outDir = path.join(repoRoot, "public", "icons");
  await ensureDir(outDir);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120_000);
    page.setDefaultTimeout(120_000);

    async function render({ name, size, textSize, padding }) {
      await page.setViewport({ width: size, height: size, deviceScaleFactor: 2 });
      await page.setContent(htmlFor({ size, textSize, padding }), {
        waitUntil: "load",
      });

      // Wait for web fonts (Playfair Display) to be ready.
      try {
        await page.evaluate(async () => {
          // eslint-disable-next-line no-undef
          if (document.fonts?.ready) {
            // eslint-disable-next-line no-undef
            await document.fonts.ready;
          }
        });
      } catch {
        // Best-effort; continue even if fonts API is unavailable.
      }

      // Small settle time to reduce flakiness.
      await new Promise((r) => setTimeout(r, 300));

      const filePath = path.join(outDir, name);
      await page.screenshot({ path: filePath, type: "png" });
      console.log(`Wrote ${path.relative(repoRoot, filePath)}`);
    }

    // Standard PWA icons
    await render({ name: "icon-192.png", size: 192, textSize: 76, padding: 0 });
    await render({ name: "icon-512.png", size: 512, textSize: 204, padding: 0 });

    // Maskable: keep content inside safe area
    await render({ name: "maskable-512.png", size: 512, textSize: 176, padding: 64 });

    // iOS home screen icon
    await render({ name: "apple-touch-icon.png", size: 180, textSize: 72, padding: 0 });
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

const express = require("express");
const { chromium } = require("playwright");

const app = express();

app.use(express.json({ limit: "1mb" }));

const PORT = Number(process.env.PORT || 10000);
const WORKER_TOKEN = process.env.RPD_WORKER_TOKEN || "";

function authorized(req) {
  if (!WORKER_TOKEN) return true;
  return req.get("authorization") === `Bearer ${WORKER_TOKEN}`;
}

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "rpd-browser-worker",
    browser: "chromium",
  });
});

app.post("/render", async (req, res) => {
  if (!authorized(req)) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }

  const {
    url,
    timeout_ms = 60000,
    wait_until = "domcontentloaded",
  } = req.body || {};

  if (
    typeof url !== "string" ||
    !/^https?:\/\//i.test(url)
  ) {
    return res.status(400).json({
      success: false,
      error: "A valid HTTP(S) URL is required.",
    });
  }

  const timeout = Math.max(
    5000,
    Math.min(Number(timeout_ms) || 60000, 120000)
  );

  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-background-networking",
        "--disable-component-update",
        "--disable-default-apps",
        "--disable-extensions",
        "--disable-sync",
        "--no-first-run",
        "--no-default-browser-check",
      ],
    });

    const context = await browser.newContext({
      viewport: {
        width: 1280,
        height: 1000,
      },
      locale: "en-IN",
      userAgent:
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/138 Safari/537.36",
    });

    const page = await context.newPage();

    const response = await page.goto(url, {
      waitUntil:
        wait_until === "load"
          ? "load"
          : "domcontentloaded",
      timeout,
    });

    // Allow JS-rendered commerce pages to settle.
    await page.waitForTimeout(3000);

    const html = await page.content();
    const title = await page.title();

    return res.json({
      success: true,
      status_code: response ? response.status() : null,
      url: page.url(),
      title,
      html,
      html_length: html.length,
    });

  } catch (error) {
    return res.status(502).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });

  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `RPD browser worker listening on ${PORT}`
  );
});

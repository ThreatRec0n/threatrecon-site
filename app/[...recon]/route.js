const notFoundMessage = "404: IOC not found. Neither were the secrets.";

const easterEggRoutes = {
  "/.env": {
    status: 403,
    message: "403: Looking for the .env? That’s rookie behavior.",
  },
  "/.git": {
    status: 403,
    message: "403: Looking for the Git folder? Don’t let Andre find out you tried that.",
  },
  "/admin": {
    status: 404,
    message: "404: Admin panel? This ain’t that kind of party.",
  },
  "/debug": {
    status: 403,
    message: "403: Debug mode is off. You came looking for crumbs and found a locked fridge.",
  },
  "/backup": {
    status: 404,
    message: "404: No backup here. Real ones don’t leave loot boxes in public.",
  },
  "/config.json": {
    status: 403,
    message: "403: Config secrets? You must be new here.",
  },
  "/server-status": {
    status: 403,
    message: "403: You brought Nmap to a static site fight.",
  },
  "/phpinfo.php": {
    status: 404,
    message: "404: PHP? Wrong block, wrong stack, wrong mission.",
  },
  "/wp-admin": {
    status: 404,
    message: "404: WordPress? You are absolutely lost, my boy.",
  },
  "/robots-easter-egg": {
    status: 200,
    message: "Recon detected. I’m about to tell the cops.",
  },
  "/database.sql": {
    status: 404,
    message: "404: Database dump? On a static site? Be serious.",
  },
  "/backup.zip": {
    status: 404,
    message: "404: Backup zip not found. This ain’t a CTF box.",
  },
  "/shell.php": {
    status: 404,
    message: "404: Web shell? Wrong movie.",
  },
  "/.aws": {
    status: 403,
    message: "403: Cloud keys? Nah. Try harder, but respectfully.",
  },
  "/.ssh": {
    status: 403,
    message: "403: SSH keys are not party favors.",
  },
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function page(message, status) {
  const safeMessage = escapeHtml(message);
  const title = status === 200 ? "Recon Easter Egg" : `${status} | ThreatRecon.io`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: radial-gradient(circle at top, rgba(0, 212, 255, 0.18), transparent 34%), #0a0c0f;
      color: #d8f7ff;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main {
      width: min(720px, calc(100vw - 40px));
      border: 1px solid rgba(0, 212, 255, 0.28);
      border-radius: 18px;
      padding: 34px;
      background: rgba(7, 12, 18, 0.84);
      box-shadow: 0 20px 80px rgba(0, 0, 0, 0.35);
      text-align: center;
    }
    .badge {
      display: inline-block;
      margin-bottom: 18px;
      padding: 6px 10px;
      border: 1px solid rgba(0, 212, 255, 0.35);
      border-radius: 999px;
      color: #00d4ff;
      font-size: 0.78rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    h1 {
      margin: 0;
      color: #ffffff;
      font-size: clamp(1.8rem, 4vw, 3rem);
      line-height: 1.1;
    }
    p {
      margin: 18px auto 0;
      max-width: 52ch;
      color: #9fb9c4;
      line-height: 1.6;
    }
    a {
      color: #00d4ff;
      text-decoration: none;
    }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <main>
    <div class="badge">ThreatRecon.io</div>
    <h1>${safeMessage}</h1>
    <p>Static site. Browser-only analysis. No loot boxes, no secrets, no server-side malware handling.</p>
    <p><a href="/">Return to the analyzer</a></p>
  </main>
</body>
</html>`;
}

export async function GET(_request, { params }) {
  const { recon = [] } = await params;
  const path = `/${recon.join("/")}`;
  const route = easterEggRoutes[path] || { status: 404, message: notFoundMessage };

  return new Response(page(route.message, route.status), {
    status: route.status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}

/**
 * NDX:Try Demo Auth — bypasses Google/Microsoft OAuth for sandbox demos.
 * Adds GET/POST /auth/demo routes that authenticate a pre-seeded user.
 */
import type { Express } from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";

export function setupDemoAuth(app: Express) {
  // Strip /api prefix (ALB path-based routing sends /api/* to this service)
  app.use((req, _res, next) => {
    if (req.url.startsWith("/api")) {
      req.url = req.url.slice(4) || "/";
    }
    next();
  });

  // Body parser for demo auth form (registered early, before main bodyParser)
  app.use("/auth/demo", bodyParser.urlencoded({ extended: true }));

  // Demo login page
  app.get("/auth/demo", (_req, res) => {
    const error = _req.query.error
      ? `<p style="color:red">${_req.query.error}</p>`
      : "";
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>PlanX Demo Login - NDX:Try</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 400px; margin: 100px auto; padding: 20px; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    p { color: #666; margin-bottom: 24px; }
    label { display: block; font-weight: 600; margin-bottom: 4px; }
    input { width: 100%; padding: 8px; margin-bottom: 16px; border: 2px solid #0B0C0C; font-size: 16px; box-sizing: border-box; }
    button { background: #1D70B8; color: white; border: none; padding: 12px 24px; font-size: 16px; cursor: pointer; width: 100%; }
    button:hover { background: #003078; }
    .tag { display: inline-block; padding: 4px 8px; background: #1D70B8; color: white; font-size: 14px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  </style>
</head>
<body>
  <span class="tag">NDX:Try Demo</span>
  <h1>PlanX Editor Login</h1>
  <p>Sign in with the demo account to explore PlanX.</p>
  ${error}
  <form method="POST" action="/api/auth/demo">
    <label for="email">Email</label>
    <input type="email" id="email" name="email" value="demo@ndx-demo.example.com" required>
    <label for="password">Password</label>
    <input type="password" id="password" name="password" required>
    <button type="submit">Sign in</button>
  </form>
</body>
</html>`);
  });

  // Demo login handler
  app.post("/auth/demo", (req, res) => {
    const { email, password } = req.body || {};
    const demoPassword = process.env.DEMO_PASSWORD;

    if (email !== "demo@ndx-demo.example.com" || password !== demoPassword) {
      return res.redirect("/api/auth/demo?error=Invalid+credentials");
    }

    const token = jwt.sign(
      {
        sub: "1001",
        email: "demo@ndx-demo.example.com",
        "https://hasura.io/jwt/claims": {
          "x-hasura-allowed-roles": [
            "platformAdmin",
            "teamEditor",
            "public",
          ],
          "x-hasura-default-role": "platformAdmin",
          "x-hasura-user-id": "1001",
        },
      },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" },
    );

    // Redirect to editor with JWT in search params (relative URL to stay on CloudFront)
    res.redirect(`/?jwt=${token}`);
  });
}

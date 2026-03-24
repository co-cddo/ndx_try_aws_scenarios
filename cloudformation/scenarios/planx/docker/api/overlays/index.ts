/**
 * NDX:Try patched entry point — loads demo auth before starting the server.
 * Replaces the upstream index.ts.
 */
import server from "./server.js";
import { setupDemoAuth } from "./demo-auth.js";

// Get the Express app from the server
// The server is an http.Server wrapping an Express app
const app = (server as any)._events?.request || (server as any).listeners?.("request")?.[0];

// Setup demo auth routes on the Express app
if (process.env.DEMO_MODE === "true" && app) {
  setupDemoAuth(app);
  console.info("Demo auth enabled at /auth/demo");
}

const PORT = process.env.PORT || 8001;
server.listen(PORT);
console.info(`api listening http://localhost:${PORT}`);

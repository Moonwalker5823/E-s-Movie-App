import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Minimal ambient for the build-time env read below (no @types/node in this project).
declare const process: { env: Record<string, string | undefined> };

// A short build id so the app can show which version is running — that's how you can
// tell a reload actually pulled a new deploy. Vercel sets the commit SHA at build
// time; locally we fall back to the build timestamp.
const BUILD_ID =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
  new Date().toISOString().slice(0, 16).replace("T", " ");

export default defineConfig({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(BUILD_ID) },
  server: { host: true, port: 5173 },
});

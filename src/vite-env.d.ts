/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TMDB_TOKEN?: string;
  readonly VITE_TMDB_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Injected at build time by Vite (see vite.config.ts) — the running build's id.
declare const __APP_VERSION__: string;

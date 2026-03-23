/**
 * Browser env bootstrap (static fallback).
 * When using the dev server (`npm run dev` or `npm run dev:python`), `/config.js` is built from `.env.local`.
 * On static hosts (e.g. Vercel) there is no Python — this file is served so `window.ENV_CONFIG` always exists.
 * Override keys via your host’s env injection only if you add a build step that rewrites this file.
 */
window.ENV_CONFIG = window.ENV_CONFIG || {};

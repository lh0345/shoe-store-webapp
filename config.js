/**
 * Browser env bootstrap (static fallback).
 * When using `python3 scripts/server.py`, the server replaces this path with a dynamic script built from `.env.local`.
 * On static hosts (e.g. Vercel) there is no Python — this file is served so `window.ENV_CONFIG` always exists.
 * Override keys via your host’s env injection only if you add a build step that rewrites this file.
 */
window.ENV_CONFIG = window.ENV_CONFIG || {};

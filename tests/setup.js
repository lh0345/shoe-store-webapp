// Jest setup: Web Crypto + TextEncoder for password hashing (AuthService default admin init)
import { webcrypto } from 'node:crypto';
import { TextEncoder, TextDecoder } from 'util';

// jsdom provides a partial `crypto`; replace so `crypto.subtle.digest` works in tests (password.js).
globalThis.crypto = webcrypto;
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

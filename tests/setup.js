// Jest setup: Web Crypto + TextEncoder for password hashing (AuthService default admin init)
import { webcrypto } from 'node:crypto';
import { TextEncoder, TextDecoder } from 'util';

if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto?.subtle) {
  globalThis.crypto = webcrypto;
}
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

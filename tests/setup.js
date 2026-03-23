// Jest setup: Web Crypto + TextEncoder for password hashing (AuthService default admin init)
import { webcrypto } from 'node:crypto';
import { TextEncoder, TextDecoder } from 'util';

/** In-memory Storage when jsdom does not attach `localStorage` yet (or in odd worker order). */
function createMemoryStorage() {
  const data = Object.create(null);
  const api = {
    clear() {
      for (const k of Object.keys(data)) delete data[k];
    },
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
    removeItem(key) {
      delete data[key];
    },
    get length() {
      return Object.keys(data).length;
    },
    key(index) {
      const keys = Object.keys(data);
      return keys[index] ?? null;
    },
  };
  return new Proxy(api, {
    ownKeys: () => Reflect.ownKeys(data),
    getOwnPropertyDescriptor(target, prop) {
      if (Object.prototype.hasOwnProperty.call(data, prop)) {
        return { enumerable: true, configurable: true, value: data[prop] };
      }
      return Object.getOwnPropertyDescriptor(target, prop);
    },
    get(target, prop, receiver) {
      if (Object.prototype.hasOwnProperty.call(data, prop)) return data[prop];
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      if (typeof prop === 'symbol' || prop === 'length') {
        return Reflect.set(target, prop, value, receiver);
      }
      if (prop in target && typeof target[prop] === 'function') {
        return Reflect.set(target, prop, value, receiver);
      }
      data[prop] = String(value);
      return true;
    },
    deleteProperty(target, prop) {
      if (Object.prototype.hasOwnProperty.call(data, prop)) {
        delete data[prop];
        return true;
      }
      return Reflect.deleteProperty(target, prop);
    },
  });
}

if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = createMemoryStorage();
}
if (typeof globalThis.sessionStorage === 'undefined') {
  globalThis.sessionStorage = createMemoryStorage();
}
if (typeof window !== 'undefined') {
  if (typeof window.localStorage === 'undefined') window.localStorage = globalThis.localStorage;
  if (typeof window.sessionStorage === 'undefined')
    window.sessionStorage = globalThis.sessionStorage;
}

// jsdom's `window.crypto` may lack `subtle`; force Node's Web Crypto for password hashing.
const c = webcrypto;
Object.defineProperty(globalThis, 'crypto', { value: c, configurable: true, writable: true });
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'crypto', { value: c, configurable: true, writable: true });
}
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

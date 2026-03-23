import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  prettier,
  {
    files: ['tests/**/*'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
        global: 'readonly',
      },
    },
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        FormData: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        location: 'readonly',
        history: 'readonly',
        PopStateEvent: 'readonly',
        CustomEvent: 'readonly',
        URLSearchParams: 'readonly',
        crypto: 'readonly',
        TextEncoder: 'readonly',
        btoa: 'readonly',
        MutationObserver: 'readonly',
        Node: 'readonly',
        Event: 'readonly',
        getComputedStyle: 'readonly',
        FileReader: 'readonly',
        qrcode: 'readonly',
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
    },
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  },
];

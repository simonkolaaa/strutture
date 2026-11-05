import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

// Separate from vite.config.ts on purpose: the tests only cover pure logic in
// src/core, so they don't need the PWA/Tailwind/React plugin chain.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})

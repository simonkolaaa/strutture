import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// Separato da vite.config.ts: i test coprono solo la logica pura in src/core,
// non serve la catena di plugin React.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})

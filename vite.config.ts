/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // Eastern time, where the properties are: a date that slips to the day before
    // in the US (the classic new Date('2025-11-03') bug) fails the tests here.
    env: { TZ: 'America/New_York' },
    setupFiles: ['./src/test/setup.ts'],
  },
})

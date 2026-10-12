import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 10000,
    hookTimeout: 10000,
    // Run test files sequentially to avoid SQLite write conflicts
    sequence: {
      concurrent: false,
    },
    fileParallelism: false,
    // Only include tests inside the new tests/ folder
    include: ['tests/**/*.test.js'],
  },
})


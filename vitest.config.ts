import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '*.config.*',
        '.next/',
        'public/',
        'scripts/',
        'types/',
        '**/*.d.ts',
        '**/index.ts',
      ],
      thresholds: {
        hooks: {
          lines: 85,
          functions: 85,
          branches: 80,
          statements: 85,
        },
        components: {
          lines: 70,
          functions: 70,
          branches: 65,
          statements: 70,
        },
        pages: {
          lines: 65,
          functions: 60,
          branches: 55,
          statements: 65,
        },
        api: {
          lines: 70,
          functions: 70,
          branches: 65,
          statements: 70,
        },
      },
    },
    include: ['__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});

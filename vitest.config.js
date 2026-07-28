import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/tests/setup/test.setup.ts'],
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            thresholds: {
                lines: 90,
                functions: 90,
                branches: 85,
                statements: 90,
            },
            exclude: [
                'src/tests/**',
                'src/**/*.types.ts',
                'src/**/*.d.ts',
                'e2e/**',
                '*.config.*',
            ],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // spec/ holds the specification and the static UI prototype, never
  // application source — linting the prototype's vanilla JS as app code only
  // produces no-undef noise for browser globals.
  { ignores: ['dist', 'coverage', 'e2e', 'node_modules', 'spec'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      // Zustand method selectors (s => s.action) are a well-established pattern;
      // these methods don't use `this` and are safe to destructure.
      '@typescript-eslint/unbound-method': 'off',
      // RHF's handleSubmit is commonly called inline in callbacks
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    },
  },
  {
    // Test files: relax rules that conflict with common Vitest patterns
    files: ['**/*.test.{ts,tsx}', '**/tests/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  }
)

import pluginQuasar from '@quasar/app-vite/eslint';
import prettierConfig from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import pluginImportX from 'eslint-plugin-import-x';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  pluginQuasar.configs.recommended(),

  {
    ignores: [
      '**/node_modules/**',
      'coverage/**',
      'userData/**',
      '**/work/**',
      '__mocks__/**',
      'src/assets/assets.ts',
      '*.config.js',
      '*.config.ts',
    ],
  },

  // https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin#usage
  // ESLint typescript rules
  tseslint.configs.recommended,

  // See https://eslint.vuejs.org/rules/#available-rules
  pluginVue.configs['flat/essential'], // Priority A: Essential (Error Prevention)

  // https://github.com/prettier/eslint-config-prettier#installation
  // usage with Prettier, provided by 'eslint-config-prettier'.
  prettierConfig,

  {
    files: ['**/*.ts', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        // https://eslint.vuejs.org/user-guide/#how-to-use-a-custom-parser
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Require switch-case statements to be exhaustive (requires type information)
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true },
      ],
    },
  },

  {
    plugins: {
      'import-x': pluginImportX,
    },

    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver()],
    },

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',

      globals: {
        ...globals.browser,
        ...globals.node,
        ga: 'readonly', // Google Analytics
        cordova: 'readonly',
        __statics: 'readonly',
        __QUASAR_SSR__: 'readonly',
        __QUASAR_SSR_SERVER__: 'readonly',
        __QUASAR_SSR_CLIENT__: 'readonly',
        __QUASAR_SSR_PWA__: 'readonly',
        process: 'readonly',
        Capacitor: 'readonly',
        chrome: 'readonly',
      },
    },

    // add your custom rules here
    rules: {
      'prefer-promise-reject-errors': 'off',
      'prefer-template': 'error',

      quotes: ['warn', 'single', { avoidEscape: true }],

      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unused-vars': 'off',

      // this rule, if on, would require explicit return type on the `render` function
      '@typescript-eslint/explicit-function-return-type': 'off',

      // in plain CommonJS modules, you can't use `import foo = require('foo')` to pass this rule, so it has to be disabled
      '@typescript-eslint/no-require-imports': 'off',

      '@typescript-eslint/no-explicit-any': 'off',

      // The core 'no-unused-vars' rules (in the eslint:recommended ruleset)
      // does not work with type definitions
      'no-unused-vars': 'off',

      // allow debugger during development only
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],

      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              from: './src/**/*',
              target: './src-electron/**/*',
            },
            {
              from: './src-electron/!(schema|api)/**/*',
              target: './src/**/*',
            },
          ],
        },
      ],
    },
  }
);

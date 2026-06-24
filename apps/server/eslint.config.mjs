// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import path from 'node:path';
import tseslint from 'typescript-eslint';

const tsconfigRootDir = import.meta.dirname;

/** @see docs/architecture.md — "Enforcing boundaries via ESLint" */
const hexagonalBoundaryZones = [
  { target: './src/*/domain/**', from: './src/*/application/**' },
  { target: './src/*/domain/**', from: './src/*/infrastructure/**' },
  { target: './src/*/domain/**', from: './src/*/transport/**' },
  { target: './src/*/application/**', from: './src/*/infrastructure/**' },
  { target: './src/*/application/**', from: './src/*/transport/**' },
  { target: './src/*/infrastructure/**', from: './src/*/transport/**' },
  { target: './src/*/transport/**', from: './src/*/infrastructure/**' },
];

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
    },
  },
  {
    files: ['src/**/*.ts'],
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: path.join(tsconfigRootDir, 'tsconfig.json'),
        },
      },
    },
    rules: {
      'import/no-restricted-paths': [
        'error',
        { basePath: tsconfigRootDir, zones: hexagonalBoundaryZones },
      ],
    },
  },
  {
    files: ['src/*/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@nestjs/*', 'typeorm', 'typeorm/*', 'socket.io', 'socket.io/*'],
              message:
                'Domain layer must not depend on NestJS, TypeORM, or Socket.io.',
            },
          ],
        },
      ],
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
);

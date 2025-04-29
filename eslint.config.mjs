import { defineConfig, globalIgnores } from 'eslint/config'
import react from 'eslint-plugin-react'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default defineConfig([
  globalIgnores(['**/*.css']),
  {
    extends: compat.extends('eslint:recommended', 'plugin:react/recommended', 'plugin:@typescript-eslint/recommended'),

    plugins: {
      react,
      '@typescript-eslint': typescriptEslint
    },

    languageOptions: {
      globals: {
        ...globals.browser
      },

      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module'
    },

    settings: {
      react: {
        version: 'detect'
      }
    },

    rules: {
      'react/react-in-jsx-scope': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
])

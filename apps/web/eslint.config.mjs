import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Design prototype files — these use loose JSX conventions and should not
    // be gated by the same rules as production source code.
    'design/**',
    'scripts/**',
  ]),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'react/self-closing-comp': 'error',
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // These rules produce false positives for two valid React patterns:
      // • setMounted(true) in useEffect — standard Next.js SSR-hydration guard.
      // • .current = value on a useRef — valid mutation; naming convention enforced
      //   separately. Both downgraded to warn so CI reports them without blocking.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
])

export default eslintConfig

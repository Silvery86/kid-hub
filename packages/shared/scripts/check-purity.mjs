// Purity guard for @kid-hub/shared.
//
// This package is bundled into the Metro (React Native) build, so every module
// under src/ must stay isomorphic — no `server-only`, no Prisma, no Next, no
// React/React Native, no Node built-ins. Only pure/isomorphic deps (e.g. zod)
// are allowed. Wired as the package `lint` script so `turbo run lint` enforces
// it in CI. See mobile_imp.md §10 Phase 2.
import { readdirSync, readFileSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = fileURLToPath(new URL('../src', import.meta.url))

/** Import specifiers forbidden inside packages/shared/src. */
const DENY = [
  'server-only',
  'react',
  'react-dom',
  /^@prisma(\/|$)/,
  /^prisma(\/|$)/,
  /^next(\/|$)/,
  /^react\//,
  /^react-native(\/|$)/,
  /^node:/,
  /^(fs|fs\/promises|path|os|crypto|child_process|http|https|net|tls|stream|zlib|dns|cluster|worker_threads)$/,
]

const SPEC =
  /(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g

function walk(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...walk(full))
    else if (['.ts', '.tsx', '.js', '.mjs'].includes(extname(full))) files.push(full)
  }
  return files
}

let violations = 0
for (const file of walk(SRC)) {
  const code = readFileSync(file, 'utf8')
  let match
  while ((match = SPEC.exec(code))) {
    const spec = match[1] ?? match[2] ?? match[3]
    if (!spec) continue
    const forbidden = DENY.some((d) => (typeof d === 'string' ? d === spec : d.test(spec)))
    if (forbidden) {
      console.error(`✖ ${file}: forbidden import "${spec}"`)
      violations++
    }
  }
}

if (violations > 0) {
  console.error(
    `\nPurity check failed: ${violations} forbidden import(s) in packages/shared/src. ` +
      `This package must stay isomorphic (no server-only/Prisma/Next/React/Node builtins).`
  )
  process.exit(1)
}

console.log('✓ @kid-hub/shared purity check passed (isomorphic — safe for Metro).')

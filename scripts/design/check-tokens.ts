/**
 * check-tokens.ts
 *
 * Check 4: Semantic Token Compliance
 *   Scans all .tsx files in components/ and app/ for raw Tailwind palette classes
 *   where a design token exists (e.g. bg-blue-500 instead of bg-btn-primary).
 *
 *   Uses the semanticViolations and tokenAllowlist from design-check.config.ts.
 *   Does NOT flag: game feedback colours (red/green/yellow), structural neutrals
 *   (slate/zinc/gray), or files in the configured allowlist.
 *
 * Exits 0 on success, 1 on any violation.
 *
 * Usage: pnpm design:check (invoked as part of the full check suite)
 */

import fs from 'fs'
import path from 'path'
import { config } from './design-check.config'

const ROOT = process.cwd()

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GREEN = '\x1b[32m'
const RED   = '\x1b[31m'
const DIM   = '\x1b[2m'
const RESET = '\x1b[0m'

function ok(msg: string)  { console.log(`${GREEN}✓${RESET}  ${msg}`) }
function err(msg: string) { console.log(`${RED}✗${RESET}  ${msg}`) }
function hint(msg: string){ console.log(`${DIM}     → ${msg}${RESET}`) }

// ─── File scanner ─────────────────────────────────────────────────────────────

/**
 * Recursively collects all .tsx files under the given directory,
 * excluding configured directories.
 */
function collectTsxFiles(dir: string): string[] {
  const results: string[] = []

  function walk(current: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        const relDir = path.relative(ROOT, full).replace(/\\/g, '/')
        if (config.scanExcludeDirs.some((ex) => relDir === ex || relDir.startsWith(ex + '/'))) {
          continue
        }
        walk(full)
      } else if (entry.name.endsWith('.tsx')) {
        results.push(full)
      }
    }
  }

  walk(dir)
  return results
}

/**
 * Checks whether a file path is in the token allowlist.
 */
function isAllowlisted(filePath: string): boolean {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/')
  return config.tokenAllowlist.some((allowed) => rel === allowed || rel.endsWith('/' + allowed))
}

// ─── Violation scanner ────────────────────────────────────────────────────────

interface Violation {
  file: string
  line: number
  match: string
  suggestion: string
}

/**
 * Scans a single file for semantic token violations.
 */
function scanFile(filePath: string): Violation[] {
  const violations: Violation[] = []
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const rule of config.semanticViolations) {
      const match = line.match(rule.pattern)
      if (match) {
        violations.push({
          file: path.relative(ROOT, filePath).replace(/\\/g, '/'),
          line: i + 1,
          match: match[0],
          suggestion: rule.suggestion,
        })
      }
    }
  }

  return violations
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Scans all TSX files for semantic token violations and prints results.
 * Returns true if no violations were found.
 */
function runTokenChecks(): boolean {
  console.log(`\n${DIM}── Check 4: Semantic Token Compliance ────────────────${RESET}`)

  const scanDirs = [
    path.join(ROOT, 'components'),
    path.join(ROOT, 'app'),
  ].filter((d) => fs.existsSync(d))

  const allFiles = scanDirs.flatMap(collectTsxFiles)
  const filesToScan = allFiles.filter((f) => !isAllowlisted(f))

  const allViolations: Violation[] = []
  for (const file of filesToScan) {
    allViolations.push(...scanFile(file))
  }

  if (allViolations.length === 0) {
    ok(`${filesToScan.length} TSX files scanned · 0 semantic token violations`)
    return true
  }

  err(`${allViolations.length} semantic token violation(s):`)
  for (const v of allViolations) {
    console.log(`${RED}     ${v.file}:${v.line}  ${v.match}${RESET}`)
    hint(`Use ${v.suggestion}`)
  }

  return false
}

const passed = runTokenChecks()
if (!passed) process.exit(1)

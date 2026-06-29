/**
 * check-viewports.ts
 *
 * Check 3: Viewport Export Coverage
 *   Parses each non-utility design .jsx file for its exported viewport components.
 *   Expected pattern: Object.assign(window, { NamePhoneP, NameTabletL, ... })
 *
 *   Rules:
 *   - Missing *TabletL (primary reference) → ERROR
 *   - Missing *PhoneP  (minimum mobile)    → WARNING
 *   - Fewer than 3 viewport variants total  → WARNING
 *
 * Reads design/manifest.json.
 * Exits 0 on success (errors only, warnings do not block), 1 on errors.
 *
 * Usage: pnpm design:check (invoked as part of the full check suite)
 */

import fs from 'fs'
import path from 'path'
import { config } from './design-check.config'

const MANIFEST_PATH = path.join(process.cwd(), 'design/manifest.json')

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GREEN  = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED    = '\x1b[31m'
const DIM    = '\x1b[2m'
const RESET  = '\x1b[0m'

function ok(msg: string)   { console.log(`${GREEN}✓${RESET}  ${msg}`) }
function warn(msg: string)  { console.log(`${YELLOW}⚠${RESET}  ${msg}`) }
function err(msg: string)   { console.log(`${RED}✗${RESET}  ${msg}`) }
function hint(msg: string)  { console.log(`${DIM}     → ${msg}${RESET}`) }

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Checks that all non-utility design files have required viewport exports.
 * Returns true if no errors were found (warnings don't block).
 */
function runViewportChecks(): boolean {
  if (!fs.existsSync(MANIFEST_PATH)) {
    err('design/manifest.json not found — run `pnpm design:manifest` first')
    process.exit(1)
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
  console.log(`\n${DIM}── Check 3: Viewport Export Coverage ─────────────────${RESET}`)

  const nonUtilityFiles = manifest.designFiles.filter(
    (d: any) => !d.isUtility && d.existsOnDisk && !config.viewportExceptions.includes(path.basename(d.path))
  )

  let errorCount = 0
  let warnCount = 0

  for (const file of nonUtilityFiles) {
    const viewports: string[] = file.exportedViewports
    // Support both short (TabletL / PhoneP) and long (TabletLandscape / PhonePortrait) naming
    const hasTabletL = viewports.some((v: string) => v.endsWith('TabletL') || v.endsWith('TabletLandscape'))
    const hasPhoneP  = viewports.some((v: string) => v.endsWith('PhoneP') || v.endsWith('PhonePortrait'))

    if (!hasTabletL) {
      err(`${file.path}`)
      hint(`Missing *TabletL viewport (primary reference) — add it before implementing`)
      errorCount++
    } else if (!hasPhoneP) {
      warn(`${file.path}`)
      hint(`Missing *PhoneP viewport (minimum mobile coverage)`)
      warnCount++
    } else if (viewports.length < 3) {
      warn(`${file.path}`)
      hint(`Only ${viewports.length} viewport variant(s) — recommended minimum is 3`)
      warnCount++
    }
  }

  if (errorCount === 0 && warnCount === 0) {
    ok(`${nonUtilityFiles.length} design files · all have TabletL (primary) viewport · all have PhoneP`)
  } else if (errorCount === 0) {
    ok(`All design files have required *TabletL viewport`)
    warn(`${warnCount} file(s) missing optional viewport variants (see above)`)
  }

  return errorCount === 0
}

const passed = runViewportChecks()
if (!passed) process.exit(1)

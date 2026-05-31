/**
 * check-coverage.ts
 *
 * Check 1: Route → Design Coverage
 *   Every app page.tsx has a corresponding design file entry (unless explicitly skipped).
 *
 * Check 2: Design File Inventory
 *   Every .jsx in design/components/ is documented in DESIGN_TO_CODE.md §1,
 *   and every documented file still exists on disk.
 *
 * Reads design/manifest.json (build it first with `pnpm design:manifest`).
 * Exits 0 on success, 1 on any failure.
 *
 * Usage: pnpm design:check (invoked as part of the full check suite)
 */

import fs from 'fs'
import path from 'path'

const MANIFEST_PATH = path.join(process.cwd(), 'design/manifest.json')

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GREEN = '\x1b[32m'
const RED   = '\x1b[31m'
const DIM   = '\x1b[2m'
const RESET = '\x1b[0m'

function ok(msg: string)   { console.log(`${GREEN}✓${RESET}  ${msg}`) }
function err(msg: string)  { console.log(`${RED}✗${RESET}  ${msg}`) }
function hint(msg: string) { console.log(`${DIM}     → ${msg}${RESET}`) }

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Runs coverage checks against the manifest and prints results.
 * Returns true if all checks passed.
 */
function runCoverageChecks(): boolean {
  if (!fs.existsSync(MANIFEST_PATH)) {
    err('design/manifest.json not found — run `pnpm design:manifest` first')
    process.exit(1)
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
  let allPassed = true

  // ── Check 1: Route → Design Coverage ──────────────────────────────────────
  console.log(`\n${DIM}── Check 1: Route → Design Coverage ──────────────────${RESET}`)

  const { routesMissingDesign } = manifest.checks
  const totalRoutes = manifest.routes.length
  const skippedRoutes = manifest.routes.filter(
    (r: any) => r.status === 'code-only' || r.status === 'n/a'
  ).length
  const coveredRoutes = totalRoutes - skippedRoutes - routesMissingDesign.length

  if (routesMissingDesign.length === 0) {
    ok(`${totalRoutes} routes scanned · ${coveredRoutes} have design coverage · ${skippedRoutes} skipped`)
  } else {
    allPassed = false
    err(`${routesMissingDesign.length} route(s) have no design entry:`)
    for (const route of routesMissingDesign) {
      hint(`${route}  — add a row to DESIGN_TO_CODE.md §5 or mark as code-only`)
    }
  }

  // ── Check 2: Design File Inventory ────────────────────────────────────────
  console.log(`\n${DIM}── Check 2: Design File Inventory ────────────────────${RESET}`)

  const { undocumentedDesignFiles, missingOnDisk } = manifest.checks
  const totalDesignFiles = manifest.designFiles.filter((d: any) => !d.isUtility).length

  if (undocumentedDesignFiles.length === 0 && missingOnDisk.length === 0) {
    ok(`${totalDesignFiles} design component files · all documented in DESIGN_TO_CODE.md`)
  } else {
    if (undocumentedDesignFiles.length > 0) {
      allPassed = false
      err(`${undocumentedDesignFiles.length} undocumented design file(s) found:`)
      for (const file of undocumentedDesignFiles) {
        hint(`${file}  — not in DESIGN_TO_CODE.md §1`)
        hint(`Add a row to §1 or mark it as utility in design-check.config.ts`)
      }
    }
    if (missingOnDisk.length > 0) {
      allPassed = false
      err(`${missingOnDisk.length} design file(s) documented but missing on disk:`)
      for (const file of missingOnDisk) {
        hint(`${file}  — remove the §1 row or restore the file`)
      }
    }
  }

  return allPassed
}

const passed = runCoverageChecks()
if (!passed) process.exit(1)

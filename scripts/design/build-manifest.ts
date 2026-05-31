/**
 * build-manifest.ts
 *
 * Parses DESIGN_TO_CODE.md §1 (design file inventory) and §5 (route table),
 * scans the filesystem for actual page.tsx routes and design/*.jsx files,
 * and outputs design/manifest.json — the single machine-readable source of
 * truth consumed by all other check scripts.
 *
 * Usage: pnpm design:manifest
 */

import fs from 'fs'
import path from 'path'
import { config } from './design-check.config'

const ROOT = path.resolve(process.cwd())
const DESIGN_TO_CODE_MD = path.join(ROOT, 'docs/features/DESIGN_TO_CODE.md')
const DESIGN_COMPONENTS_DIR = path.join(ROOT, 'design/components')
const APP_DIR = path.join(ROOT, 'app')
const MANIFEST_PATH = path.join(ROOT, 'design/manifest.json')

// ─── Types ────────────────────────────────────────────────────────────────────

interface RouteEntry {
  route: string
  pagePath: string
  designFiles: string[]
  status: string
  viewports: string[]
}

interface DesignFileEntry {
  path: string
  covers: string[]
  documented: boolean
  existsOnDisk: boolean
  isUtility: boolean
  exportedViewports: string[]
}

interface Manifest {
  generatedAt: string
  routes: RouteEntry[]
  designFiles: DesignFileEntry[]
  checks: {
    routesMissingDesign: string[]
    undocumentedDesignFiles: string[]
    missingOnDisk: string[]
    viewportWarnings: string[]
    tokenViolations: string[]
  }
}

// ─── §1 parser — design file inventory table ─────────────────────────────────

/**
 * Parses the §1 table in DESIGN_TO_CODE.md.
 * Returns a map of basename → { covers, viewports }
 */
function parseDesignInventory(md: string): Map<string, { covers: string[]; viewports: string[] }> {
  const result = new Map<string, { covers: string[]; viewports: string[] }>()

  const section1Match = md.match(/## 1\. Design File Inventory([\s\S]*?)(?=\n## )/)
  if (!section1Match) return result

  const tableLines = section1Match[1]
    .split('\n')
    .filter((l) => l.includes('|') && !l.match(/^[\s|:-]+$/))

  for (const line of tableLines) {
    const cells = line.split('|').map((c) => c.trim()).filter(Boolean)
    if (cells.length < 2) continue

    const fileCell = cells[0]
    // match e.g. `design/components/foo.jsx` or `foo.jsx`
    const fileMatch = fileCell.match(/`(?:design\/components\/)?([^`]+\.jsx)`/)
    if (!fileMatch) continue

    const filename = fileMatch[1]
    const covers = cells[1] ? parseCoveredRoutes(cells[1]) : []
    const viewports = cells[2] ? parseViewportVariants(cells[2]) : []
    result.set(filename, { covers, viewports })
  }

  return result
}

/**
 * Extracts route paths from the "Covers" cell text.
 */
function parseCoveredRoutes(text: string): string[] {
  const routes: string[] = []
  const matches = text.matchAll(/`([/][^`]*)`/g)
  for (const m of matches) routes.push(m[1])
  return routes
}

/**
 * Extracts viewport variant names from the "Viewport Variants" cell.
 */
function parseViewportVariants(text: string): string[] {
  if (text.includes('—') || text.includes('utilities only')) return []
  const parts = text.split(/[,·]/).map((s) => s.trim()).filter(Boolean)
  return parts
}

// ─── §5 parser — route & design status table ─────────────────────────────────

/**
 * Parses the §5 table in DESIGN_TO_CODE.md.
 * Returns a map of route → { pagePath, designFile, status }
 */
function parseRouteTable(md: string): Map<string, { pagePath: string; designFile: string; status: string }> {
  const result = new Map<string, { pagePath: string; designFile: string; status: string }>()

  // Match section 5 through to next ## or end
  const section5Match = md.match(/## 5\. Route[^\n]*\n([\s\S]*?)(?=\n## |\s*$)/)
  if (!section5Match) return result

  const tableLines = section5Match[1]
    .split('\n')
    .filter((l) => l.includes('|') && !l.match(/^[\s|:-]+$/))

  for (const line of tableLines) {
    const cells = line.split('|').map((c) => c.trim()).filter(Boolean)
    if (cells.length < 4) continue

    const routeMatch = cells[0].match(/`([^`]+)`/)
    if (!routeMatch) continue

    const route = routeMatch[1]
    const pageMatch = cells[1].match(/`([^`]+)`/)
    const pagePath = pageMatch ? pageMatch[1] : cells[1].replace(/`/g, '').trim()

    const designSrc = cells[2]
    // Extract first .jsx filename if present
    const designFileMatch = designSrc.match(/`?([a-z0-9-]+\.jsx)`?/)
    const designFile = designFileMatch ? designFileMatch[1] : ''

    const status = cells[3]

    result.set(route, {
      pagePath,
      designFile,
      status: normaliseStatus(status),
    })
  }

  return result
}

/**
 * Normalises status strings to consistent identifiers.
 */
function normaliseStatus(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes('code-only') || lower.includes('code only')) return 'code-only'
  if (lower.includes('n/a') || lower.includes('redirect')) return 'n/a'
  if (lower.includes('design-only') || lower.includes('design only')) return 'design-only'
  if (lower.includes('designed') && lower.includes('implemented')) return 'designed+implemented'
  if (lower.includes('designed')) return 'designed'
  return lower.trim()
}

// ─── Filesystem scanners ──────────────────────────────────────────────────────

/**
 * Recursively finds all page.tsx files under app/ and returns their routes.
 */
function scanAppRoutes(): { route: string; pagePath: string }[] {
  const routes: { route: string; pagePath: string }[] = []

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (entry.name === 'page.tsx') {
        const rel = path.relative(ROOT, full).replace(/\\/g, '/')
        const route = derivedRoute(rel)
        routes.push({ route, pagePath: rel })
      }
    }
  }

  walk(APP_DIR)
  return routes
}

/**
 * Converts a page.tsx path to its URL route by stripping route groups and segments.
 */
function derivedRoute(pagePath: string): string {
  let route = pagePath
    .replace(/^app\//, '')
    .replace(/\/page\.tsx$/, '')
    .replace(/\([^)]+\)\//g, '')
    .replace(/^page\.tsx$/, '')   // root page.tsx → ''

  if (!route || route === '') return '/'
  return '/' + route
}

/**
 * Scans design/components/ for all .jsx files.
 */
function scanDesignFiles(): string[] {
  if (!fs.existsSync(DESIGN_COMPONENTS_DIR)) return []
  return fs
    .readdirSync(DESIGN_COMPONENTS_DIR)
    .filter((f) => f.endsWith('.jsx'))
}

/**
 * Parses a design .jsx file for its exported viewport function names.
 * Handles both simple identifier exports and arrow function value exports.
 */
function extractExportedViewports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8')

  // Find the Object.assign(window, { ... }) block — scan line by line
  // because the block may contain nested {} from arrow functions
  const lines = content.split('\n')
  const assignStart = lines.findIndex((l) => /Object\.assign\s*\(\s*window\s*,\s*\{/.test(l))
  if (assignStart === -1) return []

  // Collect lines until the block closes (track brace depth)
  const blockLines: string[] = []
  let depth = 0
  let started = false

  for (let i = assignStart; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') { depth++; started = true }
      if (ch === '}') depth--
    }
    blockLines.push(lines[i])
    if (started && depth === 0) break
  }

  const block = blockLines.join('\n')

  // Extract keys: uppercase-starting identifiers immediately followed by : or ,
  const names: string[] = []
  for (const match of block.matchAll(/\b([A-Z][A-Za-z0-9_]+)\s*[,:]/g)) {
    names.push(match[1])
  }

  return names
}

// ─── Manifest assembly ────────────────────────────────────────────────────────

/**
 * Builds and writes design/manifest.json from all parsed data.
 */
function buildManifest(): Manifest {
  const md = fs.readFileSync(DESIGN_TO_CODE_MD, 'utf-8')

  const inventoryMap = parseDesignInventory(md)
  const routeTableMap = parseRouteTable(md)
  const fsRoutes = scanAppRoutes()
  const fsDesignFiles = scanDesignFiles()

  const routes: RouteEntry[] = fsRoutes.map(({ route, pagePath }) => {
    const tableEntry = routeTableMap.get(route)
    const designFilename = tableEntry?.designFile
    const designFiles = designFilename && designFilename !== '—' && designFilename !== ''
      ? [`design/components/${designFilename}`]
      : []

    return {
      route,
      pagePath,
      designFiles,
      status: tableEntry?.status ?? 'undocumented',
      viewports: [],
    }
  })

  const designFileEntries: DesignFileEntry[] = fsDesignFiles.map((filename) => {
    const inventoryEntry = inventoryMap.get(filename)
    const rel = `design/components/${filename}`
    const fullPath = path.join(ROOT, rel)
    const isUtility = config.utilityDesignFiles.includes(filename)
    const exportedViewports = fs.existsSync(fullPath) ? extractExportedViewports(fullPath) : []

    return {
      path: rel,
      covers: inventoryEntry?.covers ?? [],
      documented: inventoryMap.has(filename),
      existsOnDisk: fs.existsSync(fullPath),
      isUtility,
      exportedViewports,
    }
  })

  const routesMissingDesign = routes
    .filter((r) => !config.skipRoutes.includes(r.route))
    .filter((r) => r.status !== 'code-only' && r.status !== 'n/a')
    .filter((r) => r.designFiles.length === 0)
    .map((r) => r.route)

  const undocumentedDesignFiles = designFileEntries
    .filter((d) => !d.isUtility && !d.documented)
    .map((d) => d.path)

  const missingOnDisk = designFileEntries
    .filter((d) => !d.isUtility && !d.existsOnDisk)
    .map((d) => d.path)

  const manifest: Manifest = {
    generatedAt: new Date().toISOString(),
    routes,
    designFiles: designFileEntries,
    checks: {
      routesMissingDesign,
      undocumentedDesignFiles,
      missingOnDisk,
      viewportWarnings: [],
      tokenViolations: [],
    },
  }

  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true })
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))

  console.log(`✓ Manifest written → design/manifest.json`)
  console.log(`  ${routes.length} routes · ${designFileEntries.length} design files`)

  return manifest
}

buildManifest()

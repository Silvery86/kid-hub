/**
 * build-manifest.ts
 *
 * Parses docs/features/design/DESIGN_TO_CODE.html tables
 * (Design File Inventory + Route & Design Status),
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
const DESIGN_TO_CODE_HTML = path.join(ROOT, 'docs/features/design/DESIGN_TO_CODE.html')
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

// ─── HTML table parser helpers ────────────────────────────────────────────────

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function stripTags(text: string): string {
  return decodeHtml(text.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function extractCardTableByHeading(html: string, headingText: string): string {
  const cards = html.matchAll(/<section class="card">([\s\S]*?)<\/section>/g)
  for (const cardMatch of cards) {
    const cardHtml = cardMatch[1] ?? ''
    if (!cardHtml) continue
    const heading = cardHtml.match(/<h2>([\s\S]*?)<\/h2>/)
    if (!heading) continue
    const headingValue = stripTags(heading[1] ?? '')
    if (headingValue !== headingText) continue
    const tableMatch = cardHtml.match(/<table>([\s\S]*?)<\/table>/)
    if (tableMatch?.[1]) return tableMatch[1]
  }
  return ''
}

function parseHtmlTableRows(tableHtml: string): string[][] {
  const rows: string[][] = []
  for (const rowMatch of tableHtml.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const rowHtml = rowMatch[1] ?? ''
    if (!rowHtml) continue
    const cells: string[] = []
    for (const cellMatch of rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)) {
      cells.push(stripTags(cellMatch[1] ?? ''))
    }
    if (cells.length > 0) rows.push(cells)
  }
  return rows
}

// ─── Inventory parser ─────────────────────────────────────────────────────────

/**
 * Parses "Design File Inventory" table from DESIGN_TO_CODE.html.
 * Returns a map of basename → { covers, viewports }
 */
function parseDesignInventory(html: string): Map<string, { covers: string[]; viewports: string[] }> {
  const result = new Map<string, { covers: string[]; viewports: string[] }>()
  const tableHtml = extractCardTableByHeading(html, 'Design File Inventory')
  if (!tableHtml) return result

  const rows = parseHtmlTableRows(tableHtml)
  for (const cells of rows) {
    if (cells.length < 3) continue
    const fileCell = cells[0] ?? ''
    const filenameMatch = fileCell.match(/(?:design\/components\/)?([a-z0-9-]+\.jsx)/i)
    const filename = filenameMatch?.[1] ?? ''
    if (!filename) continue

    const covers = parseCoveredRoutes(cells[1] ?? '')
    const viewports = parseViewportVariants(cells[2] ?? '')
    result.set(filename, { covers, viewports })
  }

  return result
}

/**
 * Extracts route paths from the "Covers" cell text.
 */
function parseCoveredRoutes(text: string): string[] {
  const routes = new Set<string>()
  const matches = text.matchAll(/\/[a-z0-9/-]*/gi)
  for (const m of matches) {
    const route = m[0]
    if (route) routes.add(route)
  }
  return Array.from(routes)
}

/**
 * Extracts viewport variant names from the "Viewport Variants" cell.
 */
function parseViewportVariants(text: string): string[] {
  if (text.includes('—')) return []
  const parts = text.split(/[,·]/).map((s) => s.trim()).filter(Boolean)
  return parts
}

// ─── Route table parser ───────────────────────────────────────────────────────

/**
 * Parses "Route & Design Status" table from DESIGN_TO_CODE.html.
 * Returns a map of route → { pagePath, designFile, status }
 */
function parseRouteTable(html: string): Map<string, { pagePath: string; designFile: string; status: string }> {
  const result = new Map<string, { pagePath: string; designFile: string; status: string }>()
  const tableHtml = extractCardTableByHeading(html, 'Route & Design Status')
  if (!tableHtml) return result

  const rows = parseHtmlTableRows(tableHtml)
  for (const cells of rows) {
    if (cells.length < 4) continue
    const route = (cells[0] ?? '').trim()
    const pagePath = (cells[1] ?? '').trim()
    const designSrc = cells[2] ?? ''
    const status = cells[3] ?? ''

    if (!route.startsWith('/')) continue

    const designFileMatch = designSrc.match(/([a-z0-9-]+\.jsx)/i)
    const designFile = designFileMatch?.[1] ?? ''

    result.set(route, { pagePath, designFile, status: normaliseStatus(status) })
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
    const line = lines[i] ?? ''
    for (const ch of line) {
      if (ch === '{') { depth++; started = true }
      if (ch === '}') depth--
    }
    blockLines.push(line)
    if (started && depth === 0) break
  }

  const block = blockLines.join('\n')

  // Extract keys: uppercase-starting identifiers immediately followed by : or ,
  const names: string[] = []
  for (const match of block.matchAll(/\b([A-Z][A-Za-z0-9_]+)\s*[,:]/g)) {
    const name = match[1]
    if (name) names.push(name)
  }

  return names
}

// ─── Manifest assembly ────────────────────────────────────────────────────────

/**
 * Builds and writes design/manifest.json from all parsed data.
 */
function buildManifest(): Manifest {
  const html = fs.readFileSync(DESIGN_TO_CODE_HTML, 'utf-8')

  const inventoryMap = parseDesignInventory(html)
  const routeTableMap = parseRouteTable(html)
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

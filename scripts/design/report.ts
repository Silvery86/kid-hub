/**
 * report.ts
 *
 * Generates design/drift-report.html — a self-contained visual HTML dashboard
 * summarising all design check results. Reads design/manifest.json.
 *
 * Useful for onboarding, sprint planning reviews, and PR comment attachments.
 * Not required for CI (use `pnpm design:check` for that).
 *
 * Usage: pnpm design:report
 */

import fs from 'fs'
import path from 'path'

const ROOT          = process.cwd()
const MANIFEST_PATH = path.join(ROOT, 'design/manifest.json')
const REPORT_PATH   = path.join(ROOT, 'design/drift-report.html')

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a coloured badge HTML string based on status value.
 */
function badge(text: string, kind: 'ok' | 'warn' | 'err' | 'info' | 'skip'): string {
  const colours: Record<string, string> = {
    ok:   'background:#dcfce7;color:#166534',
    warn: 'background:#fef9c3;color:#854d0e',
    err:  'background:#fee2e2;color:#991b1b',
    info: 'background:#dbeafe;color:#1e40af',
    skip: 'background:#f1f5f9;color:#64748b',
  }
  return `<span style="display:inline-flex;align-items:center;font-size:11px;font-weight:800;padding:2px 9px;border-radius:99px;letter-spacing:.04em;${colours[kind]}">${text}</span>`
}

/**
 * Returns a status badge based on a route's status string.
 */
function routeStatusBadge(status: string): string {
  if (status === 'n/a') return badge('N/A', 'skip')
  if (status === 'code-only') return badge('Code-only', 'info')
  if (status === 'designed+implemented') return badge('✓ Designed + Implemented', 'ok')
  if (status === 'designed') return badge('Design-only', 'warn')
  if (status === 'undocumented') return badge('⚠ Not in §5', 'err')
  return badge(status, 'info')
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

/**
 * Builds the full HTML report string from the manifest.
 */
function buildReport(manifest: any): string {
  const { routes, designFiles, checks } = manifest
  const now = new Date(manifest.generatedAt).toLocaleString()

  const totalIssues =
    checks.routesMissingDesign.length +
    checks.undocumentedDesignFiles.length +
    checks.missingOnDisk.length +
    checks.viewportWarnings.length +
    checks.tokenViolations.length

  const statusBanner =
    totalIssues === 0
      ? `<div style="background:#dcfce7;color:#166534;border-radius:12px;padding:14px 20px;font-weight:800;font-size:15px;margin-bottom:20px">✓ All checks passed — 0 issues found</div>`
      : `<div style="background:#fee2e2;color:#991b1b;border-radius:12px;padding:14px 20px;font-weight:800;font-size:15px;margin-bottom:20px">✗ ${totalIssues} issue(s) found — see details below</div>`

  const routeRows = routes
    .map(
      (r: any) => `
    <tr>
      <td><code style="font-size:12px;background:#f1f5f9;padding:2px 6px;border-radius:4px">${r.route}</code></td>
      <td style="font-size:12px;color:#64748b">${r.designFiles.join(', ') || '—'}</td>
      <td>${routeStatusBadge(r.status)}</td>
    </tr>`
    )
    .join('')

  const designFileRows = designFiles
    .filter((d: any) => !d.isUtility)
    .map(
      (d: any) => `
    <tr>
      <td><code style="font-size:12px;background:#f1f5f9;padding:2px 6px;border-radius:4px">${path.basename(d.path)}</code></td>
      <td>${d.documented ? badge('✓ Documented', 'ok') : badge('✗ Missing', 'err')}</td>
      <td>${d.existsOnDisk ? badge('✓ On disk', 'ok') : badge('✗ Missing', 'err')}</td>
      <td style="font-size:11px;color:#64748b">${d.exportedViewports.join(', ') || '—'}</td>
    </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Kid Hub — Design Drift Report</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;color:#0f172a;line-height:1.5}
  .page{max-width:1100px;margin:0 auto;padding:32px 24px 80px}
  h1{font-size:22px;font-weight:900}
  h2{font-size:15px;font-weight:800;margin:24px 0 10px}
  .header{background:linear-gradient(135deg,#0f172a 0%,#312e81 100%);color:white;border-radius:20px;padding:24px 28px;margin-bottom:20px}
  .header h1{color:white}
  .meta{font-size:13px;opacity:.7;margin-top:4px}
  .card{background:white;border-radius:16px;padding:22px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,.07)}
  table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}
  th{text-align:left;padding:8px 10px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;border-bottom:2px solid #f1f5f9}
  td{padding:9px 10px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
  tr:last-child td{border-bottom:none}
  code{font-family:'SF Mono','Fira Code',monospace}
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <h1>🔍 Design Drift Report — Kid Hub</h1>
    <div class="meta">Generated ${now}</div>
  </div>

  ${statusBanner}

  <div class="card">
    <h2>Route → Design Coverage</h2>
    <table>
      <thead><tr><th>Route</th><th>Design File(s)</th><th>Status</th></tr></thead>
      <tbody>${routeRows}</tbody>
    </table>
  </div>

  <div class="card">
    <h2>Design File Inventory</h2>
    <table>
      <thead><tr><th>File</th><th>Documented</th><th>On Disk</th><th>Exported Viewports</th></tr></thead>
      <tbody>${designFileRows}</tbody>
    </table>
  </div>

  ${
    checks.tokenViolations.length > 0
      ? `<div class="card">
    <h2>Semantic Token Violations</h2>
    <table>
      <thead><tr><th>File</th><th>Line</th><th>Raw class</th><th>Should use</th></tr></thead>
      <tbody>${checks.tokenViolations
        .map(
          (v: any) => `<tr>
        <td><code>${v.file}</code></td>
        <td>${v.line}</td>
        <td><code>${v.match}</code></td>
        <td><code>${v.suggestion}</code></td>
      </tr>`
        )
        .join('')}</tbody>
    </table>
  </div>`
      : ''
  }

</div>
</body>
</html>`
}

// ─── Entry point ──────────────────────────────────────────────────────────────

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error('✗  design/manifest.json not found — run `pnpm design:manifest` first')
  process.exit(1)
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
const html = buildReport(manifest)
fs.writeFileSync(REPORT_PATH, html)
console.log('✓  Report written → design/drift-report.html')

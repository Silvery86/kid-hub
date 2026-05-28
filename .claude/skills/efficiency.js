/**
 * Efficiency skill — Kid Hub
 *
 * Warns when an agent attempts to list or read a directory that contains
 * more than 50 files without applying a filter. Enforces the "no blind reads"
 * rule from CLAUDE.md § Efficiency Protocol rule 3.
 *
 * Usage: /efficiency <directory-path>
 * Example: /efficiency server/repositories
 */

import { execSync } from 'node:child_process'
import path from 'node:path'

const THRESHOLD = 50

function run(args) {
  const targetDir = args.trim()

  if (!targetDir) {
    console.warn('[efficiency] Usage: /efficiency <directory-path>')
    console.warn('[efficiency] Provide the directory you are about to read.')
    return
  }

  const absoluteDir = path.isAbsolute(targetDir)
    ? targetDir
    : path.join(process.cwd(), targetDir)

  let fileCount
  try {
    const output = execSync(`find "${absoluteDir}" -maxdepth 1 -mindepth 1 | wc -l`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    fileCount = parseInt(output.trim(), 10)
  } catch {
    console.warn(`[efficiency] Could not read directory: ${absoluteDir}`)
    console.warn('[efficiency] Check the path and try again.')
    return
  }

  if (isNaN(fileCount)) {
    console.warn('[efficiency] Could not determine file count.')
    return
  }

  if (fileCount > THRESHOLD) {
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.warn(`[efficiency] WARNING: "${targetDir}" contains ${fileCount} entries.`)
    console.warn(`[efficiency] Threshold is ${THRESHOLD}. Reading without a filter`)
    console.warn('[efficiency] will waste tokens and may miss relevant files.')
    console.warn('[efficiency] Narrow your read with one of:')
    console.warn(`[efficiency]   find ${targetDir} -name "*.ts" -maxdepth 1`)
    console.warn(`[efficiency]   grep -rl "<symbol>" ${targetDir}`)
    console.warn('[efficiency] State what you are looking for before reading.')
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  } else {
    console.warn(`[efficiency] OK — "${targetDir}" has ${fileCount} entries (under ${THRESHOLD}).`)
    console.warn('[efficiency] Safe to read without a filter.')
  }
}

// Entry point: Claude Code passes skill args as process.argv[2]
run(process.argv[2] ?? '')

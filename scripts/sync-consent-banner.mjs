/**
 * Copies utilities/consent-banner/rotbae-consent.js into each app public/ folder.
 * Usage: node scripts/sync-consent-banner.mjs           # all apps
 *        node scripts/sync-consent-banner.mjs music home
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const SOURCE = path.join(repoRoot, 'utilities', 'consent-banner', 'rotbae-consent.js')

const DEFAULT_APPS = [
  'baeday',
  'drops',
  'home',
  'music',
  'project',
  'patterns',
  'stream',
  'testCanvas',
  'void',
]

const argv = process.argv.slice(2)
const targets = argv.length ? argv : DEFAULT_APPS

if (!fs.existsSync(SOURCE)) {
  console.error(`sync-consent-banner: missing ${SOURCE}`)
  process.exit(1)
}

for (const app of targets) {
  const appDir = path.join(repoRoot, app)
  if (
    !fs.existsSync(appDir) ||
    !fs.statSync(appDir).isDirectory()
  ) {
    console.warn(`sync-consent-banner: skip unknown app "${app}"`)
    continue
  }
  const publicDir = path.join(appDir, 'public')
  fs.mkdirSync(publicDir, { recursive: true })
  const dest = path.join(publicDir, 'rotbae-consent.js')
  fs.copyFileSync(SOURCE, dest)
  console.log(`sync-consent-banner: ${app}/public/rotbae-consent.js`)
}

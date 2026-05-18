/**
 * Copy album covers from sourceOfTruth into music/public so Vite includes them in dist.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const musicDir = path.join(__dirname, '..')
const repoRoot = path.join(musicDir, '..')
const srcDir = path.join(repoRoot, 'sourceOfTruth', 'album-art')
const destDir = path.join(musicDir, 'public', 'album-art')

function main() {
  if (!fs.existsSync(srcDir)) {
    console.warn('sync-album-art: no source directory, skipping.')
    return
  }
  fs.mkdirSync(destDir, { recursive: true })
  for (const name of fs.readdirSync(srcDir)) {
    const from = path.join(srcDir, name)
    if (!fs.statSync(from).isFile()) continue
    fs.copyFileSync(from, path.join(destDir, name))
  }
  console.log('sync-album-art: copied album artwork to public/album-art/')
}

main()

/**
 * After `vite build`, writes static HTML for album hubs, song pages, and sitemap.xml.
 * Crawlers get full lyric text in <pre>; JSON-LD uses truncated excerpt only.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const musicDir = path.join(__dirname, '..')
const repoRoot = path.join(musicDir, '..')
const distDir = path.join(musicDir, 'dist')
const templatePath = path.join(distDir, 'index.html')
const catalogPath = path.join(repoRoot, 'sourceOfTruth', 'music.json')

const BASE_URL = 'https://music.rotbae.com'
const ASSET_BASE = `${BASE_URL}/music`
const JSONLD_LYRIC_MAX = 600

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function truncateLyricsForJsonLd(text) {
  const collapsed = text.replace(/\s+/g, ' ').trim()
  if (collapsed.length <= JSONLD_LYRIC_MAX) return collapsed
  return `${collapsed.slice(0, JSONLD_LYRIC_MAX - 1)}…`
}

function songPageDescription(song, album) {
  return `Official lyrics for '${song.title}' from ${album.title} by ROTBAE.`
}

function absoluteCoverUrl(album) {
  if (!album.coverImage) return ''
  const file = path.basename(album.coverImage)
  return `${ASSET_BASE}/album-art/${encodeURIComponent(file)}`
}

function canonicalForSong(song, album) {
  if (song.url && song.url.startsWith('http')) return song.url
  return `${BASE_URL}/${album.slug}/${song.slug}`
}

function canonicalForAlbum(album) {
  const u = album.url || ''
  if (u.startsWith(BASE_URL)) return u
  return `${BASE_URL}/${album.slug}`
}

function sortedSongs(album) {
  return album.songs.slice().sort((a, b) => a.trackNumber - b.trackNumber)
}

function buildSongJsonLd({ album, song, lyrics, canonical }) {
  const excerpt = truncateLyricsForJsonLd(lyrics)
  const graph = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: song.title,
    url: canonical,
    inAlbum: {
      '@type': 'MusicAlbum',
      name: album.title,
    },
    byArtist: {
      '@type': 'MusicGroup',
      name: album.byArtist || 'ROTBAE',
    },
    recordingOf: {
      '@type': 'MusicComposition',
      name: song.title,
      lyrics: {
        '@type': 'CreativeWork',
        text: excerpt,
      },
    },
  }
  return JSON.stringify(graph)
}

function buildAlbumJsonLd({ album, canonical, trackUrls }) {
  const coverUrl = absoluteCoverUrl(album)
  const graph = {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name: album.title,
    url: canonical,
    byArtist: {
      '@type': 'MusicGroup',
      name: album.byArtist || 'ROTBAE',
    },
    numTracks: album.songs.length,
    image: coverUrl || undefined,
    track: trackUrls.map((url) => ({ '@type': 'MusicRecording', url })),
  }
  return JSON.stringify(graph)
}

function buildSongRootInner({
  album,
  song,
  lyrics,
  prev,
  next,
}) {
  const albumTitleLink = `<a class="music-song__album-crumb" href="../">${escapeHtml(album.title)}</a>`
  const albumLine =
    albumTitleLink +
    (album.byArtist
      ? `<span class="music-song__artist"> · ${escapeHtml(album.byArtist)}</span>`
      : '')

  const lyricsHtml = escapeHtml(lyrics)
  const prevRail =
    prev != null
      ? `<div class="music-song__rail music-song__rail--prev"><div class="music-song__rail-inner"><a class="music-song__skip" href="../${escapeHtml(prev.slug)}/">← ${escapeHtml(prev.title)}</a></div></div>`
      : ''
  const nextRail =
    next != null
      ? `<div class="music-song__rail music-song__rail--next"><div class="music-song__rail-inner"><a class="music-song__skip" href="../${escapeHtml(next.slug)}/">${escapeHtml(next.title)} →</a></div></div>`
      : ''

  const navParts = []
  if (prev) {
    navParts.push(
      `<a class="music-song__skip" href="../${escapeHtml(prev.slug)}/">← ${escapeHtml(prev.title)}</a>`,
    )
  }
  if (next) {
    navParts.push(
      `<a class="music-song__skip" href="../${escapeHtml(next.slug)}/">${escapeHtml(next.title)} →</a>`,
    )
  }
  const nav =
    navParts.length > 0
      ? `<nav class="music-song__nav" aria-label="Previous and next track">${navParts.join(' ')}</nav>`
      : ''
  return `
    <div class="music-app">
      <main class="music-main">
        <div class="music-song music-song--center-main">
          <p class="music-song__album music-song__album-span">${albumLine}</p>
          ${prevRail}
          <h1 class="music-song__title">${escapeHtml(song.title)}</h1>
          ${nextRail}
          <div class="music-song__main-column">
            <pre class="music-song__lyrics">${lyricsHtml}</pre>
            ${nav}
          </div>
        </div>
      </main>
    </div>`.trim()
}

function buildAlbumRootInner({ album, sorted }) {
  const coverImg = album.coverImage
    ? `<img class="music-album__cover" src="/music/album-art/${escapeHtml(
        path.basename(album.coverImage),
      )}" alt="" width="480" height="480" />`
    : ''

  const items = sorted
    .map(
      (s) =>
        `<li><a href="./${escapeHtml(s.slug)}/">${escapeHtml(s.title)}</a></li>`,
    )
    .join('\n')

  return `
    <div class="music-app">
      <main class="music-main">
        <div class="music-album-layout">
          <a class="music-song__back" href="../">← Releases</a>
          <div class="music-album__main">
          ${coverImg}
          <header class="music-album__head">
            <h1 class="music-album__title">${escapeHtml(album.title)}</h1>
            <div class="music-album__meta-row">${
              album.byArtist
                ? `<span class="music-album__artist">${escapeHtml(album.byArtist)}</span><span class="music-album__artist-sep" aria-hidden="true"> · </span>`
                : ''
            }<a class="music-album__play-inline" href="${escapeHtml(album.url)}" target="_blank" rel="noopener noreferrer">PLAY NOW →</a>
            </div>
          </header>
          <ol class="music-album__tracks">${items}</ol>
          <a class="music-album__more" href="${escapeHtml(album.url)}" target="_blank" rel="noopener noreferrer">PLAY NOW →</a>
          </div>
        </div>
      </main>
    </div>`.trim()
}

function injectCommonHead(page, { title, description, canonical, ogImage, ogUrl }) {
  let p = page.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
  const ogDesc = description
  const ogBlock = `
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(ogDesc)}" />
    <meta property="og:url" content="${escapeHtml(ogUrl)}" />
    <meta property="og:type" content="website" />${
      ogImage
        ? `
    <meta property="og:image" content="${escapeHtml(ogImage)}" />`
        : ''
    }
    <meta name="twitter:card" content="summary" />`

  p = p.replace(
    /<meta name="viewport" content="width=device-width, initial-scale=1.0" \/>/,
    `<meta name="viewport" content="width=device-width, initial-scale=1.0" />${ogBlock}`,
  )
  return p
}

function injectJsonLd(page, jsonLdString) {
  const script = `
    <script type="application/ld+json">${jsonLdString.replace(/</g, '\\u003c')}</script>`
  return page.replace(/<\/head>/, `${script}\n  </head>`)
}

function injectRoot(page, inner) {
  return page.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${inner}</div>`,
  )
}

function main() {
  if (!fs.existsSync(templatePath)) {
    console.error(
      'generate-static-music-pages: dist/index.html missing. Run vite build first.',
    )
    process.exit(1)
  }

  const template = fs.readFileSync(templatePath, 'utf8')
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))

  let songWritten = 0
  let songSkipped = 0
  let albumWritten = 0
  const sitemapUrls = []
  let urlCount = 0
  const today = new Date().toISOString().split('T')[0]

  sitemapUrls.push({ loc: `${BASE_URL}/`, changefreq: 'weekly', priority: '1.0' })
  urlCount += 1

  for (const album of catalog) {
    if (!album.songs || !album.slug) continue

    const canonicalAlbum = canonicalForAlbum(album)
    const sorted = sortedSongs(album)
    const trackUrlsForLd = sorted.map(
      (s) => canonicalForSong(s, album),
    )

    const albumDir = path.join(distDir, album.slug)
    fs.mkdirSync(albumDir, { recursive: true })

    const albumInner = buildAlbumRootInner({
      album,
      sorted,
    })
    const albumTitle = `${album.title} · ROTBAE`
    const albumDesc = `${album.title} by ${album.byArtist || 'ROTBAE'} — full track list and links to lyrics.`
    const coverForOg = absoluteCoverUrl(album)

    let albumPage = injectCommonHead(template, {
      title: albumTitle,
      description: albumDesc,
      canonical: canonicalAlbum,
      ogImage: coverForOg || undefined,
      ogUrl: canonicalAlbum,
    })
    albumPage = injectJsonLd(
      albumPage,
      buildAlbumJsonLd({
        album,
        canonical: canonicalAlbum,
        trackUrls: trackUrlsForLd,
      }),
    )
    albumPage = injectRoot(albumPage, albumInner)
    fs.writeFileSync(path.join(albumDir, 'index.html'), albumPage, 'utf8')
    albumWritten += 1

    sitemapUrls.push({
      loc: canonicalAlbum,
      changefreq: 'weekly',
      priority: '0.85',
    })
    urlCount += 1

    for (let index = 0; index < sorted.length; index++) {
      const song = sorted[index]
      const lyricsPathFs = path.join(repoRoot, song.lyricsPath)
      if (!fs.existsSync(lyricsPathFs)) {
        songSkipped += 1
        continue
      }
      const lyrics = fs.readFileSync(lyricsPathFs, 'utf8')
      const prev = index > 0 ? sorted[index - 1] : null
      const next = index < sorted.length - 1 ? sorted[index + 1] : null
      const canonical = canonicalForSong(song, album)
      const pageTitle = `${song.title} Lyrics — ${album.title} | ROTBAE`
      const description = songPageDescription(song, album)
      const ogImage = absoluteCoverUrl(album)

      const rootInner = buildSongRootInner({
        album,
        song,
        lyrics,
        prev,
        next,
      })

      const jsonLd = buildSongJsonLd({ album, song, lyrics, canonical })

      let page = injectCommonHead(template, {
        title: pageTitle,
        description,
        canonical,
        ogImage: ogImage || undefined,
        ogUrl: canonical,
      })
      page = injectJsonLd(page, jsonLd)
      page = injectRoot(page, rootInner)

      const songDir = path.join(albumDir, song.slug)
      fs.mkdirSync(songDir, { recursive: true })
      fs.writeFileSync(path.join(songDir, 'index.html'), page, 'utf8')
      songWritten += 1

      sitemapUrls.push({
        loc: canonical,
        changefreq: 'monthly',
        priority: '0.65',
      })
      urlCount += 1
    }
  }

  const urlset = sitemapUrls
    .map(
      (u) => `  <url>
    <loc>${escapeHtml(u.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
    )
    .join('\n')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`

  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8')

  console.log(
    `generate-static-music-pages: ${albumWritten} album pages, ${songWritten} song pages, sitemap ${urlCount} URLs` +
      (songSkipped ? ` (${songSkipped} missing lyrics skipped)` : '') +
      '.',
  )
}

main()

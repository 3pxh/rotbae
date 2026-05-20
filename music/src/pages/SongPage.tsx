import { Link, useParams } from 'react-router-dom'
import releases from '../../../sourceOfTruth/music.json'
import { getLyricsMarkdown } from '../lyricsSource'

type SongEntry = {
  title: string
  slug: string
  trackNumber: number
  url: string
}

type ReleaseEntry = {
  slug: string
  title: string
  byArtist?: string
  coverImage?: string
  songs: SongEntry[]
}

const catalog = releases as ReleaseEntry[]

function sortedSongs(album: ReleaseEntry) {
  return album.songs.slice().sort((a, b) => a.trackNumber - b.trackNumber)
}

export function SongPage() {
  const { albumSlug, songSlug } = useParams<{
    albumSlug: string
    songSlug: string
  }>()

  const album = catalog.find((a) => a.slug === albumSlug)
  const song = album?.songs.find((s) => s.slug === songSlug)

  const lyrics =
    album && song
      ? getLyricsMarkdown(album.slug, song.slug)
      : undefined

  const ordered = album ? sortedSongs(album) : []
  const idx = song ? ordered.findIndex((s) => s.slug === song.slug) : -1
  const prev = idx > 0 ? ordered[idx - 1] : undefined
  const next =
    idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : undefined

  if (!album || !song || lyrics === undefined) {
    return (
      <div className="music-song music-song--center-main">
        <div className="music-song__main">
          <p className="music-song__missing">Page not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="music-song music-song--center-main">
      <p className="music-song__album music-song__album-span">
        <Link className="music-song__album-crumb" to={`/${album.slug}`}>
          {album.title}
        </Link>
        {album.byArtist ? (
          <span className="music-song__artist"> · {album.byArtist}</span>
        ) : null}
      </p>
      {prev ? (
        <div className="music-song__rail music-song__rail--prev">
          <div className="music-song__rail-inner">
            <Link
              className="music-song__skip"
              to={`/${album.slug}/${prev.slug}`}
            >
              ← {prev.title}
            </Link>
          </div>
        </div>
      ) : null}
      <h1 className="music-song__title">{song.title}</h1>
      {next ? (
        <div className="music-song__rail music-song__rail--next">
          <div className="music-song__rail-inner">
            <Link
              className="music-song__skip"
              to={`/${album.slug}/${next.slug}`}
            >
              {next.title} →
            </Link>
          </div>
        </div>
      ) : null}
      <div className="music-song__main-column">
        <pre className="music-song__lyrics">{lyrics}</pre>
        {prev || next ? (
          <nav className="music-song__nav" aria-label="Previous and next track">
            {prev ? (
              <Link
                className="music-song__skip"
                to={`/${album.slug}/${prev.slug}`}
              >
                ← {prev.title}
              </Link>
            ) : null}{' '}
            {next ? (
              <Link
                className="music-song__skip"
                to={`/${album.slug}/${next.slug}`}
              >
                {next.title} →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </div>
  )
}

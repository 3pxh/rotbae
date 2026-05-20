import { Link } from 'react-router-dom'
import releases from '../../../sourceOfTruth/music.json'

type SongEntry = {
  title: string
  trackNumber: number
  url: string
  slug: string
}

type ReleaseEntry = {
  slug: string
  title: string
  url: string
  byArtist?: string
  coverImage?: string
  songs: SongEntry[]
}

const catalog = releases as ReleaseEntry[]

export function ReleasesPage() {
  return (
    <>
      <h1 className="music-main__title">Releases</h1>

      <div className="music-releases">
        {catalog.map((album) => (
          <article className="music-release" key={album.slug}>
            <header className="music-release__head">
              <h2 className="music-release__name">
                <Link to={`/${album.slug}`}>{album.title}</Link>
              </h2>
              <p className="music-release__meta">
                {album.byArtist ? (
                  <span className="music-release__artist">{album.byArtist}</span>
                ) : null}
                {album.byArtist ? (
                  <span aria-hidden className="music-release__meta-sep">
                    {' '}
                    ·{' '}
                  </span>
                ) : null}
                <a
                  className="music-release__play-now"
                  href={album.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PLAY NOW
                </a>
              </p>
            </header>
            <ol>
              {album.songs
                .slice()
                .sort((a, b) => a.trackNumber - b.trackNumber)
                .map((song) => (
                  <li key={song.url}>
                    <Link
                      to={`/${album.slug}/${song.slug}`}
                      rel="noopener noreferrer"
                    >
                      {song.title}
                    </Link>
                  </li>
                ))}
            </ol>
            <a
              className="music-release__more"
              href={album.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              PLAY NOW →
            </a>
          </article>
        ))}
      </div>
    </>
  )
}

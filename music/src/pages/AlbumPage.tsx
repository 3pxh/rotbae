import { Link, useParams } from 'react-router-dom'
import releases from '../../../sourceOfTruth/music.json'
import { albumCoverPublicPath } from '../albumArt'

type SongEntry = {
  title: string
  slug: string
  trackNumber: number
  url: string
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

export function AlbumPage() {
  const { albumSlug } = useParams<{ albumSlug: string }>()
  const album = catalog.find((a) => a.slug === albumSlug)
  const coverSrc = album?.coverImage
    ? albumCoverPublicPath(album.coverImage)
    : undefined

  if (!album) {
    return (
      <div className="music-album-layout">
        <Link className="music-song__back" to="/">
          ← Releases
        </Link>
        <div className="music-album__main">
          <p className="music-song__missing">Album not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="music-album-layout">
      <Link className="music-song__back" to="/">
        ← Releases
      </Link>

      <div className="music-album__main">
        {coverSrc ? (
          <img
            className="music-album__cover"
            src={coverSrc}
            alt=""
            width={480}
            height={480}
          />
        ) : null}

        <header className="music-album__head">
          <h1 className="music-album__title">{album.title}</h1>
          <div className="music-album__meta-row">
            {album.byArtist ? (
              <span className="music-album__artist">{album.byArtist}</span>
            ) : null}
            {album.byArtist ? (
              <span aria-hidden className="music-album__artist-sep">
                {' · '}
              </span>
            ) : null}
            <a
              className="music-album__play-inline"
              href={album.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              PLAY NOW →
            </a>
          </div>
        </header>

        <ol className="music-album__tracks">
          {album.songs
            .slice()
            .sort((a, b) => a.trackNumber - b.trackNumber)
            .map((song) => (
              <li key={song.slug}>
                <Link to={`/${album.slug}/${song.slug}`}>{song.title}</Link>
              </li>
            ))}
        </ol>

        <a
          className="music-album__more"
          href={album.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          PLAY NOW →
        </a>
      </div>
    </div>
  )
}

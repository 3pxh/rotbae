const lyricModules = import.meta.glob<string>(
  '../../sourceOfTruth/lyrics/*/*.md',
  { eager: true, query: '?raw', import: 'default' },
)

export function getLyricsMarkdown(
  albumSlug: string,
  songSlug: string,
): string | undefined {
  const suffix = `${albumSlug}/${songSlug}.md`.replace(/\\/g, '/')
  const hit = Object.keys(lyricModules).find((path) =>
    path.replace(/\\/g, '/').endsWith(suffix),
  )
  return hit ? lyricModules[hit] : undefined
}

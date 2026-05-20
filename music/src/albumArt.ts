/** Public URL under Vite base `/music/` for a cover file listed in music.json. */
export function albumCoverPublicPath(coverImagePath: string | undefined): string | undefined {
  if (!coverImagePath) return undefined
  const base = '/music/album-art/'
  const file = coverImagePath.replace(/^.*[/\\]/, '')
  return `${base}${file}`
}

/** Router basename so URLs work on both music.rotbae.com/* and rotbae.com/music/* */
export function getRouterBasename(): string {
  if (typeof window === 'undefined') return '/music'
  const { host, pathname } = window.location
  if (host.startsWith('music.')) return '/'
  if (pathname === '/music' || pathname.startsWith('/music/')) return '/music'
  return '/'
}

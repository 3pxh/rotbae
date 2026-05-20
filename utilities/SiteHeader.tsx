import React from 'react'
import './SiteHeader.css'

export type SiteHeaderNavKey = 'music' | 'projects'

const NAV_ORDER: SiteHeaderNavKey[] = ['music', 'projects']

const NAV_LABELS: Record<SiteHeaderNavKey, string> = {
  music: 'MUSIC',
  projects: 'PROJECTS',
}

export const DEFAULT_SITE_HEADER_NAV_HREFS: Record<SiteHeaderNavKey, string> = {
  music: 'https://music.rotbae.com',
  projects: 'https://project.rotbae.com',
}

export interface SiteHeaderProps {
  brandTitle?: string
  brandHref?: string
  logoSrc?: string
  logoAlt?: string
  logoHref?: string
  activeNav?: SiteHeaderNavKey
  navHrefs?: Partial<Record<SiteHeaderNavKey, string>>
  className?: string
  ariaLabel?: string
}

export function SiteHeader({
  brandTitle = "Hey, I'm ROTBAE",
  brandHref = 'https://rotbae.com',
  logoSrc,
  logoAlt = '',
  logoHref,
  activeNav,
  navHrefs,
  className,
  ariaLabel = 'ROTBAE site',
}: SiteHeaderProps) {
  const merged = { ...DEFAULT_SITE_HEADER_NAV_HREFS, ...navHrefs }
  const rootClass = ['rb-site-header', className].filter(Boolean).join(' ')

  const resolvedLogoHref = logoHref ?? brandHref

  return (
    <header className={rootClass} aria-label={ariaLabel}>
      <div className="rb-site-header__top">
        {logoSrc ? (
          <div
            className="rb-site-header__brand"
            {...(logoAlt ? { 'aria-label': logoAlt } : {})}
          >
            <a
              className="rb-site-header__logo-link"
              href={resolvedLogoHref}
              rel="noopener noreferrer"
            >
              <img className="rb-site-header__logo" src={logoSrc} alt="" />
            </a>
            <a className="rb-site-header__title-link" href={brandHref}>
              {brandTitle}
            </a>
            <a
              className="rb-site-header__logo-link"
              href={resolvedLogoHref}
              rel="noopener noreferrer"
            >
              <img className="rb-site-header__logo" src={logoSrc} alt="" />
            </a>
          </div>
        ) : (
          <a className="rb-site-header__title-link" href={brandHref}>
            {brandTitle}
          </a>
        )}
      </div>
      <nav className="rb-site-header__nav" aria-label="Site sections">
        {NAV_ORDER.map((key, index) => (
          <React.Fragment key={key}>
            {index > 0 ? (
              <span className="rb-site-header__sep" aria-hidden>
                ||
              </span>
            ) : null}
            <a
              className={
                activeNav === key
                  ? 'rb-site-header__link rb-site-header__link--active'
                  : 'rb-site-header__link'
              }
              href={merged[key]}
              rel="noopener noreferrer"
              {...(activeNav === key ? { 'aria-current': 'page' as const } : {})}
            >
              {NAV_LABELS[key]}
            </a>
          </React.Fragment>
        ))}
      </nav>
    </header>
  )
}

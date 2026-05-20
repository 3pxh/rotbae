import { SiteHeader } from '@utilities/SiteHeader'
import './App.css'

const PROJECT_ROWS = [
  [
    { name: 'Void', href: 'https://void.rotbae.com' },
    { name: 'Patterns', href: 'https://patterns.rotbae.com' },
  ],
  [
    { name: 'AiorNot', href: 'https://aiornot.rotbae.com' },
    { name: 'Baeday', href: 'https://baeday.rotbae.com' },
  ],
] as const

function App() {
  return (
    <div className="project-app">
      <SiteHeader
        activeNav="projects"
        logoSrc="/project/home.png"
        logoAlt="ROTBAE"
      />
      <main className="project-main">
        <h1 className="project-main__title">~~ Projects ~~</h1>
        <div className="project-rows">
          {PROJECT_ROWS.map((row, rowIndex) => (
            <p key={rowIndex} className="project-row">
              {row.map((link, linkIndex) => (
                <span key={link.href}>
                  {linkIndex > 0 ? ' ' : null}
                  <a
                    className="project-row__link"
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.name}
                  </a>
                </span>
              ))}
            </p>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App

import './App.css'

function App() {
  const playlistId = 'PLsPEBqR2yutSe059XsxSPNW4465PKOrWM'

  // Site map links - update with your actual routes
  const siteMapLinks = [
    { name: 'store', path: 'https://rotbae.printify.me/', icon: '/home/store.svg', external: true },
    { name: 'stream', path: '/stream', icon: '/home/stream.svg' },
    { name: 'drops', path: '/drops', icon: '/home/drops.svg' },
    { name: 'void', path: '/void', icon: '/home/void.svg' },
  ]

  return (
    <div className="app-container">
      <div className="youtube-section">
        <div className="youtube-wrapper">
          <iframe
            src={`https://www.youtube.com/embed/videoseries?list=${playlistId}`}
            title="YouTube playlist player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="youtube-iframe"
          ></iframe>
        </div>
      </div>
      <div className="bottom-section">
        <div className="sitemap-section">
          <h2>
            <a href="https://rotbae.com" className="sitemap-heading-link">
              <img src="/home/home.png" alt="" className="sitemap-heading-icon" />
              rotbae
            </a>
          </h2>
          <nav>
            <ul className="sitemap-list">
              {siteMapLinks.map((link) => (
                <li key={link.path}>
                  <a href={link.path} target={link.external ? '_blank' : undefined} rel={link.external ? 'noopener noreferrer' : undefined}>
                    <img src={link.icon} alt="" className="sitemap-icon" />
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="content-section">
          <h1>hey bae,</h1>
          <p>
            stay and listen?
          </p>
          <p>
            check out the art.
          </p>
          <p>
            buy something, like a bit of void. or don't.
          </p>
          <p>
            love ya,
          </p>
          <p>
            rotbae
          </p>
        </div>
      </div>
    </div>
  )
}

export default App


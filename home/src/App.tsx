import './App.css'

function App() {
  const playlistId = 'PLsPEBqR2yutSe059XsxSPNW4465PKOrWM'

  // Site map links - update with your actual routes
  const siteMapLinks = [
    { name: 'STORE', path: 'https://rotbae.printify.me/', external: true },
    { name: 'STREAM', path: '/stream' },
    { name: 'DROPS', path: '/drops' },
    { name: 'VOID', path: '/void' },
    { name: 'PATTERNS', path: '/patterns' },
  ]

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <h1 className="header-title">ROTBAE&copy;</h1>
        <div className="header-info">
          <p className="header-text">EST. 2024</p>
          <p className="header-text">SECTOR 7G</p>
        </div>
      </header>

      {/* Marquee */}
      <div className="marquee">
        <div className="marquee-content">
          STAY AND LISTEN // CHECK OUT THE ART // BUY SOMETHING // OR DON'T // STAY AND LISTEN // CHECK OUT THE ART // BUY SOMETHING // OR DON'T
        </div>
      </div>

      {/* YouTube Section */}
      <section className="youtube-section">
        <div className="youtube-wrapper">
          <iframe
            src={`https://www.youtube.com/embed/videoseries?list=${playlistId}`}
            title="YouTube playlist player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="youtube-iframe"
          ></iframe>
          <div className="youtube-status">
            <span className="status-text">STATUS: ONLINE</span>
            <span className="status-text status-recording">RECORDING...</span>
          </div>
        </div>
      </section>

      {/* Manifesto */}
      <section className="manifesto-section">
        <p className="manifesto-text">
          "HEY BAE, STAY AND LISTEN? CHECK OUT THE ART. BUY SOMETHING, LIKE A BIT OF VOID. OR DON'T. LOVE YA, ROTBAE"
        </p>
      </section>

      {/* Navigation Grid */}
      <section className="nav-section">
        <div className="nav-header">
          <h2 className="nav-title">NAVIGATION_V2.0</h2>
          <span className="nav-tag">[CLICK_TO_ACCESS]</span>
        </div>
        <div className="nav-grid">
          {siteMapLinks.map((link) => (
            <a
              key={link.path}
              href={link.path}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              className="nav-card"
            >
              <div className="nav-card-content">
                <h3 className="nav-card-title">{link.name}</h3>
                <span className="nav-card-arrow">→</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-left">
          <p>ROTBAE INTERNATIONAL</p>
          <p>NO RIGHTS RESERVED.</p>
        </div>
        <div className="footer-right">
          <a href="#" className="footer-link">INSTAGRAM</a>
          <a href="#" className="footer-link">TWITTER</a>
          <a href="#" className="footer-link">DARKWEB</a>
        </div>
      </footer>
    </div>
  )
}

export default App


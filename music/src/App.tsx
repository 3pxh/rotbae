import { Route, Routes } from 'react-router-dom'
import { SiteHeader } from '@utilities/SiteHeader'
import { AlbumPage } from './pages/AlbumPage'
import { ReleasesPage } from './pages/ReleasesPage'
import { SongPage } from './pages/SongPage'
import './App.css'

function App() {
  return (
    <div className="music-app">
      <SiteHeader
        activeNav="music"
        logoSrc="/music/home.png"
        logoAlt="ROTBAE"
      />
      <main className="music-main">
        <Routes>
          <Route path="/" element={<ReleasesPage />} />
          <Route path=":albumSlug/:songSlug" element={<SongPage />} />
          <Route path=":albumSlug" element={<AlbumPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

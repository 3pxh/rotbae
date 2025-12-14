import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import { SymmetryAttractorPage } from './pages/SymmetryAttractorPage'
import { SymmetricFractalProgramPage } from './pages/SymmetricFractalProgramPage'
import { SquareQuiltPage } from './pages/SquareQuiltPage'

interface PatternLink {
  name: string
  slug: string
  image: string
  description?: string
}

const patterns: PatternLink[] = [
  {
    name: 'Symmetric Icon',
    slug: 'symmetry-attractor',
    image: '/patterns/symmetric-icon.png',
    description: 'A web-based implementation of a BASIC fractal attractor generation program.',
  },
  {
    name: 'Symmetric Fractal Program',
    slug: 'symmetric-fractal-program',
    image: '/patterns/symmetric-fractal.png',
    description: 'Iterated Function System fractal generator with rotational and reflectional symmetry.',
  },
  {
    name: 'Square Quilt',
    slug: 'square-quilt',
    image: '/patterns/square-quilt.svg',
    description: 'BASIC fractal generator creating periodic quilt-like patterns.',
  },
]

function PatternsGrid() {
  return (
    <div className="app">
      <div className="patterns-header">
        <h1 className="patterns-title">Symmetry in Chaos</h1>
        <p className="patterns-author">Field and Golubitsky</p>
      </div>
      <div className="patterns-grid">
        {patterns.map((pattern) => (
          <Link
            key={pattern.slug}
            to={`/${pattern.slug}`}
            className="pattern-link"
            aria-label={`View ${pattern.name}`}
          >
            <div className="pattern-image-container">
              <img
                src={pattern.image}
                alt={pattern.name}
                className="pattern-image"
              />
            </div>
            <div className="pattern-name">{pattern.name}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename="/patterns">
      <Routes>
        <Route path="/" element={<PatternsGrid />} />
        <Route path="/symmetry-attractor" element={<SymmetryAttractorPage />} />
        <Route path="/symmetric-fractal-program" element={<SymmetricFractalProgramPage />} />
        <Route path="/square-quilt" element={<SquareQuiltPage />} />
        <Route path="/square-quilts" element={<SquareQuiltPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App


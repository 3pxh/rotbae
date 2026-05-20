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
    image: 'https://i.imgur.com/fGBPcpy.jpg',
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
    image: '/patterns/square-quilt.png',
    description: 'Enhanced square quilt with speed, opacity, and color controls.',
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
  // Detect if we're accessed via subdomain (patterns.rotbae.com/) or path (rotbae.com/patterns/)
  // If pathname starts with /patterns, we're in path-based mode, otherwise subdomain mode
  const pathname = window.location.pathname;
  const basename = pathname.startsWith('/patterns') ? '/patterns' : '';

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<PatternsGrid />} />
        <Route path="/symmetry-attractor" element={<SymmetryAttractorPage />} />
        <Route path="/symmetric-fractal-program" element={<SymmetricFractalProgramPage />} />
        <Route path="/square-quilt" element={<SquareQuiltPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App


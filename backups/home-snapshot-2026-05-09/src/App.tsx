import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const playlistId = 'PLsPEBqR2yutSe059XsxSPNW4465PKOrWM'
  
  // Define the boxes that can shuffle (excluding buy box at index 2)
  const boxContents = [
    { type: 'text', content: '"HEY BAE, STAY AND LISTEN? CHECK OUT THE ART. BUY SOMETHING, LIKE A BIT OF VOID. OR DON\'T. LOVE YA, ROTBAE"' },
    { type: 'image', src: 'https://i.imgur.com/uZRlNZP.jpeg', alt: 'Content' },
    { type: 'buy' }, // This stays fixed at index 2
    { type: 'image', src: 'https://i.imgur.com/V3nWnGE.jpg', alt: 'Content' },
    { type: 'empty' },
  ]
  
  // State to track the order of boxes (indices 0, 1, 3, 4 shuffle, 2 stays fixed)
  const [boxOrder, setBoxOrder] = useState([0, 1, 3, 4])
  
  useEffect(() => {
    const shuffleArray = (array: number[]) => {
      const shuffled = [...array]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    }
    
    const interval = setInterval(() => {
      setBoxOrder(shuffleArray([0, 1, 3, 4]))
    }, 2500) // Every 2.5 seconds
    
    return () => clearInterval(interval)
  }, [])
  
  // Create the final order with buy box always at index 2
  const finalOrder = [
    boxOrder[0],
    boxOrder[1],
    2, // Buy box always in the middle
    boxOrder[2],
    boxOrder[3],
  ]

  // Site map links - update with your actual routes
  const siteMapLinks = [
    { name: 'VOID', path: 'https://void.rotbae.com', external: true  },
    { name: 'BAEDAY', path: 'https://baeday.rotbae.com', external: true  },
    { name: 'AI OR NOT', path: 'https://aiornot.rotbae.com', external: true  },
    { name: 'PATTERNS', path: 'https://patterns.rotbae.com', external: true  }, 
  ]

  return (
    <div className="app-container">
      {/* Marquee */}
      <div className="marquee">
        <div className="marquee-content">
          ROTBAE // 1. stay // 2. juicy // 3. lazy // 4. cope // 5. double // 6. truth // 7. austere // 8. style // 9. brainrot // 10. yes // ROTBAE // 1. stay // 2. juicy // 3. lazy // 4. cope // 5. double // 6. truth // 7. austere // 8. style // 9. brainrot // 10. yes
        </div>
      </div>

      {/* YouTube Section */}
      <section className="youtube-section">
        <div className="youtube-wrapper">
          <iframe
            src={`https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1&mute=1&loop=1`}
            title="YouTube playlist player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="youtube-iframe"
          ></iframe>
        </div>
      </section>

      {/* Marquee 2 - Reverse Direction */}
      <div className="marquee marquee-reverse">
        <div className="marquee-content marquee-content-reverse">
          STAY AND LISTEN // CHECK OUT THE ART // BUY SOMETHING // OR DON'T // STAY AND LISTEN // CHECK OUT THE ART // BUY SOMETHING // OR DON'T
        </div>
      </div>

      {/* Content Boxes */}
      <section className="content-boxes-section">
        {boxContents.map((box, originalIndex) => {
          const displayIndex = finalOrder.indexOf(originalIndex)
          
          if (box.type === 'text') {
            return (
              <div 
                key={`box-${originalIndex}`} 
                className="content-box content-box-shuffling"
                style={{ order: displayIndex }}
              >
                <p className="content-box-text">{box.content}</p>
              </div>
            )
          } else if (box.type === 'image') {
            return (
              <div 
                key={`box-${originalIndex}`} 
                className="content-box content-box-shuffling"
                style={{ order: displayIndex }}
              >
                <img 
                  src={box.src} 
                  alt={box.alt} 
                  className="content-box-image"
                />
              </div>
            )
          } else if (box.type === 'buy') {
            return (
              <div 
                key={`box-${originalIndex}`} 
                className="content-box"
                style={{ order: displayIndex }}
              >
                <a 
                  href="https://heartbeatsf.printify.me/product/25598773/tower-of-babel-tee" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="buy-button"
                >
                  BUY
                </a>
              </div>
            )
          } else {
            return (
              <div 
                key={`box-${originalIndex}`} 
                className="content-box content-box-shuffling"
                style={{ order: displayIndex }}
              >
                {/* Empty box for future content */}
              </div>
            )
          }
        })}
      </section>

      {/* Navigation Grid */}
      <section className="nav-section">
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
        <div className="nav-section-arrow">↓</div>
      </section>
    </div>
  )
}

export default App


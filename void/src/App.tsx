import { useState, useEffect, useRef } from 'react'
import './App.css'
import { supabase } from './lib/supabase'
import { stripePromise } from './lib/stripe'

interface Pixel {
  x: number
  y: number
  color: 'white' | 'black'
}

function App() {
  const [pixels, setPixels] = useState<Map<string, Pixel>>(new Map())
  const [selectedPixel, setSelectedPixel] = useState<{ x: number; y: number } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editX, setEditX] = useState(0)
  const [editY, setEditY] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingArrow, setProcessingArrow] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load pixels from Supabase on mount
  useEffect(() => {
    loadPixels()
    
    // Check for Stripe redirect after payment
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    const x = params.get('x')
    const y = params.get('y')
    
    if (sessionId && x && y) {
      // Payment was successful, reload pixels to get the updated state
      loadPixels()
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  // Update edit coordinates when selected pixel changes
  useEffect(() => {
    if (selectedPixel) {
      setEditX(selectedPixel.x)
      setEditY(selectedPixel.y)
    }
  }, [selectedPixel])

  // Draw canvas when pixels change
  useEffect(() => {
    drawCanvas()
  }, [pixels])

  // Animate processing arrows
  useEffect(() => {
    if (!isProcessing) {
      setProcessingArrow(0)
      return
    }

    const arrows = ['→', '↓', '←', '↑']
    // Each arrow shows for 250ms with 100ms overlap = 150ms interval between starts
    const interval = setInterval(() => {
      setProcessingArrow((prev) => (prev + 1) % arrows.length)
    }, 150) // 250ms display - 100ms overlap = 150ms interval

    return () => clearInterval(interval)
  }, [isProcessing])

  const loadPixels = async () => {
    try {
      // Load black pixels from Supabase
      const { data, error } = await supabase
        .from('black_pixels')
        .select('x, y')

      if (error) throw error

      const pixelsMap = new Map<string, Pixel>()

      // Initialize all pixels as white
      for (let x = 0; x < 1024; x++) {
        for (let y = 0; y < 1024; y++) {
          pixelsMap.set(`${x},${y}`, { x, y, color: 'white' })
        }
      }

      // Set black pixels from Supabase
      if (data) {
        data.forEach((pixel) => {
          const key = `${pixel.x},${pixel.y}`
          pixelsMap.set(key, { x: pixel.x, y: pixel.y, color: 'black' })
        })
      }

      setPixels(pixelsMap)
    } catch (error) {
      console.error('Error loading pixels from Supabase:', error)
      // Initialize with all white pixels on error
      const pixelsMap = new Map<string, Pixel>()
      for (let x = 0; x < 1024; x++) {
        for (let y = 0; y < 1024; y++) {
          pixelsMap.set(`${x},${y}`, { x, y, color: 'white' })
        }
      }
      setPixels(pixelsMap)
    }
  }


  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 1024, 1024)

    // Draw pixels
    pixels.forEach((pixel) => {
      ctx.fillStyle = pixel.color === 'white' ? '#ffffff' : '#000000'
      ctx.fillRect(pixel.x, pixel.y, 1, 1)
    })
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) * (1024 / rect.width))
    const y = Math.floor((e.clientY - rect.top) * (1024 / rect.height))

    if (x >= 0 && x < 1024 && y >= 0 && y < 1024) {
      setSelectedPixel({ x, y })
      setIsModalOpen(true)
    }
  }

  const getPixelColor = (x: number, y: number): 'white' | 'black' => {
    const key = `${x},${y}`
    return pixels.get(key)?.color || 'white'
  }

  const handleEditXChange = (value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0 && num <= 1023) {
      setEditX(num)
    }
  }

  const handleEditYChange = (value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0 && num <= 1023) {
      setEditY(num)
    }
  }

  const findRandomWhitePixel = (): { x: number; y: number } | null => {
    // Try random pixels up to 1000 times to find a white one
    // This is much faster than iterating through all pixels
    for (let i = 0; i < 1000; i++) {
      const x = Math.floor(Math.random() * 1024)
      const y = Math.floor(Math.random() * 1024)
      if (getPixelColor(x, y) === 'white') {
        return { x, y }
      }
    }
    
    // If we haven't found one after 1000 tries, do a full scan as fallback
    // (in case most pixels are black)
    for (let x = 0; x < 1024; x++) {
      for (let y = 0; y < 1024; y++) {
        if (getPixelColor(x, y) === 'white') {
          return { x, y }
        }
      }
    }
    
    return null
  }

  const handleArrowClick = () => {
    const randomPixel = findRandomWhitePixel()
    if (randomPixel) {
      setSelectedPixel(randomPixel)
      setEditX(randomPixel.x)
      setEditY(randomPixel.y)
    }
  }

  const handleBuy = async () => {
    if (isProcessing) return

    const pixelColor = getPixelColor(editX, editY)
    if (pixelColor !== 'white') return

    setIsProcessing(true)

    try {
      // Call Supabase Edge Function to create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { x: editX, y: editY },
      })

      if (error) {
        // Try to get more details from the error
        console.error('Supabase function error:', error)
        console.error('Error context:', error.context)
        console.error('Error message:', error.message)
        throw error
      }

      if (!data) {
        throw new Error('No data returned from Edge Function')
      }

      // Use checkoutUrl if available (new method), otherwise fall back to sessionId
      const checkoutUrl = data.checkoutUrl || (data.sessionId ? `https://checkout.stripe.com/c/pay/${data.sessionId}` : null)
      
      if (!checkoutUrl) {
        throw new Error('No checkout URL or sessionId returned from Edge Function')
      }

      // Redirect to Stripe Checkout using direct URL (redirectToCheckout is deprecated)
      window.location.href = checkoutUrl
    } catch (error: any) {
      console.error('Error processing payment:', error)
      console.error('Error type:', error?.constructor?.name)
      console.error('Error stack:', error?.stack)
      
      // Try to extract error message from various possible locations
      let errorMessage = 'Failed to process payment. Please try again.'
      
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.error?.message) {
        errorMessage = error.error.message
      } else if (error?.context?.message) {
        errorMessage = error.context.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      // If it's a FunctionsHttpError, try to get the response body
      if (error?.context?.body) {
        try {
          const body = typeof error.context.body === 'string' 
            ? JSON.parse(error.context.body) 
            : error.context.body
          if (body?.error || body?.details) {
            errorMessage = body.details || body.error || errorMessage
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
      
      console.error('Full error details:', JSON.stringify(error, null, 2))
      alert(`Payment Error: ${errorMessage}\n\nCheck browser console for details.`)
      setIsProcessing(false)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedPixel(null)
  }

  const currentPixelColor = selectedPixel ? getPixelColor(editX, editY) : 'white'

  return (
    <div className="app">
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={1024}
          height={1024}
          onClick={handleCanvasClick}
          className="main-canvas"
        />
      </div>

      {isModalOpen && selectedPixel && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>
            <div className="pixel-preview" style={{ backgroundColor: currentPixelColor === 'white' ? '#ffffff' : '#000000' }} />
            <div className="pixel-coords">
              <span>x:</span><input type="number" value={editX} onChange={(e) => handleEditXChange(e.target.value)} min={0} max={1023} className="coord-input" />
              <span>y:</span><input type="number" value={editY} onChange={(e) => handleEditYChange(e.target.value)} min={0} max={1023} className="coord-input" />
            </div>
            <button
              className={`buy-button ${currentPixelColor === 'black' && !isProcessing ? 'buy-button-black' : ''}`}
              onClick={currentPixelColor === 'black' ? handleArrowClick : handleBuy}
              disabled={isProcessing || (currentPixelColor === 'white' && false)}
            >
              {isProcessing ? (
                <>
                  {processingArrow === 0 && '→'}
                  {processingArrow === 1 && '↓'}
                  {processingArrow === 2 && '←'}
                  {processingArrow === 3 && '↑'}
                </>
              ) : currentPixelColor === 'black' ? '→' : '$1'}
            </button>
          </div>
        </div>
      )}
      </div>
  )
}

export default App

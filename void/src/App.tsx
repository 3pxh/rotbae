import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import { supabase } from './lib/supabase'

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
  const [isLoading, setIsLoading] = useState(true)
  const [processingArrow, setProcessingArrow] = useState(0)
  const [loadingArrow, setLoadingArrow] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isUpdatingFromSelectedPixel = useRef(false)

  // Parse URL coordinates from query parameters
  const parseUrlCoordinates = (): { x: number; y: number } | null => {
    const params = new URLSearchParams(window.location.search)
    const xStr = params.get('x')
    const yStr = params.get('y')
    
    if (xStr && yStr) {
      const x = parseInt(xStr, 10)
      const y = parseInt(yStr, 10)
      if (!isNaN(x) && !isNaN(y) && x >= 0 && x < 1024 && y >= 0 && y < 1024) {
        return { x, y }
      }
    }
    return null
  }

  const updateUrl = (x: number, y: number) => {
    // Use pathname + search to avoid issues with hash or other URL parts
    const url = new URL(window.location.pathname + window.location.search, window.location.origin)
    url.searchParams.set('x', x.toString())
    url.searchParams.set('y', y.toString())
    window.history.pushState({ x, y }, '', url.pathname + url.search)
  }

  const resetUrl = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('x')
    url.searchParams.delete('y')
    window.history.pushState({}, '', url.toString())
  }

  // Load pixels from Supabase on mount and handle URL routing
  useEffect(() => {
    loadPixels()
    
    // Check for Stripe redirect after payment
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    const x = params.get('x')
    const y = params.get('y')
    
    if (sessionId && x && y) {
      // Payment was successful, reload pixels to get the updated state
      // Don't show loading overlay on reload
      const xNum = parseInt(x, 10)
      const yNum = parseInt(y, 10)
      
      if (xNum >= 0 && xNum < 1024 && yNum >= 0 && yNum < 1024) {
        // Set selected pixel and open modal to show the purchased pixel
        setSelectedPixel({ x: xNum, y: yNum })
        setEditX(xNum)
        setEditY(yNum)
        setIsModalOpen(true)
        
        // Reload pixels to get the updated state
        const reloadPixels = async () => {
          try {
            const { data, error } = await supabase
              .from('black_pixels')
              .select('x, y')
            if (error) throw error
            const pixelsMap = new Map<string, Pixel>()
            for (let x = 0; x < 1024; x++) {
              for (let y = 0; y < 1024; y++) {
                pixelsMap.set(`${x},${y}`, { x, y, color: 'white' })
              }
            }
            if (data) {
              data.forEach((pixel) => {
                const key = `${pixel.x},${pixel.y}`
                pixelsMap.set(key, { x: pixel.x, y: pixel.y, color: 'black' })
              })
            }
            setPixels(pixelsMap)
          } catch (error) {
            console.error('Error reloading pixels:', error)
          }
        }
        reloadPixels()
        
        // Clean up URL - remove session_id but keep x and y
        const url = new URL(window.location.href)
        url.searchParams.delete('session_id')
        window.history.replaceState({}, document.title, url.toString())
      } else {
        // Invalid coordinates, remove all params
        const url = new URL(window.location.href)
        url.searchParams.delete('session_id')
        url.searchParams.delete('x')
        url.searchParams.delete('y')
        window.history.replaceState({}, document.title, url.toString())
      }
    } else {
      // Parse URL coordinates on initial load
      const coords = parseUrlCoordinates()
      if (coords) {
        setSelectedPixel(coords)
        setEditX(coords.x)
        setEditY(coords.y)
        setIsModalOpen(true)
      } else {
        // Check if there are invalid x/y params and clean them up
        const xParam = params.get('x')
        const yParam = params.get('y')
        if (xParam || yParam) {
          // Invalid coordinates, clean up URL
          resetUrl()
        }
      }
    }

    // Handle browser back/forward
    const handlePopState = () => {
      const coords = parseUrlCoordinates()
      if (coords) {
        setSelectedPixel(coords)
        setEditX(coords.x)
        setEditY(coords.y)
        setIsModalOpen(true)
      } else {
        setIsModalOpen(false)
        setSelectedPixel(null)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Update edit coordinates when selected pixel changes
  useEffect(() => {
    if (selectedPixel) {
      setEditX(selectedPixel.x)
      setEditY(selectedPixel.y)
      // Update URL immediately with selected pixel coordinates
      updateUrl(selectedPixel.x, selectedPixel.y)
    }
  }, [selectedPixel])

  // Track if we're updating from selectedPixel to prevent race condition
  useEffect(() => {
    if (selectedPixel) {
      isUpdatingFromSelectedPixel.current = true
      // Reset flag after state updates complete
      setTimeout(() => {
        isUpdatingFromSelectedPixel.current = false
      }, 0)
    }
  }, [selectedPixel])

  // Update URL when editX/editY are manually changed in the modal
  useEffect(() => {
    if (isModalOpen && selectedPixel && !isUpdatingFromSelectedPixel.current) {
      // Only update URL if the edited coordinates are different from selectedPixel
      // and represent a valid pixel
      if ((editX !== selectedPixel.x || editY !== selectedPixel.y) &&
          editX >= 0 && editX < 1024 && editY >= 0 && editY < 1024) {
        updateUrl(editX, editY)
      }
    }
  }, [editX, editY, isModalOpen, selectedPixel])

  // Draw canvas when pixels change
  useEffect(() => {
    if (pixels.size > 0) {
      drawCanvas()
      // Hide loading overlay immediately after drawing (canvas will be visible)
      if (isLoading) {
        setIsLoading(false)
      }
    }
  }, [pixels, isLoading, drawCanvas])

  // Animate processing arrows for payment processing (original speed)
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

  // Animate loading arrows for initial page load (2x speed)
  useEffect(() => {
    if (!isLoading) {
      setLoadingArrow(0)
      return
    }

    const arrows = ['→', '↓', '←', '↑']
    // Each arrow shows for 125ms with 50ms overlap = 75ms interval between starts (2x speed)
    const interval = setInterval(() => {
      setLoadingArrow((prev) => (prev + 1) % arrows.length)
    }, 75) // 125ms display - 50ms overlap = 75ms interval (doubled speed)

    return () => clearInterval(interval)
  }, [isLoading])

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
      // Don't set isLoading to false here - let the drawCanvas useEffect handle it
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
      // Don't set isLoading to false here - let the drawCanvas useEffect handle it
    }
  }


  const drawCanvas = useCallback(() => {
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
  }, [pixels])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) * (1024 / rect.width))
    const y = Math.floor((e.clientY - rect.top) * (1024 / rect.height))

    if (x >= 0 && x < 1024 && y >= 0 && y < 1024) {
      setSelectedPixel({ x, y })
      setIsModalOpen(true)
      // URL will be updated by the selectedPixel useEffect
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
      // URL will be updated by the selectedPixel useEffect
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
    } catch (error: unknown) {
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
        } catch {
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
    resetUrl()
  }

  const currentPixelColor = selectedPixel ? getPixelColor(editX, editY) : 'white'

  return (
    <div className="app">
      <div className={`loading-overlay ${isLoading ? 'loading-overlay-visible' : 'loading-overlay-hidden'}`}>
        <div className="loading-arrows">
          {loadingArrow === 0 && '→'}
          {loadingArrow === 1 && '↓'}
          {loadingArrow === 2 && '←'}
          {loadingArrow === 3 && '↑'}
        </div>
      </div>
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

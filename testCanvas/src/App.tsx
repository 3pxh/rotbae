import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { withDownloadButton, type DownloadableComponentRef } from './withDownloadButton'
import './App.css'

const App = forwardRef<DownloadableComponentRef>((_props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useImperativeHandle(ref, () => ({
    getMergedDataURL: () => {
      const canvas = canvasRef.current
      if (!canvas) return null
      
      try {
        return canvas.toDataURL('image/png')
      } catch (error) {
        console.error('Failed to get canvas data URL:', error)
        return null
      }
    },
    getCanvasElement: () => {
      return canvasRef.current
    }
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      // Set canvas size to match image size
      canvas.width = img.width
      canvas.height = img.height
      
      // Draw the image onto the canvas
      ctx.drawImage(img, 0, 0)
    }
    
    img.onerror = () => {
      console.error('Failed to load test.png')
    }

    // Load the image
    img.src = '/testCanvas/test.png'
  }, [])

  return (
    <div className="app">
      <canvas ref={canvasRef} className="test-canvas" />
    </div>
  )
})

App.displayName = 'App'

export default withDownloadButton(App)


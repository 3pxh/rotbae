import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { withDownloadButton, type DownloadableComponentRef } from '@utilities/withDownloadButton'
import './App.css'

const App = forwardRef<DownloadableComponentRef, {}>((_props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)

  // Calculate days since November 26, 2025 (Pacific time)
  const calculateDaysSince = () => {
    const now = new Date()
    
    // Get date string in Pacific timezone (YYYY-MM-DD format)
    const pacificTodayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
    const [todayYear, todayMonth, todayDate] = pacificTodayStr.split('-').map(Number)
    
    // November 26, 2025 in Pacific timezone  
    const startYear = 2025
    const startMonth = 11
    const startDay = 26
    
    // Simple date difference calculation
    const dateToDays = (year: number, month: number, day: number) => {
      // Convert date to days since a reference point (year 0)
      let days = year * 365 + Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400)
      
      const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
      if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
        monthDays[1] = 29 // Leap year
      }
      
      for (let i = 0; i < month - 1; i++) {
        days += monthDays[i]
      }
      days += day - 1
      
      return days
    }
    
    const startDays = dateToDays(startYear, startMonth, startDay)
    const todayDays = dateToDays(todayYear, todayMonth, todayDate)
    
    return todayDays - startDays
  }

  const daysSince = calculateDaysSince()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Store logical dimensions for use in draw function
    let logicalWidth = 0
    let logicalHeight = 0

    const text = `BAEDAY #${daysSince}`
    const fontFamily = 'system-ui, Avenir, Helvetica, Arial, sans-serif'

    // Set canvas size with device pixel ratio for crisp rendering
    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (container) {
        const dpr = window.devicePixelRatio || 1
        const rect = container.getBoundingClientRect()
        logicalWidth = rect.width
        logicalHeight = rect.height
        canvas.width = logicalWidth * dpr
        canvas.height = logicalHeight * dpr
        canvas.style.width = `${logicalWidth}px`
        canvas.style.height = `${logicalHeight}px`
        ctx.setTransform(1, 0, 0, 1, 0, 0) // Reset transform
        ctx.scale(dpr, dpr)
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Animation parameters
    const animationDuration = 3000 // 3 seconds
    let startTime = performance.now()

    const draw = () => {
      const currentTime = performance.now()
      const elapsed = (currentTime - startTime) % animationDuration
      const progress = elapsed / animationDuration

      // Clear canvas
      ctx.clearRect(0, 0, logicalWidth, logicalHeight)

      // Calculate font size so the entire phrase takes up 4/9 of canvas width
      const targetTextWidth = (logicalWidth * 4) / 9
      
      // Use a base font size to measure the text
      const baseFontSize = 100
      ctx.font = `900 ${baseFontSize}px ${fontFamily}`
      const measuredWidth = ctx.measureText(text).width
      
      // Calculate the scale factor and final font size
      const scaleFactor = targetTextWidth / measuredWidth
      const fontSize = baseFontSize * scaleFactor
      
      // Set font properties with calculated size
      ctx.font = `900 ${fontSize}px ${fontFamily}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const centerX = logicalWidth / 2
      const centerY = logicalHeight / 2
      const gradientWidth = Math.max(logicalWidth, logicalHeight) * 1.5
      
      // Create a horizontal gradient that scrolls to the right
      // The gradient moves across the text creating a scrolling effect
      const scrollOffset = progress * gradientWidth * 2 - gradientWidth
      
      // Horizontal gradient from left to right
      const x0 = centerX - gradientWidth / 2 + scrollOffset
      const y0 = centerY
      const x1 = centerX + gradientWidth / 2 + scrollOffset
      const y1 = centerY

      // Create gradient
      const gradient = ctx.createLinearGradient(
        x0,
        y0,
        x1,
        y1
      )
      gradient.addColorStop(0, '#ff00ff') // Magenta
      gradient.addColorStop(1, '#00ffff') // Cyan

      // Draw text with gradient
      ctx.fillStyle = gradient
      ctx.fillText(text, centerX, centerY)

      animationFrameRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [daysSince])

  // Expose methods for download button
  useImperativeHandle(ref, () => ({
    getMergedDataURL: () => {
      const canvas = canvasRef.current
      if (!canvas) return null
      return canvas.toDataURL('image/png')
    },
    getCanvasElement: () => canvasRef.current
  }))

  return (
    <div className="app-container">
      <canvas ref={canvasRef} className="baeday-canvas" />
    </div>
  )
})

App.displayName = 'App'

// Wrap with download button HOC
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AppWithDownload = withDownloadButton(App as any)
AppWithDownload.displayName = 'AppWithDownload'

export default AppWithDownload

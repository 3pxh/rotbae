import type { IRenderer, RendererContext, RendererResult } from './types'

/**
 * ASCII renderer - converts image to ASCII art using 8pt font grid
 */
export class AsciiRenderer implements IRenderer {
  readonly type = 'ascii' as const
  readonly label = 'ascii'
  readonly defaultEnabled = false

  // ASCII characters from darkest to lightest (12 chars + empty = 13 levels)
  private readonly asciiChars = '.,-~:;!|?$#@'
  private readonly fontSize = 8 // 8pt font
  private readonly charWidth = 8 // Approximate width of 8pt monospace character
  private readonly charHeight = 8 // Approximate height of 8pt monospace character

  canRender(_context: RendererContext): boolean {
    return true // Can always render
  }

  async render(context: RendererContext): Promise<RendererResult> {
    const { ctx, sourceImage, canvas, width, height } = context
    
    // Draw source image to get pixel data
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(sourceImage, 0, 0, width, height)
    
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    
    // Calculate grid dimensions based on 8pt font block size
    const cols = Math.floor(width / this.charWidth)
    const rows = Math.floor(height / this.charHeight)
    
    // Clear canvas and set up for ASCII rendering
    ctx.fillStyle = '#000000' // Black background
    ctx.fillRect(0, 0, width, height)
    
    // Set font to 8pt monospace
    ctx.font = `${this.fontSize}px monospace`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#00FF00' // Terminal green
    
    // Calculate luminosity for each grid cell and render ASCII
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Sample pixels in this grid cell
        const startX = col * this.charWidth
        const startY = row * this.charHeight
        const endX = Math.min(startX + this.charWidth, width)
        const endY = Math.min(startY + this.charHeight, height)
        
        let totalLuminance = 0
        let pixelCount = 0
        
        // Calculate average luminosity for this cell
        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const idx = (y * width + x) * 4
            const r = data[idx]
            const g = data[idx + 1]
            const b = data[idx + 2]
            // Calculate luminance using standard formula
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b
            totalLuminance += luminance
            pixelCount++
          }
        }
        
        const avgLuminance = totalLuminance / pixelCount
        
        // Map luminance to character (13 levels: empty + 12 chars)
        // Divide 0-255 range into 13 buckets
        const level = Math.floor((avgLuminance / 255) * 13)
        
        // Level 0 = empty, levels 1-12 = characters
        if (level > 0) {
          // Map level 1-12 to chars 0-11
          const charIndex = Math.min(level - 1, this.asciiChars.length - 1)
          const char = this.asciiChars[charIndex]
          
          // Draw character at grid position
          ctx.fillText(char, startX, startY)
        }
      }
    }
    
    return {
      dataURL: canvas.toDataURL('image/png'),
      mimeType: 'image/png',
      fileExtension: 'png'
    }
  }
}

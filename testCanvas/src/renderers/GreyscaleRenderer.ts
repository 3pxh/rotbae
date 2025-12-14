import type { IRenderer, RendererContext, RendererResult } from './types'

/**
 * Greyscale renderer - converts image to greyscale
 */
export class GreyscaleRenderer implements IRenderer {
  readonly type = 'greyscale' as const
  readonly label = 'greyscale'
  readonly defaultEnabled = false

  canRender(context: RendererContext): boolean {
    return true // Can always render
  }

  async render(context: RendererContext): Promise<RendererResult> {
    const { ctx, sourceImage, width, height } = context
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    // Draw source image
    ctx.drawImage(sourceImage, 0, 0, width, height)
    
    // Get image data and convert to greyscale
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    
    for (let i = 0; i < data.length; i += 4) {
      // Calculate greyscale value using luminance formula
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const grey = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
      
      data[i] = grey     // R
      data[i + 1] = grey // G
      data[i + 2] = grey // B
      // Alpha channel (data[i + 3]) remains unchanged
    }
    
    // Put modified image data back
    ctx.putImageData(imageData, 0, 0)
    
    return {
      dataURL: context.canvas.toDataURL('image/png'),
      mimeType: 'image/png',
      fileExtension: 'png'
    }
  }
}

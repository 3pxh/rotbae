import type { IRenderer, RendererContext, RendererResult } from './types'

/**
 * Full color renderer - renders the image as-is without transformation
 */
export class FullRenderer implements IRenderer {
  readonly type = 'full' as const
  readonly label = 'full'
  readonly defaultEnabled = true

  canRender(context: RendererContext): boolean {
    return true // Can always render
  }

  async render(context: RendererContext): Promise<RendererResult> {
    const { ctx, sourceImage, width, height } = context
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    // Draw source image directly
    ctx.drawImage(sourceImage, 0, 0, width, height)
    
    return {
      dataURL: context.canvas.toDataURL('image/png'),
      mimeType: 'image/png',
      fileExtension: 'png'
    }
  }
}

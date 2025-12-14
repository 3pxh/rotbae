/**
 * Renderer types and interfaces
 */

export type RendererType = 'full' | 'greyscale' | 'ascii'

export type RendererConfig = {
  type: RendererType
  label: string
  defaultEnabled: boolean
}

export type RendererResult = {
  dataURL: string
  mimeType: string
  fileExtension: string
}

export type RendererContext = {
  sourceImage: HTMLImageElement
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number
}

/**
 * Base interface for all renderers
 */
export interface IRenderer {
  readonly type: RendererType
  readonly label: string
  readonly defaultEnabled: boolean
  
  /**
   * Renders the image using this renderer's transformation
   * @param context - The rendering context with source image and canvas
   * @returns Promise resolving to the rendered result
   */
  render(context: RendererContext): Promise<RendererResult>
  
  /**
   * Checks if this renderer can process the given image
   * @param context - The rendering context
   * @returns true if this renderer can process the image
   */
  canRender(context: RendererContext): boolean
}

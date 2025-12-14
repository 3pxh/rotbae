import type { IRenderer, RendererType } from './types'
import { FullRenderer } from './FullRenderer'
import { GreyscaleRenderer } from './GreyscaleRenderer'
import { AsciiRenderer } from './AsciiRenderer'

/**
 * Registry for all available renderers
 * Centralizes renderer creation and lookup
 */
class RendererRegistry {
  private renderers: Map<RendererType, IRenderer> = new Map()

  constructor() {
    // Register all renderers
    this.register(new FullRenderer())
    this.register(new GreyscaleRenderer())
    this.register(new AsciiRenderer())
  }

  /**
   * Register a new renderer
   */
  register(renderer: IRenderer): void {
    this.renderers.set(renderer.type, renderer)
  }

  /**
   * Get a renderer by type
   */
  get(type: RendererType): IRenderer | undefined {
    return this.renderers.get(type)
  }

  /**
   * Get all registered renderers
   */
  getAll(): IRenderer[] {
    return Array.from(this.renderers.values())
  }

  /**
   * Get renderer configurations for UI
   */
  getConfigs(): Array<{ type: RendererType; label: string; defaultEnabled: boolean }> {
    return this.getAll().map(r => ({
      type: r.type,
      label: r.label,
      defaultEnabled: r.defaultEnabled
    }))
  }
}

// Export singleton instance
export const rendererRegistry = new RendererRegistry()

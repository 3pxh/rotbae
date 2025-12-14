# Renderer System Architecture

## Structure

```
renderers/
├── types.ts              # Type definitions and interfaces
├── FullRenderer.ts       # Full color renderer implementation
├── GreyscaleRenderer.ts  # Greyscale renderer implementation
├── AsciiRenderer.ts      # ASCII art renderer implementation
├── RendererRegistry.ts   # Central registry for all renderers
├── index.ts              # Public API exports
└── README.md             # This file
```

## Key Design Principles

1. **Interface-Based**: All renderers implement `IRenderer` interface
2. **Single Responsibility**: Each renderer handles one transformation
3. **Registry Pattern**: Central registry manages all renderers
4. **Extensibility**: Easy to add new renderers by implementing `IRenderer`
5. **Type Safety**: Full TypeScript support with strict types

## Usage Example

```typescript
import { rendererRegistry, RendererType } from './renderers'

// Get all available renderers
const configs = rendererRegistry.getConfigs()

// Get a specific renderer
const greyscaleRenderer = rendererRegistry.get('greyscale')

// Use a renderer
const context: RendererContext = {
  sourceImage: img,
  canvas: canvas,
  ctx: ctx,
  width: 1024,
  height: 1024
}

const result = await greyscaleRenderer.render(context)
// result.dataURL contains the rendered image
```

## Adding a New Renderer

1. Create a new file (e.g., `SepiaRenderer.ts`)
2. Implement the `IRenderer` interface
3. Register it in `RendererRegistry.ts`

```typescript
export class SepiaRenderer implements IRenderer {
  readonly type = 'sepia' as const
  readonly label = 'sepia'
  readonly defaultEnabled = false

  canRender(context: RendererContext): boolean {
    return true
  }

  async render(context: RendererContext): Promise<RendererResult> {
    // Implementation here
  }
}
```

## Benefits

- **Encapsulation**: Each renderer is self-contained
- **Testability**: Easy to unit test individual renderers
- **Maintainability**: Changes to one renderer don't affect others
- **Scalability**: Simple to add new renderer types
- **Type Safety**: Compile-time checks prevent errors

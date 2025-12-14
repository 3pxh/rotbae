# Adding `withDownloadButton` to Your Canvas

This guide explains how to add the `withDownloadButton` Higher-Order Component (HOC) to your canvas project, enabling users to download their canvas as PNG images with various size options and renderer effects.

## Prerequisites

The `withDownloadButton` utility is located in `/rotbae/utilities/` and includes:
- `withDownloadButton.tsx` - The HOC wrapper
- `DownloadModal.tsx` - The download modal component
- `DownloadModal.css` - Styles for the modal
- `renderers/` - Image renderer system (full, greyscale, ASCII)

## Part 1: Adding to an Existing Project

### Step 1: Configure TypeScript Path Aliases

Edit your project's `tsconfig.app.json` (or `tsconfig.json`):

```json
{
  "compilerOptions": {
    // ... existing options ...
    
    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@utilities/*": ["../utilities/*"]
    }
  },
  "include": ["src", "../utilities"]
}
```

**Key changes:**
- Add `"baseUrl": "."` to enable path mapping
- Add `"paths"` with `"@utilities/*": ["../utilities/*"]` mapping
- Add `"../utilities"` to the `"include"` array

### Step 2: Configure Vite Alias

Edit your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  // ... existing config ...
  resolve: {
    alias: {
      '@utilities': path.resolve(__dirname, '../utilities')
    }
  }
})
```

**Key changes:**
- Import `path` from `'path'`
- Add `resolve.alias` configuration pointing to `../utilities`

### Step 3: Install Dependencies

Ensure you have `jszip` installed (required for ZIP downloads):

```bash
npm install jszip
npm install --save-dev @types/jszip
```

### Step 4: Wrap Your Canvas Component

Your canvas component needs to:
1. Use `forwardRef` to expose a ref
2. Implement the `DownloadableComponentRef` interface
3. Be wrapped with `withDownloadButton`

**Example:**

```typescript
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { withDownloadButton, type DownloadableComponentRef } from '@utilities/withDownloadButton'
import './App.css'

const App = forwardRef<DownloadableComponentRef>((_props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Expose methods required by withDownloadButton
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

  // Your canvas rendering logic here
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // ... your drawing code ...
  }, [])

  return (
    <div className="app">
      <canvas ref={canvasRef} className="my-canvas" />
    </div>
  )
})

App.displayName = 'App'

// Wrap with download button HOC
// Note: Type assertion may be needed to handle React types version mismatches in monorepos
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default withDownloadButton(App as any)
```

**Required Interface Methods:**

Your component must implement `DownloadableComponentRef`:

```typescript
interface DownloadableComponentRef {
  getMergedDataURL: () => string | null  // Required: Returns canvas as data URL
  getCanvasElement?: () => HTMLCanvasElement | null  // Optional: Helps with button positioning
}
```

### Step 5: Add CSS for Floating Button (Optional)

If you want to style the floating download button, add to your `App.css`:

```css
.download-button-wrapper {
  position: relative;
  display: inline-block;
}

.download-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 3rem;
  height: 3rem;
  border-radius: 4px;
  background-color: black;
  color: white;
  border: none;
  font-size: 2.4rem;
  cursor: pointer;
  z-index: 100;
  opacity: 0.25;
  transition: opacity 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.download-button:hover,
.download-button-visible {
  opacity: 1;
}
```

## Part 2: Setting Up a New Project

### Step 1: Create New Vite + React + TypeScript Project

```bash
npm create vite@latest my-canvas-project -- --template react-ts
cd my-canvas-project
npm install
```

### Step 2: Install Required Dependencies

```bash
npm install jszip
npm install --save-dev @types/jszip
```

### Step 3: Configure TypeScript

Edit `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "types": ["vite/client"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@utilities/*": ["../utilities/*"]
    },

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src", "../utilities"]
}
```

### Step 4: Configure Vite

Edit `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@utilities': path.resolve(__dirname, '../utilities')
    }
  }
})
```

### Step 5: Create Your Canvas Component

Create `src/App.tsx` following the pattern from Part 1, Step 4.

## Features

The `withDownloadButton` HOC provides:

1. **Floating Download Button**: Appears on canvas hover (configurable opacity/size)
2. **Download Modal**: Opens when button is clicked, showing:
   - **Size Options**: FULL, MAX SQUARE, MAX 16:9, MAX 9:16, CUSTOM
   - **Renderer Options**: Full color, Greyscale, ASCII art
   - **File Naming**: Custom name input with timestamp
   - **Preview**: Live preview with crop outlines
3. **Multiple Downloads**: Automatically creates ZIP when multiple size/renderer combinations are selected

## Troubleshooting

### TypeScript Errors: React Types Mismatch

If you see errors like:
```
Type 'React.ReactNode' is not assignable to type 'import(".../node_modules/@types/react/index").ReactNode'
```

This is a common issue in monorepos with multiple React type definitions. Use a type assertion:

```typescript
export default withDownloadButton(App as any)
```

### Module Not Found: '@utilities/withDownloadButton'

1. Verify `tsconfig.app.json` has the correct `paths` configuration
2. Verify `vite.config.ts` has the correct `alias` configuration
3. Ensure `../utilities` exists relative to your project
4. Restart your TypeScript server and dev server

### Canvas Not Rendering

Ensure your component:
- Uses `forwardRef` correctly
- Implements `getMergedDataURL()` that returns a valid data URL
- Has a canvas element rendered in the DOM

### Button Not Appearing

- Check that your component is wrapped with `withDownloadButton`
- Verify CSS for `.download-button` is loaded
- Check browser console for errors
- Ensure `getCanvasElement()` returns the canvas element (helps with positioning)

## Example: Complete Minimal Setup

```typescript
// src/App.tsx
import { useRef, forwardRef, useImperativeHandle } from 'react'
import { withDownloadButton, type DownloadableComponentRef } from '@utilities/withDownloadButton'

const App = forwardRef<DownloadableComponentRef>((_props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useImperativeHandle(ref, () => ({
    getMergedDataURL: () => canvasRef.current?.toDataURL('image/png') || null,
    getCanvasElement: () => canvasRef.current
  }))

  return <canvas ref={canvasRef} width={800} height={600} />
})

export default withDownloadButton(App as any)
```

## Reference

- **Location**: `/rotbae/utilities/withDownloadButton.tsx`
- **Example Implementation**: `/rotbae/testCanvas/src/App.tsx`
- **Type Definitions**: `/rotbae/utilities/withDownloadButton.tsx` (DownloadableComponentRef interface)

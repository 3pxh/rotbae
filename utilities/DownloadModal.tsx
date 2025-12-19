import React, { useState, useRef, useEffect } from 'react'
import './DownloadModal.css'
import { rendererRegistry, type RendererType } from './renderers'

export type SizeOption = 'FULL' | 'MAX_SQUARE' | 'MAX_16:9' | 'MAX_9:16' | 'CUSTOM'

export interface BackgroundOptions {
  enabled: boolean
  isGradient: boolean
  color1: string
  color2: string
  showLogo: boolean
}

interface DownloadModalProps {
  isOpen: boolean
  onClose: () => void
  imageDataURL: string | null
  isDownloading: boolean
  onDownload: (
    sizes: Array<{ size: SizeOption; width?: number; height?: number }>,
    renderers: RendererType[],
    name: string,
    background: BackgroundOptions
  ) => void
}

interface CropRect {
  x: number
  y: number
  width: number
  height: number
  color: string
}

const SIZE_COLOR_MAP: Record<SizeOption, string> = {
  'FULL': 'white',
  'MAX_SQUARE': 'magenta',
  'MAX_16:9': 'cyan',
  'MAX_9:16': 'yellow',
  'CUSTOM': '#7fff00'
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  imageDataURL,
  isDownloading,
  onDownload,
}) => {
  const [selectedSizes, setSelectedSizes] = useState<Set<SizeOption>>(new Set(['FULL']))
  const [customWidth, setCustomWidth] = useState<number>(1024)
  const [customHeight, setCustomHeight] = useState<number>(1024)
  const [showCustomInputs, setShowCustomInputs] = useState(false)
  const [selectedRenderers, setSelectedRenderers] = useState<Set<RendererType>>(new Set(['full']))
  const [previewRenderer, setPreviewRenderer] = useState<RendererType>('full')
  const [fileName, setFileName] = useState<string>('')
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number } | null>(null)
  const [previewDataURL, setPreviewDataURL] = useState<string | null>(null)
  const [hasBackground, setHasBackground] = useState<boolean>(false)
  const [isGradient, setIsGradient] = useState<boolean>(false)
  const [backgroundColor1, setBackgroundColor1] = useState<string>('#ffffff')
  const [backgroundColor2, setBackgroundColor2] = useState<string>('#000000')
  const [showLogo, setShowLogo] = useState<boolean>(true)
  const imgRef = useRef<HTMLImageElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const rendererConfigs = rendererRegistry.getConfigs()

  // Reset renderer selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedRenderers(new Set(['full']))
      setPreviewRenderer('full')
      setPreviewDataURL(null)
      setHasBackground(false)
      setIsGradient(false)
      setBackgroundColor1('#ffffff')
      setBackgroundColor2('#000000')
      setShowLogo(true)
    }
  }, [isOpen])

  useEffect(() => {
    if (imageDataURL) {
      const img = new Image()
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height })
      }
      img.onerror = () => {
        console.error('Failed to load image for size detection')
      }
      img.src = imageDataURL
    }
  }, [imageDataURL])

  // Helper function to draw logo on canvas
  const drawLogo = async (ctx: CanvasRenderingContext2D, width: number, height: number): Promise<void> => {
    const logoSize = Math.min(width, height) * 0.08 // 8% of smaller dimension
    const padding = logoSize * 0.5
    const x = width - logoSize - padding
    const y = height - logoSize - padding
    
    // Try to load logo image, fallback to text if not found
    const logoImg = new Image()
    logoImg.crossOrigin = 'anonymous'
    
    try {
      // Logo from Imgur
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 2000)
        logoImg.onload = () => {
          clearTimeout(timeout)
          resolve(undefined)
        }
        logoImg.onerror = () => {
          clearTimeout(timeout)
          reject(new Error('Failed to load'))
        }
        logoImg.src = 'https://i.imgur.com/i0sqtIb.jpg'
      })
      
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        // Draw logo image, preserving aspect ratio
        const aspectRatio = logoImg.naturalWidth / logoImg.naturalHeight
        let drawWidth = logoSize
        let drawHeight = logoSize
        if (aspectRatio > 1) {
          drawHeight = logoSize / aspectRatio
        } else {
          drawWidth = logoSize * aspectRatio
        }
        ctx.drawImage(logoImg, x + (logoSize - drawWidth) / 2, y + (logoSize - drawHeight) / 2, drawWidth, drawHeight)
        return
      }
      throw new Error('Image not loaded')
    } catch {
      // Fallback to text if image not found
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(x - padding * 0.5, y - padding * 0.5, logoSize + padding, logoSize + padding)
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.font = `bold ${logoSize * 0.3}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('ROTBAE', x + logoSize / 2, y + logoSize / 2)
    }
  }

  // Update preview when renderer selection or background changes
  useEffect(() => {
    const updatePreview = async () => {
      if (!imageDataURL || !imageSize || !isOpen) {
        setPreviewDataURL(null)
        return
      }

      // Use the preview renderer if it's selected, otherwise use first selected
      const activeRendererType = selectedRenderers.has(previewRenderer) 
        ? previewRenderer 
        : Array.from(selectedRenderers)[0] || 'full'
      
      const renderer = rendererRegistry.get(activeRendererType)
      
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          setPreviewDataURL(imageDataURL)
          return
        }

        try {
          // Apply renderer if available
          if (renderer) {
            const context = {
              sourceImage: img,
              canvas,
              ctx,
              width: img.width,
              height: img.height
            }

            const result = await renderer.render(context)
            
            // Draw background after renderer if enabled
            if (hasBackground) {
              // Create a new canvas to composite background + rendered image
              const finalCanvas = document.createElement('canvas')
              finalCanvas.width = img.width
              finalCanvas.height = img.height
              const finalCtx = finalCanvas.getContext('2d')
              if (finalCtx) {
                // Draw background first
                if (isGradient) {
                  const gradient = finalCtx.createLinearGradient(0, 0, finalCanvas.width, finalCanvas.height)
                  gradient.addColorStop(0, backgroundColor1)
                  gradient.addColorStop(1, backgroundColor2)
                  finalCtx.fillStyle = gradient
                } else {
                  finalCtx.fillStyle = backgroundColor1
                }
                finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)
                
                // Draw rendered image on top
                const renderedImg = new Image()
                await new Promise((resolve) => {
                  renderedImg.onload = resolve
                  renderedImg.src = result.dataURL
                })
                finalCtx.drawImage(renderedImg, 0, 0)
                
                // Draw logo if enabled
                if (showLogo) {
                  await drawLogo(finalCtx, finalCanvas.width, finalCanvas.height)
                }
                
                setPreviewDataURL(finalCanvas.toDataURL('image/png'))
              } else {
                setPreviewDataURL(result.dataURL)
              }
            } else {
              // No background, but might have logo
              if (showLogo) {
                const finalCanvas = document.createElement('canvas')
                finalCanvas.width = img.width
                finalCanvas.height = img.height
                const finalCtx = finalCanvas.getContext('2d')
                if (finalCtx) {
                  const renderedImg = new Image()
                  await new Promise((resolve) => {
                    renderedImg.onload = resolve
                    renderedImg.src = result.dataURL
                  })
                  finalCtx.drawImage(renderedImg, 0, 0)
                  await drawLogo(finalCtx, finalCanvas.width, finalCanvas.height)
                  setPreviewDataURL(finalCanvas.toDataURL('image/png'))
                } else {
                  setPreviewDataURL(result.dataURL)
                }
              } else {
                setPreviewDataURL(result.dataURL)
              }
            }
          } else {
            // No renderer
            if (hasBackground) {
              // Draw background first
              if (isGradient) {
                const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
                gradient.addColorStop(0, backgroundColor1)
                gradient.addColorStop(1, backgroundColor2)
                ctx.fillStyle = gradient
              } else {
                ctx.fillStyle = backgroundColor1
              }
              ctx.fillRect(0, 0, canvas.width, canvas.height)
            }
            
            // Draw image on top
            ctx.drawImage(img, 0, 0)
            
            // Draw logo if enabled
            if (showLogo) {
              await drawLogo(ctx, canvas.width, canvas.height)
            }
            
            setPreviewDataURL(canvas.toDataURL('image/png'))
          }
        } catch (error) {
          console.error('Preview render error:', error)
          setPreviewDataURL(imageDataURL) // Fallback to original
        }
      }
      img.onerror = () => {
        console.error('Failed to load image for preview')
        setPreviewDataURL(imageDataURL)
      }
      img.src = imageDataURL
    }

    updatePreview()
  }, [imageDataURL, imageSize, previewRenderer, selectedRenderers, isOpen, hasBackground, isGradient, backgroundColor1, backgroundColor2, showLogo])

  useEffect(() => {
    if (imgRef.current) {
      const updateDisplaySize = () => {
        const img = imgRef.current
        if (img) {
          setDisplaySize({ width: img.clientWidth, height: img.clientHeight })
        }
      }
      updateDisplaySize()
      window.addEventListener('resize', updateDisplaySize)
      const img = imgRef.current
      img?.addEventListener('load', updateDisplaySize)
      return () => {
        window.removeEventListener('resize', updateDisplaySize)
        img?.removeEventListener('load', updateDisplaySize)
      }
    }
  }, [imageSize, isOpen])

  const calculateCropRect = (size: SizeOption, customWidth?: number, customHeight?: number): CropRect | null => {
    if (!imageSize) return null

    let targetWidth = imageSize.width
    let targetHeight = imageSize.height
    let sourceX = 0
    let sourceY = 0

    switch (size) {
      case 'FULL':
        targetWidth = imageSize.width
        targetHeight = imageSize.height
        sourceX = 0
        sourceY = 0
        break
      case 'MAX_SQUARE':
        targetWidth = Math.min(imageSize.width, imageSize.height)
        targetHeight = targetWidth
        sourceX = Math.floor((imageSize.width - targetWidth) / 2)
        sourceY = Math.floor((imageSize.height - targetHeight) / 2)
        break
      case 'MAX_16:9':
        {
          const aspectRatio = 16 / 9
          const widthForHeight = imageSize.height * aspectRatio
          const heightForWidth = imageSize.width / aspectRatio
          
          if (widthForHeight <= imageSize.width) {
            targetWidth = Math.floor(widthForHeight)
            targetHeight = imageSize.height
          } else {
            targetWidth = imageSize.width
            targetHeight = Math.floor(heightForWidth)
          }
          sourceX = Math.floor((imageSize.width - targetWidth) / 2)
          sourceY = Math.floor((imageSize.height - targetHeight) / 2)
        }
        break
      case 'MAX_9:16':
        {
          const aspectRatio = 9 / 16
          const widthForHeight = imageSize.height * aspectRatio
          const heightForWidth = imageSize.width / aspectRatio
          
          if (widthForHeight <= imageSize.width) {
            targetWidth = Math.floor(widthForHeight)
            targetHeight = imageSize.height
          } else {
            targetWidth = imageSize.width
            targetHeight = Math.floor(heightForWidth)
          }
          sourceX = Math.floor((imageSize.width - targetWidth) / 2)
          sourceY = Math.floor((imageSize.height - targetHeight) / 2)
        }
        break
      case 'CUSTOM':
        if (customWidth && customHeight) {
          targetWidth = Math.min(customWidth, imageSize.width)
          targetHeight = Math.min(customHeight, imageSize.height)
          sourceX = Math.floor((imageSize.width - targetWidth) / 2)
          sourceY = Math.floor((imageSize.height - targetHeight) / 2)
        }
        break
    }

    // Scale to display size
    if (!displaySize || !imageSize) return null
    const scaleX = displaySize.width / imageSize.width
    const scaleY = displaySize.height / imageSize.height

    return {
      x: sourceX * scaleX,
      y: sourceY * scaleY,
      width: targetWidth * scaleX,
      height: targetHeight * scaleY,
      color: 'white' // Will be set based on size
    }
  }

  const getCropRects = (): CropRect[] => {
    if (!imageSize || !displaySize) return []
    
    const sizesArray = Array.from(selectedSizes)
    return sizesArray
      .map((size) => {
        const rect = calculateCropRect(
          size,
          size === 'CUSTOM' ? customWidth : undefined,
          size === 'CUSTOM' ? customHeight : undefined
        )
        if (rect) {
          rect.color = SIZE_COLOR_MAP[size]
        }
        return rect
      })
      .filter((rect): rect is CropRect => rect !== null)
  }

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const cropRects = getCropRects()

  const handleSizeToggle = (size: SizeOption) => {
    const newSelected = new Set(selectedSizes)
    if (newSelected.has(size)) {
      newSelected.delete(size)
      // Ensure at least one size is selected
      if (newSelected.size === 0) {
        newSelected.add('FULL')
      }
    } else {
      newSelected.add(size)
    }
    setSelectedSizes(newSelected)
    setShowCustomInputs(newSelected.has('CUSTOM'))
  }

  const handleRendererToggle = (rendererType: RendererType) => {
    const newSelected = new Set(selectedRenderers)
    if (newSelected.has(rendererType)) {
      // Don't allow unchecking if it's the last one
      if (newSelected.size > 1) {
        newSelected.delete(rendererType)
        // If we're removing the preview renderer, switch to first remaining
        if (previewRenderer === rendererType) {
          setPreviewRenderer(Array.from(newSelected)[0] || 'full')
        }
      }
    } else {
      newSelected.add(rendererType)
      // When checking a renderer, show it in preview
      setPreviewRenderer(rendererType)
    }
    setSelectedRenderers(newSelected)
  }

  const handleDownload = () => {
    if (isDownloading) return // Prevent multiple clicks
    
    const sizesToDownload = Array.from(selectedSizes).map(size => {
      if (size === 'CUSTOM') {
        return { size, width: customWidth, height: customHeight }
      }
      return { size }
    })
    const renderersToDownload = Array.from(selectedRenderers)
    const name = fileName.trim() || 'canvas'
    const background: BackgroundOptions = {
      enabled: hasBackground,
      isGradient: isGradient,
      color1: backgroundColor1,
      color2: backgroundColor2,
      showLogo: showLogo
    }
    onDownload(sizesToDownload, renderersToDownload, name, background)
  }

  // Calculate total number of images
  const totalImages = selectedSizes.size * selectedRenderers.size
  const buttonText = isDownloading 
    ? 'DOWNLOADING...' 
    : totalImages > 1 
      ? `ZIP (${totalImages})` 
      : 'PNG'

  return (
    <div className="download-modal-overlay" onClick={handleBackdropClick}>
      <div className="download-modal-content">
        <button className="download-modal-close" onClick={onClose}>
          ×
        </button>
        <h2 className="download-modal-title">DOWNLOAD</h2>
        {imageDataURL && (
          <div className="download-modal-preview" ref={previewRef}>
            <div className="preview-image-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
              <img 
                ref={imgRef}
                src={previewDataURL || imageDataURL} 
                alt="Canvas preview"
                onLoad={() => {
                  if (imgRef.current) {
                    const img = imgRef.current
                    setDisplaySize({ 
                      width: img.clientWidth, 
                      height: img.clientHeight 
                    })
                  }
                }}
              />
              {cropRects.length > 0 && displaySize && (
                <svg
                  className="crop-overlay"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${displaySize.width}px`,
                    height: `${displaySize.height}px`,
                    pointerEvents: 'none',
                  }}
                >
                  {cropRects.map((rect, index) => (
                    <rect
                      key={index}
                      x={rect.x}
                      y={rect.y}
                      width={rect.width}
                      height={rect.height}
                      fill="none"
                      stroke={rect.color}
                      strokeWidth="3"
                    />
                  ))}
                </svg>
              )}
            </div>
          </div>
        )}
        <div className="download-modal-size-selector">
          <button
            className={`size-option ${selectedSizes.has('FULL') ? 'size-option-active' : ''}`}
            onClick={() => handleSizeToggle('FULL')}
          >
            FULL
          </button>
          <button
            className={`size-option ${selectedSizes.has('MAX_SQUARE') ? 'size-option-active' : ''}`}
            onClick={() => handleSizeToggle('MAX_SQUARE')}
          >
            MAX SQUARE
          </button>
          <button
            className={`size-option ${selectedSizes.has('MAX_16:9') ? 'size-option-active' : ''}`}
            onClick={() => handleSizeToggle('MAX_16:9')}
          >
            MAX 16:9
          </button>
          <button
            className={`size-option ${selectedSizes.has('MAX_9:16') ? 'size-option-active' : ''}`}
            onClick={() => handleSizeToggle('MAX_9:16')}
          >
            MAX 9:16
          </button>
          <button
            className={`size-option ${selectedSizes.has('CUSTOM') ? 'size-option-active' : ''}`}
            onClick={() => handleSizeToggle('CUSTOM')}
          >
            CUSTOM
          </button>
        </div>
        {showCustomInputs && (
          <div className="custom-size-inputs">
            <label>
              Width:
              <input
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(parseInt(e.target.value) || 1024)}
                min="1"
                className="custom-size-input"
              />
            </label>
            <label>
              Height:
              <input
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(parseInt(e.target.value) || 1024)}
                min="1"
                className="custom-size-input"
              />
            </label>
          </div>
        )}
        <div className="renderer-bar">
          <span className="renderer-label">renderer:</span>
          {rendererConfigs.map((config) => (
            <label key={config.type} className="renderer-checkbox">
              <input
                type="checkbox"
                checked={selectedRenderers.has(config.type)}
                onChange={() => handleRendererToggle(config.type)}
              />
              <span>{config.label}</span>
            </label>
          ))}
        </div>
        <div className="background-controls">
          <label className="background-checkbox">
            <input
              type="checkbox"
              checked={hasBackground}
              onChange={(e) => setHasBackground(e.target.checked)}
            />
            <span>background</span>
          </label>
          {hasBackground && (
            <>
              <label className="gradient-checkbox">
                <input
                  type="checkbox"
                  checked={isGradient}
                  onChange={(e) => setIsGradient(e.target.checked)}
                />
                <span>gradient</span>
              </label>
              <div className="background-color-inputs">
                <label className="color-input-label">
                  <span>color 1:</span>
                  <input
                    type="color"
                    value={backgroundColor1}
                    onChange={(e) => setBackgroundColor1(e.target.value)}
                    className="color-input"
                  />
                </label>
                {isGradient && (
                  <label className="color-input-label">
                    <span>color 2:</span>
                    <input
                      type="color"
                      value={backgroundColor2}
                      onChange={(e) => setBackgroundColor2(e.target.value)}
                      className="color-input"
                    />
                  </label>
                )}
              </div>
            </>
          )}
        </div>
        <div className="logo-controls">
          <label className="background-checkbox">
            <input
              type="checkbox"
              checked={showLogo}
              onChange={(e) => setShowLogo(e.target.checked)}
            />
            <span>rotbae logo</span>
          </label>
        </div>
        <div className="download-modal-actions">
          <label className="download-name-input">
            <span>name:</span>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="canvas"
              className="name-input"
            />
          </label>
          <button 
            className={`download-modal-button ${isDownloading ? 'download-modal-button-loading' : ''}`}
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <span className="download-icon">⬇</span>
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}

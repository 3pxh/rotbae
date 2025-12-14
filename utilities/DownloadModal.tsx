import React, { useState, useRef, useEffect } from 'react'
import './DownloadModal.css'
import { rendererRegistry, type RendererType } from './renderers'

export type SizeOption = 'FULL' | 'MAX_SQUARE' | 'MAX_16:9' | 'MAX_9:16' | 'CUSTOM'

interface DownloadModalProps {
  isOpen: boolean
  onClose: () => void
  imageDataURL: string | null
  isDownloading: boolean
  onDownload: (
    sizes: Array<{ size: SizeOption; width?: number; height?: number }>,
    renderers: RendererType[],
    name: string
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
  const imgRef = useRef<HTMLImageElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const rendererConfigs = rendererRegistry.getConfigs()

  // Reset renderer selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedRenderers(new Set(['full']))
      setPreviewRenderer('full')
      setPreviewDataURL(null)
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

  // Update preview when renderer selection changes
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
      if (!renderer) {
        setPreviewDataURL(imageDataURL)
        return
      }

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
          const context = {
            sourceImage: img,
            canvas,
            ctx,
            width: img.width,
            height: img.height
          }

          const result = await renderer.render(context)
          setPreviewDataURL(result.dataURL)
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
  }, [imageDataURL, imageSize, previewRenderer, selectedRenderers, isOpen])

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
    onDownload(sizesToDownload, renderersToDownload, name)
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

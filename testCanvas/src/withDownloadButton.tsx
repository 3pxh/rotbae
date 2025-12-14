import React, { useState, useRef, useEffect } from 'react'
import JSZip from 'jszip'
import { DownloadModal } from './DownloadModal'
import { rendererRegistry, type RendererType } from './renderers'

export interface DownloadableComponentRef {
  getMergedDataURL: () => string | null
  getCanvasElement?: () => HTMLCanvasElement | null
}

export const withDownloadButton = <P extends object>(
  WrappedComponent: React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<DownloadableComponentRef>>
) => {
  const WithDownloadButtonComponent = (props: P) => {
    const appRef = useRef<DownloadableComponentRef>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const [isCanvasHovered, setIsCanvasHovered] = useState(false)
    const [isButtonHovered, setIsButtonHovered] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [imageDataURL, setImageDataURL] = useState<string | null>(null)
    const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 })
    
    const isHovered = isCanvasHovered || isButtonHovered

    useEffect(() => {
      const updateButtonPosition = () => {
        if (!appRef.current || !wrapperRef.current) return

        // Try to get canvas element from the child component
        let canvas: HTMLCanvasElement | null = null
        
        if (appRef.current.getCanvasElement) {
          canvas = appRef.current.getCanvasElement()
        } else {
          // Fallback: find canvas in the wrapper
          canvas = wrapperRef.current.querySelector('canvas')
        }

        if (canvas) {
          const canvasRect = canvas.getBoundingClientRect()
          const wrapperRect = wrapperRef.current.getBoundingClientRect()
          
          // Calculate position relative to wrapper
          const top = canvasRect.top - wrapperRect.top
          const right = wrapperRect.right - canvasRect.right
          
          setButtonPosition({ top, right })
        }
      }

      updateButtonPosition()
      
      // Update on resize
      window.addEventListener('resize', updateButtonPosition)
      // Update after a short delay to ensure canvas is rendered
      const timeoutId = setTimeout(updateButtonPosition, 100)

      return () => {
        window.removeEventListener('resize', updateButtonPosition)
        clearTimeout(timeoutId)
      }
    }, [isHovered, isModalOpen])

    useEffect(() => {
      // Attach hover listeners to canvas element only
      let canvas: HTMLCanvasElement | null = null
      
      if (appRef.current?.getCanvasElement) {
        canvas = appRef.current.getCanvasElement()
      } else if (wrapperRef.current) {
        canvas = wrapperRef.current.querySelector('canvas')
      }

      if (!canvas) return

      const handleMouseEnter = () => setIsCanvasHovered(true)
      const handleMouseLeave = () => setIsCanvasHovered(false)

      canvas.addEventListener('mouseenter', handleMouseEnter)
      canvas.addEventListener('mouseleave', handleMouseLeave)

      return () => {
        canvas?.removeEventListener('mouseenter', handleMouseEnter)
        canvas?.removeEventListener('mouseleave', handleMouseLeave)
      }
    }, [])

    const handleDownloadClick = () => {
      if (appRef.current && appRef.current.getMergedDataURL) {
        const dataURL = appRef.current.getMergedDataURL()
        setImageDataURL(dataURL)
        setIsModalOpen(true)
      }
    }

    const handleDownload = async (
      sizes: Array<{ size: 'FULL' | 'MAX_SQUARE' | 'MAX_16:9' | 'MAX_9:16' | 'CUSTOM'; width?: number; height?: number }>,
      renderers: RendererType[],
      name: string
    ) => {
      if (!imageDataURL || !appRef.current) return

      setIsDownloading(true)
      const img = new Image()
      img.onload = async () => {
        const processSize = (size: 'FULL' | 'MAX_SQUARE' | 'MAX_16:9' | 'MAX_9:16' | 'CUSTOM', customWidth?: number, customHeight?: number) => {
          const canvas = document.createElement('canvas')
          let targetWidth = img.width
          let targetHeight = img.height
          let sourceX = 0
          let sourceY = 0

          // Calculate target dimensions based on selected size
          switch (size) {
            case 'FULL':
              targetWidth = img.width
              targetHeight = img.height
              sourceX = 0
              sourceY = 0
              break
            case 'MAX_SQUARE':
              targetWidth = Math.min(img.width, img.height)
              targetHeight = targetWidth
              sourceX = Math.floor((img.width - targetWidth) / 2)
              sourceY = Math.floor((img.height - targetHeight) / 2)
              break
            case 'MAX_16:9':
              {
                const aspectRatio = 16 / 9
                const widthForHeight = img.height * aspectRatio
                const heightForWidth = img.width / aspectRatio
                
                if (widthForHeight <= img.width) {
                  targetWidth = Math.floor(widthForHeight)
                  targetHeight = img.height
                } else {
                  targetWidth = img.width
                  targetHeight = Math.floor(heightForWidth)
                }
                sourceX = Math.floor((img.width - targetWidth) / 2)
                sourceY = Math.floor((img.height - targetHeight) / 2)
              }
              break
            case 'MAX_9:16':
              {
                const aspectRatio = 9 / 16
                const widthForHeight = img.height * aspectRatio
                const heightForWidth = img.width / aspectRatio
                
                if (widthForHeight <= img.width) {
                  targetWidth = Math.floor(widthForHeight)
                  targetHeight = img.height
                } else {
                  targetWidth = img.width
                  targetHeight = Math.floor(heightForWidth)
                }
                sourceX = Math.floor((img.width - targetWidth) / 2)
                sourceY = Math.floor((img.height - targetHeight) / 2)
              }
              break
            case 'CUSTOM':
              if (customWidth && customHeight) {
                targetWidth = Math.min(customWidth, img.width)
                targetHeight = Math.min(customHeight, img.height)
                sourceX = Math.floor((img.width - targetWidth) / 2)
                sourceY = Math.floor((img.height - targetHeight) / 2)
              }
              break
          }

          canvas.width = targetWidth
          canvas.height = targetHeight
          const ctx = canvas.getContext('2d')
          if (ctx) {
            // Draw the cropped portion from the center
            ctx.drawImage(
              img,
              sourceX, sourceY, targetWidth, targetHeight,
              0, 0, targetWidth, targetHeight
            )
            return { canvas, ctx, width: targetWidth, height: targetHeight }
          }
          return null
        }

        const getSizeLabel = (size: 'FULL' | 'MAX_SQUARE' | 'MAX_16:9' | 'MAX_9:16' | 'CUSTOM', customWidth?: number, customHeight?: number) => {
          if (size === 'FULL') return 'full'
          if (size === 'MAX_SQUARE') return 'max-square'
          if (size === 'MAX_16:9') return 'max-16-9'
          if (size === 'MAX_9:16') return 'max-9-16'
          return `custom-${customWidth}x${customHeight}`
        }

        const timestamp = Date.now()
        const baseName = name || 'canvas'
        const totalFiles = sizes.length * renderers.length

        // Process each size + renderer combination
        const files: Array<{ name: string; data: string; extension: string }> = []

        for (const { size, width: customWidth, height: customHeight } of sizes) {
          const croppedCanvas = processSize(size, customWidth, customHeight)
          if (!croppedCanvas) continue

          const sizeLabel = getSizeLabel(size, customWidth, customHeight)

          for (const rendererType of renderers) {
            const renderer = rendererRegistry.get(rendererType)
            if (!renderer) continue

            try {
              // Create a temporary canvas for the renderer
              const renderCanvas = document.createElement('canvas')
              renderCanvas.width = croppedCanvas.width
              renderCanvas.height = croppedCanvas.height
              const renderCtx = renderCanvas.getContext('2d')
              if (!renderCtx) continue

              // Draw cropped image to render canvas
              renderCtx.drawImage(croppedCanvas.canvas, 0, 0)

              // Create a temporary image from the cropped canvas
              const tempImg = new Image()
              await new Promise((resolve) => {
                tempImg.onload = resolve
                tempImg.src = croppedCanvas.canvas.toDataURL('image/png')
              })

              // Apply renderer transformation
              const context = {
                sourceImage: tempImg,
                canvas: renderCanvas,
                ctx: renderCtx,
                width: croppedCanvas.width,
                height: croppedCanvas.height
              }

              const result = await renderer.render(context)
              
              files.push({
                name: `${baseName}-${sizeLabel}-${rendererType}-${timestamp}`,
                data: result.dataURL,
                extension: result.fileExtension
              })
            } catch (error) {
              console.error(`Error rendering ${rendererType} for ${sizeLabel}:`, error)
            }
          }
        }

        // Download files
        if (totalFiles > 1) {
          // Multiple files: create zip
          const zip = new JSZip()
          for (const file of files) {
            const base64Data = file.data.split(',')[1]
            zip.file(`${file.name}.${file.extension}`, base64Data, { base64: true })
          }
          const zipBlob = await zip.generateAsync({ type: 'blob' })
          const link = document.createElement('a')
          link.download = `${baseName}-${timestamp}.zip`
          link.href = URL.createObjectURL(zipBlob)
          link.click()
          URL.revokeObjectURL(link.href)
        } else if (files.length === 1) {
          // Single file: download directly
          const file = files[0]
          const link = document.createElement('a')
          link.download = `${file.name}.${file.extension}`
          link.href = file.data
          link.click()
        }

        setIsModalOpen(false)
        setIsDownloading(false)
      }
      img.onerror = () => {
        setIsDownloading(false)
      }
      img.src = imageDataURL
    }

    return (
      <div
        ref={wrapperRef}
        className="download-button-wrapper"
      >
        <WrappedComponent {...props} ref={appRef} />
        
        <button
          className={`download-button ${isHovered ? 'download-button-visible' : ''}`}
          onClick={handleDownloadClick}
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
          aria-label="Download canvas"
          style={{
            top: `${buttonPosition.top}px`,
            right: `${buttonPosition.right}px`,
          }}
        >
          ⬇
        </button>

        <DownloadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          imageDataURL={imageDataURL}
          isDownloading={isDownloading}
          onDownload={handleDownload}
        />
      </div>
    )
  }

  WithDownloadButtonComponent.displayName = `withDownloadButton(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`

  return WithDownloadButtonComponent
}


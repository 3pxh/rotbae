import React, { useState, useRef, useEffect } from 'react'
import JSZip from 'jszip'
import { DownloadModal, type BackgroundOptions } from './DownloadModal'
import { rendererRegistry, type RendererType } from './renderers'

export interface DownloadableComponentRef {
  getMergedDataURL: () => string | null
  getCanvasElement?: () => HTMLCanvasElement | null
}

export const withDownloadButton = <P extends Record<string, any> = {}>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  WrappedComponent: React.ComponentType<any>
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
      name: string,
      background: BackgroundOptions
    ) => {
      if (!imageDataURL || !appRef.current) return

      setIsDownloading(true)
      const img = new Image()
      img.onload = async () => {
        const processSize = async (size: 'FULL' | 'MAX_SQUARE' | 'MAX_16:9' | 'MAX_9:16' | 'CUSTOM', customWidth?: number, customHeight?: number) => {
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
          if (!ctx) return null
          
          // Draw the cropped image (background will be added after rendering if needed)
          ctx.drawImage(
            img,
            sourceX, sourceY, targetWidth, targetHeight,
            0, 0, targetWidth, targetHeight
          )
          
          return { canvas, ctx, width: targetWidth, height: targetHeight }
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
          const croppedCanvas = await processSize(size, customWidth, customHeight)
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
              
              // Helper function to draw logo
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
              
              // Apply background and/or logo after rendering if enabled
              let finalDataURL = result.dataURL
              if (background.enabled || background.showLogo) {
                const finalCanvas = document.createElement('canvas')
                finalCanvas.width = croppedCanvas.width
                finalCanvas.height = croppedCanvas.height
                const finalCtx = finalCanvas.getContext('2d')
                if (finalCtx) {
                  // Draw background first if enabled
                  if (background.enabled) {
                    if (background.isGradient) {
                      const gradient = finalCtx.createLinearGradient(0, 0, finalCanvas.width, finalCanvas.height)
                      gradient.addColorStop(0, background.color1)
                      gradient.addColorStop(1, background.color2)
                      finalCtx.fillStyle = gradient
                    } else {
                      finalCtx.fillStyle = background.color1
                    }
                    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)
                  }
                  
                  // Draw rendered image on top
                  const renderedImg = new Image()
                  await new Promise((resolve) => {
                    renderedImg.onload = resolve
                    renderedImg.src = result.dataURL
                  })
                  finalCtx.drawImage(renderedImg, 0, 0)
                  
                  // Draw logo if enabled
                  if (background.showLogo) {
                    await drawLogo(finalCtx, finalCanvas.width, finalCanvas.height)
                  }
                  
                  finalDataURL = finalCanvas.toDataURL('image/png')
                }
              }
              
              files.push({
                name: `${baseName}-${sizeLabel}-${rendererType}-${timestamp}`,
                data: finalDataURL,
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

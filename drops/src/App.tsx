import { useState, useRef } from 'react'
import './App.css'

interface ImageItem {
  id: string
  url: string
  currentStock: number
  originalStock: number
}

interface Drop {
  id: string
  name: string
  images: ImageItem[]
}

function App() {
  const [drops, setDrops] = useState<Drop[]>([])
  const [currentDropId, setCurrentDropId] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentDrop = drops.find((drop) => drop.id === currentDropId)

  const handleAddDrop = () => {
    const newDrop: Drop = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: `Drop ${drops.length + 1}`,
      images: [],
    }
    setDrops((prev) => [...prev, newDrop])
    setCurrentDropId(newDrop.id)
    setSelectedImage(null)
  }

  const handleDropSwitch = (dropId: string) => {
    setCurrentDropId(dropId)
    setSelectedImage(null)
  }

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || !currentDropId) return

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const url = e.target?.result as string
          const randomStock = Math.floor(Math.random() * 5) + 1 // Random 1-5
          const newImage: ImageItem = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            url,
            currentStock: randomStock,
            originalStock: randomStock,
          }
          setDrops((prev) =>
            prev.map((drop) =>
              drop.id === currentDropId
                ? { ...drop, images: [...drop.images, newImage] }
                : drop
            )
          )
        }
        reader.readAsDataURL(file)
      }
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImageClick = (image: ImageItem) => {
    setSelectedImage(image)
  }

  const handleBuy = (image?: ImageItem) => {
    const imageToBuy = image || selectedImage
    if (!imageToBuy || !currentDropId || imageToBuy.currentStock === 0) return

    const newStock = Math.max(0, imageToBuy.currentStock - 1)

    setDrops((prev) => {
      return prev.map((drop) =>
        drop.id === currentDropId
          ? {
              ...drop,
              images: drop.images.map((img) =>
                img.id === imageToBuy.id
                  ? { ...img, currentStock: newStock }
                  : img
              ),
            }
          : drop
      )
    })

    // Update selectedImage if it matches the bought image
    if (selectedImage && selectedImage.id === imageToBuy.id) {
      setSelectedImage({
        ...selectedImage,
        currentStock: newStock,
      })
    }
  }

  const handlePriceButtonClick = (e: React.MouseEvent, image: ImageItem) => {
    e.stopPropagation()
    if (image.currentStock > 0) {
      handleBuy(image)
    }
  }

  const closeModal = () => {
    setSelectedImage(null)
  }

  return (
    <div className="app">
      <div className="drops-header">
        <div className="drops-pills">
          {drops.map((drop) => (
            <button
              key={drop.id}
              className={`drop-pill ${currentDropId === drop.id ? 'active' : ''}`}
              onClick={() => handleDropSwitch(drop.id)}
            >
              {drop.name}
            </button>
          ))}
        </div>
        <button className="add-drop-button" onClick={handleAddDrop}>
          +
        </button>
      </div>

      {currentDrop && (
        <>
          <div className="upload-section">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label htmlFor="image-upload" className="upload-button">
              Upload Images
            </label>
          </div>

          <div className="image-grid">
            {currentDrop.images.map((image) => (
              <div
                key={image.id}
                className={`image-item ${image.currentStock === 0 ? 'out-of-stock' : ''}`}
                onClick={() => handleImageClick(image)}
              >
                <div className="image-wrapper">
                  <img src={image.url} alt={`Image ${image.id}`} />
                  <button
                    className={`price-button ${image.currentStock === 0 ? 'sold-out' : ''}`}
                    onClick={(e) => handlePriceButtonClick(e, image)}
                    disabled={image.currentStock === 0}
                  >
                    $
                  </button>
                  <div className="stock-overlay">
                    {image.currentStock} of {image.originalStock}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedImage && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>
            <img src={selectedImage.url} alt="Selected" className="modal-image" />
            <div className="modal-info">
              <p className="modal-stock">
                Stock: {selectedImage.currentStock} of {selectedImage.originalStock}
              </p>
              <button
                className="buy-button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleBuy()
                }}
                disabled={selectedImage.currentStock === 0}
              >
                Buy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

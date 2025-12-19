import { useState, useRef } from 'react'
import './App.css'

const ANALYSIS_PHASES = {
  phase_1_initialization_and_scanning: [
    "Ingesting visual data...",
    "Scanning image matrix.",
    "Calibrating optical recognition protocols.",
    "Resolution check complete. Proceeding.",
    "Decomposing image into segments.",
    "Loading computer vision models.",
    "Pixel density analysis initialized.",
    "Acquiring target visual.",
    "Adjusting for lighting anomalies.",
    "Input received. Beginning raster scan."
  ],
  phase_2_object_detection_and_identification: [
    "Isolating primary subject.",
    "Edge detection active.",
    "Identifying foreground elements.",
    "Comparing shapes against known database.",
    "Facial features detected. Mapping keypoints.",
    "Separating object from background noise.",
    "Geometry recognition: Positive.",
    "Tagging entity: [Object Name].",
    "Tracing vector paths.",
    "Multiple subjects identified in frame."
  ],
  phase_3_context_and_pattern_recognition: [
    "Analyzing scene composition.",
    "Determining spatial relationships.",
    "Calculating depth of field.",
    "Pattern matching in progress...",
    "Contextualizing visual elements.",
    "Detecting mood and sentiment indicators.",
    "Cross-referencing environmental cues.",
    "Establishing scene topology.",
    "Predicting object trajectory.",
    "Synthesizing visual context."
  ],
  phase_4_text_and_detail_extraction: [
    "Scanning for alphanumeric patterns.",
    "Optical Character Recognition (OCR) active.",
    "Enhancing local contrast for readability.",
    "Deciphering handwritten input.",
    "Extracting metadata.",
    "Translating visual text...",
    "Zooming in on sector 4.",
    "Analyzing fine textures.",
    "Parsing embedded codes.",
    "Texture filtering complete."
  ]
}

const PHASE_KEYS = Object.keys(ANALYSIS_PHASES) as Array<keyof typeof ANALYSIS_PHASES>
const PHASE_DURATION = 7000 / PHASE_KEYS.length // 7 seconds divided by 4 phases

// Hash image and generate deterministic keyframe values
async function hashImageAndGenerateKeyframes(file: File): Promise<{ keyframes: number[], probability: number }> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  
  // Extract 3 values between 0-100 from hash bytes
  const n0 = (hashArray[0] / 255) * 100
  const n1 = (hashArray[1] / 255) * 100
  const n2 = (hashArray[2] / 255) * 100
  
  // Generate last value: 50 +/- up to 9.99 (deterministic from hash)
  const signByte = hashArray[3]
  const offsetByte = hashArray[4]
  const sign = signByte % 2 === 0 ? 1 : -1
  const offset = (offsetByte / 255) * 9.99
  const lastValue = 50 + (sign * offset)
  
  // Generate deterministic probability between 40 and 60 from hash
  const probabilityByte = hashArray[5]
  const probability = 40 + (probabilityByte / 255) * 20
  
  return { 
    keyframes: [50, n0, n1, n2, lastValue],
    probability 
  }
}

// Generate tween array with 15 ticks between each keyframe value
function generateTweenArray(keyframes: number[]): number[] {
  const tweenArray: number[] = []
  
  for (let i = 0; i < keyframes.length - 1; i++) {
    const start = keyframes[i]
    const end = keyframes[i + 1]
    
    // Add the start value
    tweenArray.push(start)
    
    // Add 15 interpolated values between start and end
    for (let j = 1; j <= 15; j++) {
      const t = j / 16 // Interpolation factor (0 to 1)
      const interpolated = start + (end - start) * t
      tweenArray.push(interpolated)
    }
  }
  
  // Add the last keyframe value
  tweenArray.push(keyframes[keyframes.length - 1])
  
  return tweenArray
}

function App() {
  const [image, setImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiProbability, setAiProbability] = useState<number | null>(null)
  const [currentPhrase, setCurrentPhrase] = useState<string>('')
  const [isFinished, setIsFinished] = useState<boolean>(false)
  const [tweenArray, setTweenArray] = useState<number[] | null>(null)
  const [currentTweenIndex, setCurrentTweenIndex] = useState<number>(0)
  const tweenIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      // Hash image and generate keyframes
      const { keyframes, probability } = await hashImageAndGenerateKeyframes(file)
      
      // Generate tween array with 15 ticks between each keyframe
      const tweens = generateTweenArray(keyframes)
      setTweenArray(tweens)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImage(result)
        setIsAnalyzing(true)
        setAiProbability(null)
        setCurrentPhrase('')
        setIsFinished(false)
        setCurrentTweenIndex(0)
        
        // Store probability in closure for use in setTimeout
        const finalProbability = probability
        
        // Animate through tween array over 7 seconds
        const totalDuration = 7000 // 7 seconds
        const intervalDuration = totalDuration / tweens.length
        
        let currentIndex = 0
        tweenIntervalRef.current = setInterval(() => {
          currentIndex++
          if (currentIndex < tweens.length) {
            setCurrentTweenIndex(currentIndex)
          } else {
            // Reached end of tween array
            if (tweenIntervalRef.current) {
              clearInterval(tweenIntervalRef.current)
              tweenIntervalRef.current = null
            }
          }
        }, intervalDuration)
        
        // Cycle through phases
        PHASE_KEYS.forEach((phaseKey, index) => {
          setTimeout(() => {
            const phrases = ANALYSIS_PHASES[phaseKey]
            const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)]
            setCurrentPhrase(randomPhrase)
            
            // On the last phase, set finished and immediately set the probability
            if (index === PHASE_KEYS.length - 1) {
              setTimeout(() => {
                setIsFinished(true)
                // Use deterministic probability from hash
                setAiProbability(finalProbability)
                // Stop tween animation
                if (tweenIntervalRef.current) {
                  clearInterval(tweenIntervalRef.current)
                  tweenIntervalRef.current = null
                }
              }, PHASE_DURATION)
            }
          }, index * PHASE_DURATION)
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleReset = () => {
    // Clear tween interval if running
    if (tweenIntervalRef.current) {
      clearInterval(tweenIntervalRef.current)
      tweenIntervalRef.current = null
    }
    
    setImage(null)
    setIsAnalyzing(false)
    setAiProbability(null)
    setCurrentPhrase('')
    setIsFinished(false)
    setTweenArray(null)
    setCurrentTweenIndex(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="app-container">
      {!image ? (
        <div className="upload-section">
          <button className="upload-button" onClick={handleUploadClick}>
            UPLOAD IMAGE
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div className="analyze-section">
          <div className="image-container">
            <img src={image} alt="Uploaded" className="uploaded-image" />
            {isAnalyzing && (
              <button className="reset-button" onClick={handleReset}>
                RESET
              </button>
            )}
          </div>
          
          {isAnalyzing && (
            <div className="analyze-mode">
              <div className="analyze-title">
                {aiProbability !== null ? 'FINISHED!' : isFinished ? 'FINISHED!' : `ANALYZING: ${currentPhrase || 'ANALYZING...'}`}
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-labels">
                  <span className="label-left">NOT AI</span>
                  <div className="probability-display">
                    {aiProbability !== null 
                      ? `${aiProbability.toFixed(1)}%` 
                      : tweenArray && tweenArray.length > 0
                        ? `${tweenArray[currentTweenIndex].toFixed(1)}%`
                        : '0.0%'}
                  </div>
                  <span className="label-right">AI</span>
                </div>
                <div className="progress-bar-wrapper">
                  <div 
                    className="progress-bar"
                    style={{ 
                      background: `linear-gradient(to right, #ff00ff 0%, #00ffff 100%)`
                    }}
                  >
                    <div 
                      className="progress-indicator"
                      style={{ 
                        left: `${aiProbability !== null 
                          ? aiProbability 
                          : tweenArray && tweenArray.length > 0
                            ? tweenArray[currentTweenIndex]
                            : 0}%`,
                        transform: 'translateX(-50%)'
                      }}
                    />
                  </div>
                </div>
                {aiProbability !== null && (
                  <div className="progress-bar-text">
                    analysis complete: indeterminate
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App


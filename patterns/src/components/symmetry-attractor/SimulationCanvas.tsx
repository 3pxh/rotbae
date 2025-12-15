import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import type { SimulationParams } from './types';
import './SimulationCanvas.css';

interface SimulationCanvasProps {
  params: SimulationParams;
  isRunning: boolean;
  resetTrigger: number;
  clearTrigger: number;
  color: string;
  renderMode: 'chalk' | 'glow' | 'histogram';
  histogramColors: { low: string; mid: string; high: string };
  speed: number;
  resetWithoutClearRef: React.MutableRefObject<boolean>;
}

export interface SimulationCanvasRef {
  getCanvasElement: () => HTMLCanvasElement | null;
}

// Helper to convert hex to {r,g,b}
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
};

// Helper for linear interpolation between two values
const lerp = (start: number, end: number, t: number) => {
    return start * (1 - t) + end * t;
};

export const SimulationCanvas = forwardRef<SimulationCanvasRef, SimulationCanvasProps>(({ 
  params, 
  isRunning, 
  resetTrigger,
  clearTrigger,
  color,
  renderMode,
  histogramColors,
  speed,
  resetWithoutClearRef
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Expose canvas ref to parent
  useImperativeHandle(ref, () => ({
    getCanvasElement: () => canvasRef.current
  }));
  
  // Refs for simulation state to avoid closure staleness in animation loop
  const paramsRef = useRef<SimulationParams>(params);
  const stateRef = useRef({ x: 0.01, y: 0.003, iterations: 0 });
  const reqIdRef = useRef<number | null>(null);
  const colorRef = useRef<string>(color);
  const renderModeRef = useRef<'chalk' | 'glow' | 'histogram'>(renderMode);
  const histogramColorsRef = useRef(histogramColors);
  const speedRef = useRef(speed);
  const frameCounterRef = useRef<number>(0);

  // Histogram Data
  const histogramRef = useRef<Uint32Array | null>(null);
  const maxHitsRef = useRef<number>(0);
  const canvasSizeRef = useRef<{w: number, h: number}>({w: 0, h: 0});

  // Stats (currently unused but kept for potential future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_stats, setStats] = useState({ x: 0, y: 0, iterations: 0 });

  // Update params ref when props change
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    renderModeRef.current = renderMode;
  }, [renderMode]);

  useEffect(() => {
    histogramColorsRef.current = histogramColors;
  }, [histogramColors]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Handle Reset (Positions & Histogram Data)
  useEffect(() => {
    stateRef.current = { x: 0.01, y: 0.003, iterations: 0 };

    // Reset frame counter for consistent speed behavior
    frameCounterRef.current = 0;

    // Clear canvas and histogram buffer on reset (unless resetWithoutClearRef.current is true)
    // Read directly from the ref passed from parent (synchronous access)
    // For histogram mode, clearing the histogram buffer is effectively clearing the canvas
    if (!resetWithoutClearRef.current) {
      // Clear Histogram buffer (important for histogram mode)
      if (histogramRef.current) {
        histogramRef.current.fill(0);
        maxHitsRef.current = 0;
      }

      // Clear canvas (for all modes: chalk, glow, histogram)
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const prevComposite = ctx.globalCompositeOperation;
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = 'black';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = prevComposite;
        }
      }
    }
    // resetWithoutClearRef is a ref and doesn't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger]);

  // Handle Clear (Screen only)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
        // Clear Histogram buffer
        if (histogramRef.current) {
            histogramRef.current.fill(0);
            maxHitsRef.current = 0;
        }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        const prevComposite = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = prevComposite;
      }
    }
  }, [clearTrigger, renderMode]); // Also clear when mode changes

  // Initialization and Resize Observer
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Handle High DPI
        const dpr = window.devicePixelRatio || 1;
        const newW = width * dpr;
        const newH = height * dpr;

        canvas.width = newW;
        canvas.height = newH;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        canvasSizeRef.current = { w: newW, h: newH };
        
        // Re-allocate histogram buffer on resize
        // Size is total pixels
        histogramRef.current = new Uint32Array(Math.ceil(newW * newH));
        maxHitsRef.current = 0;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(dpr, dpr); // Keep dpr scale for chalk/glow modes
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, width, height);
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Main Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    if (reqIdRef.current) {
      cancelAnimationFrame(reqIdRef.current);
    }

    if (!isRunning) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const p = paramsRef.current;
      const s = stateRef.current;
      const currentMode = renderModeRef.current;
      const speedVal = speedRef.current; // 1-100

      // Calculate BATCH_SIZE based on speed and mode
      // Speed 1 = 1 dot per second = 1/60 dots per frame (at 60fps)
      // Speed 100 = ~10M/sec for Histogram = ~166,666/frame
      //           = ~0.3M/sec for Chalk = ~5000/frame
      
      let BATCH_SIZE;
      const FPS = 60; // Approximate frames per second
      
      if (speedVal === 1) {
          // At minimum speed, process 1 point every 60 frames = 1 point per second
          frameCounterRef.current++;
          if (frameCounterRef.current < FPS) {
              BATCH_SIZE = 0; // Skip this frame
          } else {
              BATCH_SIZE = 1; // Process 1 point
              frameCounterRef.current = 0; // Reset counter
          }
      } else {
          // Reset frame counter for speeds > 1
          frameCounterRef.current = 0;
          
          if (currentMode === 'histogram') {
              // Logarithmic scaling for huge range
              // t goes 0 to 1 (but speedVal is now 2-100, so t = (speedVal - 2) / 98)
              const t = (speedVal - 2) / 98;
              const min = 1666; // Speed 2 = ~0.1M/sec
              const max = 250000; // Speed 100 = ~10M/sec
              // Use exponential feel: min * (max/min)^t
              BATCH_SIZE = Math.floor(min * Math.pow(max/min, t));
          } else {
              // Chalk/Glow Mode
              // Linear or gentle curve
              // t goes 0 to 1 (but speedVal is now 2-100, so t = (speedVal - 2) / 98)
              const t = (speedVal - 2) / 98;
              const min = 100; // Speed 2 = ~6k/sec
              const max = 3000; // Speed 100 = ~0.3M/sec
              BATCH_SIZE = Math.floor(min + (max - min) * t);
          }
      }

      const width = canvas.width; // Actual pixels
      const height = canvas.height; // Actual pixels
      
      // Need to handle DPI manually for math to map to pixels
      const dpr = window.devicePixelRatio || 1;
      
      const centerX = width / (2 * dpr); // Logical center for drawing calc
      const centerY = height / (2 * dpr);

      const scaleFactor = Math.min(width/dpr, height/dpr) / (2.5 * p.scale);

      // Determine colors for standard modes
      const hex = colorRef.current;
      const rgb = hexToRgb(hex);
      
      // Configure Context Rendering Mode
      if (currentMode === 'glow') {
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`; 
      } else if (currentMode === 'chalk') {
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;
      }

      for (let k = 0; k < BATCH_SIZE; k++) {
        const { x, y } = s;

        // --- MATH START ---
        const zzbar = x * x + y * y;
        
        // Z^n calculation
        let zReal = x;
        let zImag = y;
        const loopLimit = Math.floor(p.n) - 2;
        
        for (let i = 1; i <= loopLimit; i++) {
            const za = zReal * x - zImag * y;
            const zb = zImag * x + zReal * y;
            zReal = za;
            zImag = zb;
        }

        if (!Number.isFinite(zReal) || !Number.isFinite(zImag)) {
            s.x = (Math.random() - 0.5) * 0.01;
            s.y = (Math.random() - 0.5) * 0.01;
            s.iterations = 0; // Reset iterations on explosion
            continue;
        }

        const zn = x * zReal - y * zImag;
        const pVal = p.lambda + p.alpha * zzbar + p.beta * zn;

        const xNew = pVal * x + p.gamma * zReal - p.omega * y;
        const yNew = pVal * y - p.gamma * zImag + p.omega * x;

        s.x = xNew;
        s.y = yNew;
        s.iterations++;

        // --- TRANSIENT DISCARD ---
        // Book strategy: Discard first ~100-1000 points
        if (s.iterations < 100) continue;

        // --- DRAWING / RECORDING ---
        
        // Logical coordinates
        const plotX = centerX + xNew * scaleFactor;
        const plotY = centerY - yNew * scaleFactor;

        if (currentMode === 'histogram') {
            // Map to physical integer coordinates
            // canvas.width/height are physical. plotX/Y are logical (CSS pixels).
            const physX = Math.floor(plotX * dpr);
            const physY = Math.floor(plotY * dpr);

            if (physX >= 0 && physX < width && physY >= 0 && physY < height && histogramRef.current) {
                const idx = physY * width + physX;
                // Increment counter
                const val = histogramRef.current[idx] + 1;
                histogramRef.current[idx] = val;
                
                // Track max for color scaling (optimization: check max occasionally or on every hit if fast enough)
                if (val > maxHitsRef.current) {
                    maxHitsRef.current = val;
                }
            }
        } else {
             // Standard Drawing (Context API)
             // We draw 1x1 logical pixel rectangles
             if (plotX >= 0 && plotX < width/dpr && plotY >= 0 && plotY < height/dpr) {
                ctx.fillRect(plotX, plotY, 1, 1);
             }
        }
      }

      // --- HISTOGRAM RENDER PASS ---
      // Only runs if mode is histogram.
      if (currentMode === 'histogram' && histogramRef.current && maxHitsRef.current > 0) {
          const buffer = histogramRef.current;
          const max = Math.log(maxHitsRef.current + 1); // Logarithmic scaling base
          
          const imgData = ctx.createImageData(width, height); // Physical pixels
          const data = imgData.data;
          const len = buffer.length;

          // Precompute RGB for user colors
          const cLow = hexToRgb(histogramColorsRef.current.low);
          const cMid = hexToRgb(histogramColorsRef.current.mid);
          const cHigh = hexToRgb(histogramColorsRef.current.high);
          
          for (let i = 0; i < len; i++) {
              const count = buffer[i];
              if (count > 0) {
                  const dataIdx = i * 4;
                  
                  // Logarithmic normalization: 0.0 to 1.0
                  const val = Math.log(count + 1) / max;
                  
                  let r, g, b;

                  // Interpolation Strategy:
                  // 0.0 - 0.33: Black -> Low (Fade in from background)
                  // 0.33 - 0.66: Low -> Mid
                  // 0.66 - 1.0: Mid -> High
                  
                  if (val < 0.33) {
                      const t = val / 0.33;
                      // Fade from black to Low
                      r = lerp(0, cLow.r, t);
                      g = lerp(0, cLow.g, t);
                      b = lerp(0, cLow.b, t);
                  } else if (val < 0.66) {
                      const t = (val - 0.33) / 0.33;
                      // Low to Mid
                      r = lerp(cLow.r, cMid.r, t);
                      g = lerp(cLow.g, cMid.g, t);
                      b = lerp(cLow.b, cMid.b, t);
                  } else {
                      const t = (val - 0.66) / 0.34; // approx remainder
                      // Mid to High
                      r = lerp(cMid.r, cHigh.r, t);
                      g = lerp(cMid.g, cHigh.g, t);
                      b = lerp(cMid.b, cHigh.b, t);
                  }

                  data[dataIdx] = Math.floor(r);
                  data[dataIdx + 1] = Math.floor(g);
                  data[dataIdx + 2] = Math.floor(b);
                  data[dataIdx + 3] = 255; // Alpha
              }
          }
          
          // Reset transformation before putting image data (pixels map 1:1)
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0); 
          ctx.putImageData(imgData, 0, 0);
          ctx.restore();
      }

      // Update React state for stats occasionally
      if (reqIdRef.current && reqIdRef.current % 30 === 0) {
          setStats({ x: s.x, y: s.y, iterations: s.iterations });
      }

      reqIdRef.current = requestAnimationFrame(loop);
    };

    reqIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (reqIdRef.current) {
        cancelAnimationFrame(reqIdRef.current);
      }
    };
  }, [isRunning, resetTrigger]); // Re-init loop if running state or reset changes

  return (
    <div ref={containerRef} className="canvas-container">
       <canvas ref={canvasRef} />
    </div>
  );
});

SimulationCanvas.displayName = 'SimulationCanvas';


import React, { useRef, useEffect, useCallback } from 'react';
import type { IFSParams } from './types';
import './FractalCanvas.css';

interface FractalCanvasProps {
  params: IFSParams;
  setPointCount: React.Dispatch<React.SetStateAction<number>>;
  shouldClear: number;
  onClearComplete: () => void;
  renderMode: 'standard' | 'histogram';
  histogramColors: { low: string; mid: string; high: string };
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

export const FractalCanvas: React.FC<FractalCanvasProps> = ({ 
  params, 
  setPointCount, 
  shouldClear, 
  onClearComplete,
  renderMode,
  histogramColors
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  
  // Simulation state refs to avoid closure staleness in loop
  const posRef = useRef({ x: 0.1, y: -0.01 });
  const paramsRef = useRef(params);
  const renderModeRef = useRef<'standard' | 'histogram'>(renderMode);
  const histogramColorsRef = useRef(histogramColors);

  // Precomputed trig tables
  const trigRef = useRef<{ c: number[], s: number[] }>({ c: [], s: [] });

  // Histogram Data
  const histogramRef = useRef<Uint32Array | null>(null);
  const maxHitsRef = useRef<number>(0);
  const canvasSizeRef = useRef<{w: number, h: number}>({w: 0, h: 0});

  // Update refs when props change
  useEffect(() => {
    paramsRef.current = params;
    
    // Precompute trig values when n changes
    const n = Math.floor(params.n);
    const c = new Array(n);
    const s = new Array(n);
    const pi = Math.PI;
    for (let i = 0; i < n; i++) {
      const angle = (2 * pi * i) / n;
      c[i] = Math.cos(angle);
      s[i] = Math.sin(angle);
    }
    trigRef.current = { c, s };
  }, [params]);

  useEffect(() => {
    renderModeRef.current = renderMode;
  }, [renderMode]);

  useEffect(() => {
    histogramColorsRef.current = histogramColors;
  }, [histogramColors]);

  // Handle manual clear trigger
  useEffect(() => {
    if (shouldClear === 0) return; // Skip initial render
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Reset position
        posRef.current = { x: 0.1, y: -0.01 };
        
        // Clear histogram buffer
        if (histogramRef.current) {
          histogramRef.current.fill(0);
          maxHitsRef.current = 0;
        }
        
        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setPointCount(0);
      }
    }
    onClearComplete();
  }, [shouldClear, onClearComplete, setPointCount]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width; // Physical pixels
    const height = canvas.height; // Physical pixels
    const dpr = window.devicePixelRatio || 1;
    
    // Config from refs
    const p = paramsRef.current;
    const trig = trigRef.current;
    const currentMode = renderModeRef.current;
    
    const cx = width / (2 * dpr); // Logical center
    const cy = height / (2 * dpr);
    const scaleFactor = Math.min(width/dpr, height/dpr) * 0.4 * p.scale; 

    // Batch size: BASIC does 1 per loop. We do many for speed.
    const BATCH_SIZE = currentMode === 'histogram' ? 5000 : 1000;
    
    // Draw points color (only used in standard mode)
    if (currentMode === 'standard') {
      ctx.fillStyle = params.conj === 1 ? '#e879f9' : '#22d3ee'; // Fuchsia for Dn, Cyan for Zn
    }
    
    let { x, y } = posRef.current;
    let pointsDrawn = 0;

    for (let i = 0; i < BATCH_SIZE; i++) {
      // 1. Affine Transformation
      let xnew = p.a11 * x + p.a12 * y + p.b1;
      let ynew = p.a21 * x + p.a22 * y + p.b2;

      // 2. Symmetry Rotation
      const m = Math.floor(Math.random() * p.n);
      
      const x1 = xnew;
      const y1 = ynew;

      const cm = trig.c[m] || 1;
      const sm = trig.s[m] || 0;
      
      xnew = cm * x1 - sm * y1;
      ynew = sm * x1 + cm * y1;

      // 3. Conjugate Symmetry (Reflection)
      if (p.conj === 1) {
        if (Math.random() < 0.5) {
          ynew = -ynew;
        }
      }

      // Update state
      x = xnew;
      y = ynew;

      // Plot coordinates
      const plotX = cx + (x * scaleFactor);
      const plotY = cy - (y * scaleFactor); // Invert Y for screen coords

      if (currentMode === 'histogram') {
        // Map to physical integer coordinates
        const physX = Math.floor(plotX * dpr);
        const physY = Math.floor(plotY * dpr);

        if (physX >= 0 && physX < width && physY >= 0 && physY < height && histogramRef.current) {
          const idx = physY * width + physX;
          const val = histogramRef.current[idx] + 1;
          histogramRef.current[idx] = val;
          
          if (val > maxHitsRef.current) {
            maxHitsRef.current = val;
          }
          pointsDrawn++;
        }
      } else {
        // Standard Drawing (Context API) - use logical coordinates
        const logicalW = width / dpr;
        const logicalH = height / dpr;
        if (plotX >= 0 && plotX < logicalW && plotY >= 0 && plotY < logicalH) {
          ctx.fillRect(plotX, plotY, 1, 1);
          pointsDrawn++;
        }
      }
    }

    posRef.current = { x, y };
    setPointCount(prev => prev + pointsDrawn);

    // --- HISTOGRAM RENDER PASS ---
    if (currentMode === 'histogram' && histogramRef.current && maxHitsRef.current > 0) {
      const buffer = histogramRef.current;
      const max = Math.log(maxHitsRef.current + 1); // Logarithmic scaling
      
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
          // 0.0 - 0.33: Black -> Low
          // 0.33 - 0.66: Low -> Mid
          // 0.66 - 1.0: Mid -> High
          
          if (val < 0.33) {
            const t = val / 0.33;
            r = lerp(0, cLow.r, t);
            g = lerp(0, cLow.g, t);
            b = lerp(0, cLow.b, t);
          } else if (val < 0.66) {
            const t = (val - 0.33) / 0.33;
            r = lerp(cLow.r, cMid.r, t);
            g = lerp(cLow.g, cMid.g, t);
            b = lerp(cLow.b, cMid.b, t);
          } else {
            const t = (val - 0.66) / 0.34;
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
      
      // Reset transformation before putting image data
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); 
      ctx.putImageData(imgData, 0, 0);
      ctx.restore();
    }
    
    requestRef.current = requestAnimationFrame(animate);
  }, [setPointCount, params.conj]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = canvas?.parentElement;
      if (canvas && container) {
        const dpr = window.devicePixelRatio || 1;
        const newW = container.clientWidth * dpr;
        const newH = container.clientHeight * dpr;

        canvas.width = newW;
        canvas.height = newH;
        canvas.style.width = `${container.clientWidth}px`;
        canvas.style.height = `${container.clientHeight}px`;

        canvasSizeRef.current = { w: newW, h: newH };
        
        // Re-allocate histogram buffer on resize
        histogramRef.current = new Uint32Array(Math.ceil(newW * newH));
        maxHitsRef.current = 0;

        const ctx = canvas.getContext('2d');
        if(ctx) {
          ctx.scale(dpr, dpr);
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, container.clientWidth, container.clientHeight);
        }
        setPointCount(0);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    return () => window.removeEventListener('resize', handleResize);
  }, [setPointCount]);

  return (
    <div className="fractal-canvas-container">
      <canvas
        ref={canvasRef}
        className="fractal-canvas"
      />
    </div>
  );
};


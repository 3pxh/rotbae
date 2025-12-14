import React, { useRef, useEffect, useCallback } from 'react';
import type { SquareQuiltParams } from './types';
import './SquareQuiltCanvas.css';

interface SquareQuiltCanvasProps {
  params: SquareQuiltParams;
  setIterates: React.Dispatch<React.SetStateAction<number>>;
  shouldClear: number;
  onClearComplete: () => void;
}

// Color palette from BASIC (colord array)
const COLOR_PALETTE = [
  0, // 0 = black
  8, 6, 1, 9, 3, 11, 2, 10, 5, 13, 4, 12, 14, 7, 15 // Colors 1-15
];

// Convert BASIC color numbers to hex (approximate VGA colors)
const colorToHex = (colorNum: number): string => {
  const colors: Record<number, string> = {
    0: '#000000', // Black
    1: '#0000AA', // Blue
    2: '#00AA00', // Green
    3: '#00AAAA', // Cyan
    4: '#AA0000', // Red
    5: '#AA00AA', // Magenta
    6: '#AA5500', // Brown
    7: '#AAAAAA', // Light Gray
    8: '#555555', // Dark Gray
    9: '#5555FF', // Light Blue
    10: '#55FF55', // Light Green
    11: '#55FFFF', // Light Cyan
    12: '#FF5555', // Light Red
    13: '#FF55FF', // Light Magenta
    14: '#FFFF55', // Yellow
    15: '#FFFFFF', // White
  };
  return colors[colorNum] || '#000000';
};

export const SquareQuiltCanvas: React.FC<SquareQuiltCanvasProps> = ({ 
  params, 
  setIterates,
  shouldClear, 
  onClearComplete 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Simulation state refs
  const posRef = useRef({ x: 0.1, y: 0.334 });
  const paramsRef = useRef(params);
  const iteratesRef = useRef(0);

  // Histogram data for coloring mode
  const mcountRef = useRef<Uint32Array | null>(null);
  const gridSizeRef = useRef({ w: 0, h: 0 });
  const canvasSizeRef = useRef({ w: 0, h: 0 });

  const pi = Math.PI;
  const p2 = 2 * pi;

  // Update refs when props change
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // Handle clear trigger
  useEffect(() => {
    if (shouldClear === 0) return;
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Reset position
        posRef.current = { x: 0.1, y: 0.334 };
        iteratesRef.current = 0;
        
        // Clear histogram
        if (mcountRef.current) {
          mcountRef.current.fill(0);
        }
        
        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    onClearComplete();
  }, [shouldClear, onClearComplete]);

  const iterate = useCallback((x: number, y: number): { xnew: number; ynew: number } => {
    const p = paramsRef.current;
    const sx = Math.sin(p2 * x);
    const sy = Math.sin(p2 * y);
    
    const xnew = (p.lambda + p.alpha * Math.cos(p2 * y)) * sx 
                 - p.omega * sy 
                 + p.beta * Math.sin(2 * p2 * x) 
                 + p.gamma * Math.sin(3 * p2 * x) * Math.cos(2 * p2 * y) 
                 + p.m * x 
                 + p.shift;
    
    const ynew = (p.lambda + p.alpha * Math.cos(p2 * x)) * sy 
                 + p.omega * sx 
                 + p.beta * Math.sin(2 * p2 * y) 
                 + p.gamma * Math.sin(3 * p2 * y) * Math.cos(2 * p2 * x) 
                 + p.m * y 
                 + p.shift;
    
    // Wrap coordinates to [0, 1)
    let wrappedX = xnew;
    let wrappedY = ynew;
    
    if (wrappedX > 1) wrappedX = wrappedX - Math.floor(wrappedX);
    if (wrappedY > 1) wrappedY = wrappedY - Math.floor(wrappedY);
    if (wrappedX < 0) wrappedX = wrappedX + Math.floor(-wrappedX) + 1;
    if (wrappedY < 0) wrappedY = wrappedY + Math.floor(-wrappedY) + 1;
    
    return { xnew: wrappedX, ynew: wrappedY };
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = width / dpr;
    const logicalHeight = height / dpr;
    
    const p = paramsRef.current;
    const nperiod = p.nperiod;
    
    // Initialize histogram grid if needed
    if (!mcountRef.current || gridSizeRef.current.w !== Math.floor(logicalWidth / nperiod) || 
        gridSizeRef.current.h !== Math.floor(logicalHeight / nperiod)) {
      const gridW = Math.floor(logicalWidth / nperiod);
      const gridH = Math.floor(logicalHeight / nperiod);
      gridSizeRef.current = { w: gridW, h: gridH };
      mcountRef.current = new Uint32Array(gridW * gridH);
    }

    // Helper functions from BASIC (modified to use full width)
    const fnxpix = (x: number) => logicalWidth * x / nperiod;
    const fnypix = (y: number) => logicalHeight - logicalHeight * y / nperiod;

    // Batch iterations
    const BATCH_SIZE = 50;
    
    for (let batch = 0; batch < BATCH_SIZE; batch++) {
      const { xnew, ynew } = iterate(posRef.current.x, posRef.current.y);
      posRef.current = { x: xnew, y: ynew };
      iteratesRef.current++;
      
      // Update histogram for coloring mode
      let mxnew = 0;
      let mynew = 0;
      if (p.toggle === 1) {
        mxnew = Math.floor(xnew * logicalWidth / nperiod);
        mynew = Math.floor(ynew * logicalHeight / nperiod);
        
        if (mxnew >= 0 && mxnew < gridSizeRef.current.w && 
            mynew >= 0 && mynew < gridSizeRef.current.h && mcountRef.current) {
          const idx = mynew * gridSizeRef.current.w + mxnew;
          mcountRef.current[idx] = mcountRef.current[idx] + 1;
        }
      }
      
      // Plot points in periodic grid
      for (let i = 0; i < nperiod; i++) {
        for (let j = 0; j < nperiod; j++) {
          const plotX = fnxpix(xnew + i);
          const plotY = fnypix(ynew + j);
          
          // Bounds check (using logical coordinates)
          if (plotX >= 0 && plotX < logicalWidth && plotY >= 0 && plotY < logicalHeight) {
            if (p.toggle === 0) {
              // Standard mode: just plot point
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(Math.floor(plotX * dpr), Math.floor(plotY * dpr), dpr, dpr);
            } else {
              // Coloring mode: use histogram
              if (mxnew >= 0 && mxnew < gridSizeRef.current.w && 
                  mynew >= 0 && mynew < gridSizeRef.current.h && mcountRef.current) {
                const idx = mynew * gridSizeRef.current.w + mxnew;
                const mc = mcountRef.current[idx];
                const colorIdx = mc < 15 ? mc : 15;
                ctx.fillStyle = colorToHex(COLOR_PALETTE[colorIdx] || 0);
                ctx.fillRect(Math.floor(plotX * dpr), Math.floor(plotY * dpr), dpr, dpr);
              }
            }
          }
        }
      }
    }

    // Update iterates count occasionally
    if (iteratesRef.current % 1000 === 0) {
      setIterates(iteratesRef.current);
    }
    
    requestRef.current = requestAnimationFrame(animate);
  }, [iterate, setIterates]);

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

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, container.clientWidth, container.clientHeight);
        }
        
        // Reset histogram grid
        mcountRef.current = null;
        iteratesRef.current = 0;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="square-quilt-canvas-container">
      <canvas
        ref={canvasRef}
        className="square-quilt-canvas"
      />
    </div>
  );
};


import React, { useRef, useEffect, useState, useCallback } from 'react';
import { IFSParams } from '../types';

interface FractalCanvasProps {
  params: IFSParams;
  setPointCount: React.Dispatch<React.SetStateAction<number>>;
  shouldClear: boolean;
  onClearComplete: () => void;
}

const FractalCanvas: React.FC<FractalCanvasProps> = ({ params, setPointCount, shouldClear, onClearComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Simulation state refs to avoid closure staleness in loop
  const posRef = useRef({ x: 0.1, y: -0.01 });
  const paramsRef = useRef(params);

  // Precomputed trig tables
  const trigRef = useRef<{ c: number[], s: number[] }>({ c: [], s: [] });

  // Update refs when props change
  useEffect(() => {
    paramsRef.current = params;
    
    // Precompute trig values when n changes
    const n = Math.floor(params.n);
    const c = new Array(n);
    const s = new Array(n);
    const pi = Math.PI; // BASIC used 355/113, Math.PI is fine
    for (let i = 0; i < n; i++) {
      const angle = (2 * pi * i) / n;
      c[i] = Math.cos(angle);
      s[i] = Math.sin(angle);
    }
    trigRef.current = { c, s };

    // Auto-clear on significant param changes is typical for these apps,
    // but we let the parent control 'shouldClear' to avoid excessive clearing during dragging.
    // However, if n changes, we REALLY should clear because the symmetry breaks.
  }, [params]);

  // Handle manual clear trigger
  useEffect(() => {
    if (shouldClear) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          setPointCount(0);
        }
      }
      onClearComplete();
    }
  }, [shouldClear, onClearComplete, setPointCount]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Config from refs
    const p = paramsRef.current;
    const trig = trigRef.current;
    
    // Canvas mapping logic from BASIC:
    // BASIC: fnxpix(x) = nstartx + scalex * (x + scale)
    // BASIC: fnypix(y) = npixely - scalex * (y + scale)
    // We center it on the canvas.
    // Scale 1 in BASIC means roughly fitting [-1, 1] if ignoring offsets.
    // Let's implement a standard view centered at (0,0).
    const cx = width / 2;
    const cy = height / 2;
    // Base scale multiplier. 
    // If p.scale = 1, we want X=1 to be some reasonable pixels.
    // The BASIC screen was 640 wide. `scalex = (640-160)/(2*1) = 240`.
    // So scale 1 => 240 pixels per unit.
    const scaleFactor = Math.min(width, height) * 0.4 * p.scale; 

    // Batch size: BASIC does 1 per loop. We do many for speed.
    const BATCH_SIZE = 1000;
    
    // Draw points
    ctx.fillStyle = params.conj === 1 ? '#e879f9' : '#22d3ee'; // Fuchsia for Dn, Cyan for Zn
    
    let { x, y } = posRef.current;
    let pointsDrawn = 0;

    for (let i = 0; i < BATCH_SIZE; i++) {
      // 1. Affine Transformation
      // xnew = a11 * x + a12 * y + b1
      // ynew = a21 * x + a22 * y + b2
      let xnew = p.a11 * x + p.a12 * y + p.b1;
      let ynew = p.a21 * x + p.a22 * y + p.b2;

      // 2. Symmetry Rotation
      // m = INT(n * RND)
      const m = Math.floor(Math.random() * p.n);
      
      // x1 = xnew: y1 = ynew
      const x1 = xnew;
      const y1 = ynew;

      // xnew = c(m) * x1 - s(m) * y1
      // ynew = s(m) * x1 + c(m) * y1
      // Safety check for trig arrays
      const cm = trig.c[m] || 1;
      const sm = trig.s[m] || 0;
      
      xnew = cm * x1 - sm * y1;
      ynew = sm * x1 + cm * y1;

      // 3. Conjugate Symmetry (Reflection)
      // IF conj = 0 THEN RETURN (skip)
      if (p.conj === 1) {
        // m = INT(2 * RND)
        // IF m = 1 THEN ynew = -ynew
        if (Math.random() < 0.5) {
          ynew = -ynew;
        }
      }

      // Update state
      x = xnew;
      y = ynew;

      // Plot
      // PSET (fnxpix(x), fnypix(y))
      const px = cx + (x * scaleFactor);
      const py = cy - (y * scaleFactor); // Invert Y for screen coords

      // Bounds check optimization (draw only if on screen)
      if (px >= 0 && px < width && py >= 0 && py < height) {
        ctx.fillRect(px, py, 1, 1);
        pointsDrawn++;
      }
    }

    posRef.current = { x, y };
    setPointCount(prev => prev + pointsDrawn);
    
    requestRef.current = requestAnimationFrame(animate);
  }, [setPointCount, params.conj]); // Removed unnecessary deps to prevent loop recreation

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
        // Save content
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCanvas.getContext('2d')?.drawImage(canvas, 0, 0);

        // Resize
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        // Restore content (optional, or just clear)
        // Usually better to clear on resize for fractals as scale changes
        const ctx = canvas.getContext('2d');
        if(ctx) {
           ctx.fillStyle = '#000000';
           ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        setPointCount(0);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    return () => window.removeEventListener('resize', handleResize);
  }, [setPointCount]);

  return (
    <div className="flex-1 relative bg-black overflow-hidden cursor-crosshair">
      <canvas
        ref={canvasRef}
        className="block absolute top-0 left-0"
      />
    </div>
  );
};

export default FractalCanvas;

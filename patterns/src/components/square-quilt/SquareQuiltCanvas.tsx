import React, { useRef, useEffect, useCallback } from 'react';
import type { SimulationParams } from './types';
import './SquareQuiltCanvas.css';

interface CanvasProps {
  params: SimulationParams;
  isRunning: boolean;
  clearTrigger: number; // Increment to trigger clear
}

export const SquareQuiltCanvas: React.FC<CanvasProps> = ({ params, isRunning, clearTrigger }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const drawRef = useRef<() => void>();
  
  // Simulation state
  const stateRef = useRef({
    x: 0.1,
    y: 0.334,
    iterates: 0
  });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Constants from QBASIC adapted for JS
    const TWO_PI = 2 * Math.PI;
    const { lambda, alpha, beta, gamma, omega, ma, shift, nperiod, speed, color, opacity, pointSize } = params;
    
    // Set style for this batch
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;

    let { x, y } = stateRef.current;

    // Batch process for performance
    for (let k = 0; k < speed; k++) {
      // Calculate trig terms
      // QBASIC: sx = SIN(p2 * x): sy = SIN(p2 * y)
      const sx = Math.sin(TWO_PI * x);
      const sy = Math.sin(TWO_PI * y);
      
      const cos_p2_y = Math.cos(TWO_PI * y);
      const cos_p2_x = Math.cos(TWO_PI * x);
      
      const sin_2_p2_x = Math.sin(2 * TWO_PI * x);
      const sin_2_p2_y = Math.sin(2 * TWO_PI * y);
      
      const sin_3_p2_x = Math.sin(3 * TWO_PI * x);
      const sin_3_p2_y = Math.sin(3 * TWO_PI * y);
      
      const cos_2_p2_y = Math.cos(2 * TWO_PI * y);
      const cos_2_p2_x = Math.cos(2 * TWO_PI * x);

      // QBASIC Logic:
      // xnew = (lambda + alpha * COS(p2 * y)) * sx - omega * sy + beta * SIN(2 * p2 * x) + gamma * SIN(3 * p2 * x) * COS(2 * p2 * y) + ma * x + shift
      const xnew_val = (lambda + alpha * cos_p2_y) * sx 
                     - omega * sy 
                     + beta * sin_2_p2_x 
                     + gamma * sin_3_p2_x * cos_2_p2_y 
                     + ma * x 
                     + shift;

      // ynew = (lambda + alpha * COS(p2 * x)) * sy + omega * sx + beta * SIN(2 * p2 * y) + gamma * SIN(3 * p2 * y) * COS(2 * p2 * x) + ma * y + shift
      const ynew_val = (lambda + alpha * cos_p2_x) * sy 
                     + omega * sx 
                     + beta * sin_2_p2_y 
                     + gamma * sin_3_p2_y * cos_2_p2_x 
                     + ma * y 
                     + shift;

      // Wrap Logic (Unit Square [0, 1])
      // IF xnew > 1 THEN xnew = xnew - INT(xnew) ...
      const xnew = xnew_val - Math.floor(xnew_val);
      const ynew = ynew_val - Math.floor(ynew_val);

      // Update state for next iteration
      x = xnew;
      y = ynew;

      // Plotting Logic (Tiling)
      // DEF fnxpix (x) = nstartx + (npixelx - nstartx) * x / nperiod
      // DEF fnypix (y) = npixely - npixely * y / nperiod
      // We map 0..nperiod to 0..canvasWidth/Height
      
      const w = canvas.width;
      const h = canvas.height;
      
      // We need to plot (x+i, y+j) for i,j in 0..nperiod-1
      for (let i = 0; i < nperiod; i++) {
        for (let j = 0; j < nperiod; j++) {
            // Map (x+i)/nperiod to 0..1 then to screen
            const px = ((x + i) / nperiod) * w;
            // QBASIC y is inverted (npixely - ...), standard canvas is top-left 0,0.
            // The formula `npixely - npixely * y / nperiod` implies Y grows UP.
            const py = h - (h * (y + j) / nperiod);
            
            ctx.fillRect(px, py, pointSize, pointSize);
        }
      }
    }

    stateRef.current.x = x;
    stateRef.current.y = y;
    stateRef.current.iterates += speed;

    if (isRunning) {
      requestRef.current = requestAnimationFrame(drawRef.current!);
    }
  }, [isRunning, params]);

  // Update draw ref when draw function changes
  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  // Handle Resize and Clear
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    
    const resizeObserver = new ResizeObserver(() => {
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            // Reset state slightly to ensure clean restart on resize? Or just clear.
            const ctx = canvas.getContext('2d');
            if (ctx) {
                 ctx.fillStyle = '#0f172a'; // Match bg
                 ctx.fillRect(0,0, canvas.width, canvas.height);
            }
        }
    });

    if (parent) resizeObserver.observe(parent);

    return () => resizeObserver.disconnect();
  }, []);

  // Handle manual clear
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Optionally reset point to initial to restart the pattern from scratch
    stateRef.current = { x: 0.1, y: 0.334, iterates: 0 };
  }, [clearTrigger]);

  // Animation Loop Management
  useEffect(() => {
    if (isRunning && drawRef.current) {
      requestRef.current = requestAnimationFrame(drawRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning]);

  return (
    <canvas 
      ref={canvasRef} 
      className="square-quilt-canvas"
    />
  );
};


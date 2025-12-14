import React, { useState, useCallback } from 'react';
import { SquareQuilt2Canvas } from './SquareQuilt2Canvas';
import { ControlPanel } from './ControlPanel';
import { DEFAULT_PARAMS } from './types';
import type { SimulationParams } from './types';
import './SquareQuilt2.css';

export const SquareQuilt2: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [clearCount, setClearCount] = useState<number>(0);

  const handleClear = useCallback(() => {
    setClearCount(c => c + 1);
  }, []);

  const handleReset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    handleClear();
    setIsRunning(true);
  }, [handleClear]);

  return (
    <div className="square-quilt-2-container">
      {/* Canvas Area */}
      <div className="square-quilt-2-canvas-area">
        <div className="square-quilt-2-canvas-wrapper">
          <SquareQuilt2Canvas 
            params={params} 
            isRunning={isRunning} 
            clearTrigger={clearCount}
          />
        </div>
        
        {/* Overlay Info */}
        <div className="square-quilt-2-overlay">
          <h1 className="square-quilt-2-overlay-title">Symmetric Chaos</h1>
          <p className="square-quilt-2-overlay-subtitle">
            Iterative Map Visualization
          </p>
        </div>
      </div>

      {/* Sidebar Controls */}
      <div className="square-quilt-2-sidebar">
        <ControlPanel 
          params={params}
          setParams={setParams}
          onClear={handleClear}
          onReset={handleReset}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
        />
      </div>
    </div>
  );
};


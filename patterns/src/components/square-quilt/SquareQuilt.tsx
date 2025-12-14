import React, { useState, useCallback } from 'react';
import { SquareQuiltCanvas } from './SquareQuiltCanvas';
import { ControlPanel } from './ControlPanel';
import { DEFAULT_PARAMS } from './types';
import type { SimulationParams } from './types';
import './SquareQuilt.css';

export const SquareQuilt: React.FC = () => {
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
    <div className="square-quilt-container">
      {/* Canvas Area */}
      <div className="square-quilt-canvas-area">
        <div className="square-quilt-canvas-wrapper">
          <SquareQuiltCanvas 
            params={params} 
            isRunning={isRunning} 
            clearTrigger={clearCount}
          />
        </div>
        
        {/* Overlay Info */}
        <div className="square-quilt-overlay">
          <h1 className="square-quilt-overlay-title">Symmetric Chaos</h1>
          <p className="square-quilt-overlay-subtitle">
            Iterative Map Visualization
          </p>
        </div>
      </div>

      {/* Sidebar Controls */}
      <div className="square-quilt-sidebar">
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


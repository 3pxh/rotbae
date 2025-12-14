import React, { useState } from 'react';
import { Controls } from './components/Controls';
import { SymmetricIconCanvas } from './components/SymmetricIconCanvas';
import { DEFAULT_PARAMS, SimulationParams } from './types';

export default function App() {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [clearCount, setClearCount] = useState<number>(0);

  const handleClear = () => {
    setClearCount(c => c + 1);
  };

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
    handleClear();
    setIsRunning(true);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-900 overflow-hidden">
      {/* Canvas Area */}
      <div className="relative flex-1 h-[60vh] md:h-auto order-1 md:order-1">
        <div className="absolute inset-0">
          <SymmetricIconCanvas 
            params={params} 
            isRunning={isRunning} 
            clearTrigger={clearCount}
          />
        </div>
        
        {/* Overlay Info */}
        <div className="absolute top-4 left-4 pointer-events-none z-10">
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-md opacity-80">Symmetric Chaos</h1>
          <p className="text-xs text-slate-400 font-mono mt-1 opacity-70">
            Iterative Map Visualization
          </p>
        </div>
      </div>

      {/* Sidebar Controls */}
      <div className="order-2 md:order-2 h-[40vh] md:h-auto w-full md:w-80 flex-shrink-0 z-20">
        <Controls 
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
}

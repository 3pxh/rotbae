import React, { useState, useCallback } from 'react';
import ControlPanel from './components/ControlPanel';
import FractalCanvas from './components/FractalCanvas';
import { IFSParams, DEFAULT_PARAMS } from './types';

function App() {
  const [params, setParams] = useState<IFSParams>(DEFAULT_PARAMS);
  const [pointCount, setPointCount] = useState<number>(0);
  const [triggerClear, setTriggerClear] = useState<boolean>(false);

  // Wrap setParams to optionally auto-clear or specific handling logic
  // For this BASIC port, we will stick to manual clearing mostly, but allow the canvas
  // to react to state changes. 
  
  const handleClear = useCallback(() => {
    setTriggerClear(true);
  }, []);

  const handleClearComplete = useCallback(() => {
    setTriggerClear(false);
  }, []);

  const handleReset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setTriggerClear(true);
  }, []);

  // Effect to auto-clear when critical structural parameters change
  // The BASIC program doesn't strictly do this automatically for all params, 
  // but it's better UX for web.
  React.useEffect(() => {
    // When symmetry degree or type changes, the old points are usually invalid visually
    setTriggerClear(true);
  }, [params.n, params.conj]);

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-slate-900 text-slate-100 font-sans">
      <ControlPanel 
        params={params} 
        setParams={setParams} 
        onClear={handleClear}
        onReset={handleReset}
        pointCount={pointCount}
      />
      <FractalCanvas 
        params={params} 
        setPointCount={setPointCount}
        shouldClear={triggerClear}
        onClearComplete={handleClearComplete}
      />
    </div>
  );
}

export default App;

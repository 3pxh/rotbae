import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { SimulationCanvas, type SimulationCanvasRef } from './SimulationCanvas';
import { ControlPanel } from './ControlPanel';
import { DEFAULT_PARAMS } from './types';
import type { SimulationParams, SavedPreset } from './types';
import presetsData from './symmetry-attractor-presets.json';
import { withDownloadButton, type DownloadableComponentRef } from '@utilities/withDownloadButton';
import './SymmetryAttractor.css';

const SymmetryAttractor = forwardRef<DownloadableComponentRef>((_props, ref) => {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [resetTrigger, setResetTrigger] = useState<number>(0);
  const [clearTrigger, setClearTrigger] = useState<number>(0);
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [color, setColor] = useState<string>('#ff00ff'); // Default magenta for glow and chalk
  const [histogramColors, setHistogramColors] = useState({
    low: '#ff00ff', // Magenta
    mid: '#00ffff', // Cyan blue
    high: '#ffff00' // Yellow
  });
  const [renderMode, setRenderMode] = useState<'chalk' | 'glow' | 'histogram'>('chalk');
  const [speed, setSpeed] = useState<number>(50); // 1-100
  const resetWithoutClearRef = useRef<boolean>(false);
  const simulationCanvasRef = useRef<SimulationCanvasRef>(null);

  // Expose download methods to withDownloadButton HOC
  useImperativeHandle(ref, () => ({
    getMergedDataURL: () => {
      const canvas = simulationCanvasRef.current?.getCanvasElement();
      if (!canvas) return null;
      
      try {
        return canvas.toDataURL('image/png');
      } catch (error) {
        console.error('Failed to get canvas data URL:', error);
        return null;
      }
    },
    getCanvasElement: () => {
      return simulationCanvasRef.current?.getCanvasElement() || null;
    }
  }));

  const handleParamChange = useCallback((newParams: Partial<SimulationParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const handleResetDefaults = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setResetTrigger(prev => prev + 1);
  }, []);

  const handleClearScreen = useCallback(() => {
    setClearTrigger(prev => prev + 1);
  }, []);

  const handleRestart = useCallback(() => {
    setResetTrigger(prev => prev + 1);
  }, []);

  const handleRenderModeChange = useCallback((mode: 'chalk' | 'glow' | 'histogram') => {
    setRenderMode(mode);
    setClearTrigger(prev => prev + 1); // Clear screen when switching modes
  }, []);

  const handleLoadPreset = useCallback((preset: SavedPreset, clearCanvas: boolean = true) => {
    setParams(preset.params);
    // Set resetWithoutClear flag in ref synchronously (before reset trigger)
    resetWithoutClearRef.current = !clearCanvas;
    // Reset state so simulation starts fresh with new params
    setResetTrigger(prev => prev + 1); 
    // Reset the flag after reset has been processed
    setTimeout(() => {
      resetWithoutClearRef.current = false;
    }, 0);
  }, []);

  // Load presets on mount
  useEffect(() => {
    try {
      if (Array.isArray(presetsData)) {
        const validPresets = presetsData.filter((p: unknown): p is SavedPreset => {
          if (!p || typeof p !== 'object') return false;
          const obj = p as Record<string, unknown>;
          if (!obj.params || typeof obj.params !== 'object') return false;
          const params = obj.params as Record<string, unknown>;
          return (
            typeof obj.id === 'string' &&
            typeof obj.name === 'string' &&
            typeof obj.timestamp === 'number' &&
            typeof params.lambda === 'number' &&
            typeof params.alpha === 'number' &&
            typeof params.beta === 'number' &&
            typeof params.gamma === 'number' &&
            typeof params.omega === 'number' &&
            typeof params.n === 'number' &&
            typeof params.scale === 'number'
        );
        });
        if (validPresets.length > 0) {
          // Initialize state from external data (JSON file) - acceptable use of setState in effect
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSavedPresets(validPresets);
          // Optionally load the first preset
          // setParams(validPresets[0].params);
          // setResetTrigger(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error("Failed to load presets", err);
    }
  }, []); // Run only on mount

  return (
    <div className="symmetry-attractor-container">
      {/* Sidebar Controls */}
      <div className="symmetry-attractor-sidebar custom-scrollbar">
        
        <ControlPanel 
          params={params} 
          onParamChange={handleParamChange}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          onReset={handleResetDefaults}
          onClear={handleClearScreen}
          onRestart={handleRestart}
          savedPresets={savedPresets}
          onLoadPreset={handleLoadPreset}
          color={color}
          onColorChange={setColor}
          renderMode={renderMode}
          onRenderModeChange={handleRenderModeChange}
          histogramColors={histogramColors}
          onHistogramColorsChange={setHistogramColors}
          speed={speed}
          onSpeedChange={setSpeed}
        />
      </div>

      {/* Main Canvas Area */}
      <div className="symmetry-attractor-canvas-area">
        <SimulationCanvas 
          ref={simulationCanvasRef}
          params={params}
          isRunning={isRunning}
          resetTrigger={resetTrigger}
          clearTrigger={clearTrigger}
          color={color}
          renderMode={renderMode}
          histogramColors={histogramColors}
          speed={speed}
          resetWithoutClearRef={resetWithoutClearRef}
        />
      </div>
    </div>
  );
});

SymmetryAttractor.displayName = 'SymmetryAttractor';

// Wrap with download button HOC
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SymmetryAttractorWithDownload = withDownloadButton(SymmetryAttractor as any);
SymmetryAttractorWithDownload.displayName = 'SymmetryAttractorWithDownload';

export default SymmetryAttractorWithDownload;


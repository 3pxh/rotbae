import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SimulationCanvas } from './SimulationCanvas';
import { ControlPanel } from './ControlPanel';
import { DEFAULT_PARAMS } from './types';
import type { SimulationParams, SavedPreset } from './types';
import presetsData from './symmetry-attractor-presets.json';
import './SymmetryAttractor.css';

export const SymmetryAttractor: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [resetTrigger, setResetTrigger] = useState<number>(0);
  const [clearTrigger, setClearTrigger] = useState<number>(0);
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [color, setColor] = useState<string>('#34d399'); // Default emerald-400
  const [histogramColors, setHistogramColors] = useState({
    low: '#1e3a8a', // Blue-900
    mid: '#ef4444', // Red-500
    high: '#fef08a' // Yellow-200
  });
  const [renderMode, setRenderMode] = useState<'chalk' | 'glow' | 'histogram'>('chalk');
  const [speed, setSpeed] = useState<number>(50); // 1-100
  const resetWithoutClearRef = useRef<boolean>(false);

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
        const validPresets = presetsData.filter((p: any): p is SavedPreset => 
          p && 
          typeof p === 'object' && 
          typeof p.id === 'string' &&
          typeof p.name === 'string' &&
          typeof p.timestamp === 'number' &&
          p.params &&
          typeof p.params.lambda === 'number' &&
          typeof p.params.alpha === 'number' &&
          typeof p.params.beta === 'number' &&
          typeof p.params.gamma === 'number' &&
          typeof p.params.omega === 'number' &&
          typeof p.params.n === 'number' &&
          typeof p.params.scale === 'number'
        );
        if (validPresets.length > 0) {
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
};


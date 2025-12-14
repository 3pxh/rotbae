import React, { useState, useCallback, useEffect } from 'react';
import { ControlPanel } from './ControlPanel';
import { FractalCanvas } from './FractalCanvas';
import { DEFAULT_PARAMS } from './types';
import type { IFSParams } from './types';
import presetsData from './fractal-presets.json';
import './SymmetricFractalProgram.css';

type Preset = IFSParams & { name?: string; figure?: string };

export const SymmetricFractalProgram: React.FC = () => {
  const [params, setParams] = useState<IFSParams>(DEFAULT_PARAMS);
  const [pointCount, setPointCount] = useState<number>(0);
  const [triggerClear, setTriggerClear] = useState<number>(0);
  const [loadedPresets, setLoadedPresets] = useState<Preset[]>([]);
  const [clearOnLoad, setClearOnLoad] = useState<boolean>(true);
  const [renderMode, setRenderMode] = useState<'standard' | 'histogram'>('standard');
  const [histogramColors, setHistogramColors] = useState({
    low: '#1e3a8a', // Blue-900
    mid: '#ef4444', // Red-500
    high: '#fef08a' // Yellow-200
  });

  const handleClear = useCallback(() => {
    setTriggerClear(prev => prev + 1);
  }, []);

  const handleClearComplete = useCallback(() => {
    // No-op, we use counter instead
  }, []);

  const handleReset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setTriggerClear(prev => prev + 1);
  }, []);

  const handleSaveParams = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(params, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `fractal-params-${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [params]);

  const validatePreset = (obj: any): obj is Preset => {
    return obj && typeof obj === 'object' && 
           typeof obj.a11 === 'number' && typeof obj.a12 === 'number' &&
           typeof obj.a21 === 'number' && typeof obj.a22 === 'number' &&
           typeof obj.b1 === 'number' && typeof obj.b2 === 'number' &&
           typeof obj.n === 'number' && typeof obj.conj === 'number' &&
           typeof obj.scale === 'number';
  };

  const handleLoadParams = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Handle array of presets
        if (Array.isArray(json)) {
          const validPresets = json.filter(validatePreset);
          if (validPresets.length > 0) {
            setLoadedPresets(validPresets);
            // Load the first preset automatically
            setParams(validPresets[0]);
            setTriggerClear(prev => prev + 1);
          } else {
            alert("Invalid JSON file: No valid preset parameters found in array.");
          }
        } 
        // Handle single preset object
        else if (validatePreset(json)) {
          setLoadedPresets([json]);
          setParams(json);
          setTriggerClear(prev => prev + 1);
        } else {
          alert("Invalid JSON file: File must contain valid fractal parameters (object or array).");
        }
      } catch (err) {
        console.error("Failed to parse JSON", err);
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    // Reset the input value to allow re-uploading the same file if needed
    e.target.value = '';
  }, []);

  const handleLoadPreset = useCallback((preset: Preset) => {
    setParams(preset);
    if (clearOnLoad) {
      setTriggerClear(prev => prev + 1);
    }
  }, [clearOnLoad]);

  // Effect to auto-clear when critical structural parameters change
  React.useEffect(() => {
    setTriggerClear(prev => prev + 1);
  }, [params.n, params.conj]);

  // Effect to clear when render mode changes
  React.useEffect(() => {
    setTriggerClear(prev => prev + 1);
  }, [renderMode]);

  // Load presets on mount
  useEffect(() => {
    try {
      const presets = Array.isArray(presetsData) ? presetsData : [presetsData];
      const validPresets = presets.filter(validatePreset);
      if (validPresets.length > 0) {
        setLoadedPresets(validPresets);
        // Load the first preset automatically
        setParams(validPresets[0]);
        setTriggerClear(prev => prev + 1);
      }
    } catch (err) {
      console.error("Failed to load presets", err);
    }
  }, []); // Run only on mount

  return (
    <div className="symmetric-fractal-container">
      <ControlPanel 
        params={params} 
        setParams={setParams} 
        onClear={handleClear}
        onReset={handleReset}
        onSaveParams={handleSaveParams}
        onLoadParams={handleLoadParams}
        onLoadPreset={handleLoadPreset}
        loadedPresets={loadedPresets}
        clearOnLoad={clearOnLoad}
        onClearOnLoadChange={setClearOnLoad}
        renderMode={renderMode}
        onRenderModeChange={setRenderMode}
        histogramColors={histogramColors}
        onHistogramColorsChange={setHistogramColors}
        pointCount={pointCount}
      />
      <FractalCanvas 
        params={params} 
        setPointCount={setPointCount}
        shouldClear={triggerClear}
        onClearComplete={handleClearComplete}
        renderMode={renderMode}
        histogramColors={histogramColors}
      />
    </div>
  );
};


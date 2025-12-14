import React, { useState, useCallback, useEffect } from 'react';
import { ControlPanel } from './ControlPanel';
import { SquareQuiltCanvas } from './SquareQuiltCanvas';
import { DEFAULT_PARAMS } from './types';
import type { SquareQuiltParams } from './types';
import presetsData from './square-quilt-presets.json';
import './SquareQuilt.css';

type Preset = SquareQuiltParams & { name?: string; figure?: string };

export const SquareQuilt: React.FC = () => {
  const [params, setParams] = useState<SquareQuiltParams>(DEFAULT_PARAMS);
  const [iterates, setIterates] = useState<number>(0);
  const [triggerClear, setTriggerClear] = useState<number>(0);
  const [loadedPresets, setLoadedPresets] = useState<Preset[]>([]);

  const handleClear = useCallback(() => {
    setTriggerClear(prev => prev + 1);
    setIterates(0);
  }, []);

  const handleClearComplete = useCallback(() => {
    // No-op, we use counter instead
  }, []);

  const handleReset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setTriggerClear(prev => prev + 1);
    setIterates(0);
  }, []);

  const handleSaveParams = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(params, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `square-quilt-params-${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [params]);

  // Parse shift string like "(0, 0)" or "(1/2, 1/2)" to a number
  const parseShift = (shiftStr: string): number => {
    if (typeof shiftStr === 'number') return shiftStr;
    const match = shiftStr.match(/\(([^,]+),/);
    if (match) {
      const value = match[1].trim();
      if (value.includes('/')) {
        const [num, den] = value.split('/').map(s => parseFloat(s.trim()));
        return num / den;
      }
      return parseFloat(value) || 0;
    }
    return 0;
  };

  const convertToPreset = (item: any): Preset | null => {
    if (!item || typeof item !== 'object') return null;
    if (typeof item.lambda !== 'number' || typeof item.alpha !== 'number' ||
        typeof item.beta !== 'number' || typeof item.gamma !== 'number' ||
        typeof item.omega !== 'number' || typeof item.m !== 'number') {
      return null;
    }
    return {
      lambda: item.lambda,
      alpha: item.alpha,
      beta: item.beta,
      gamma: item.gamma,
      omega: item.omega,
      m: item.m,
      shift: parseShift(item.shift || item.Shift || 0),
      nperiod: DEFAULT_PARAMS.nperiod,
      toggle: DEFAULT_PARAMS.toggle,
      name: item.name || item.Name,
      figure: item.figure || item.Figure,
    };
  };

  const validateParams = (obj: any): obj is SquareQuiltParams => {
    return obj && typeof obj === 'object' && 
           typeof obj.lambda === 'number' && typeof obj.alpha === 'number' &&
           typeof obj.beta === 'number' && typeof obj.gamma === 'number' &&
           typeof obj.omega === 'number' && typeof obj.m === 'number' &&
           typeof obj.shift === 'number' && typeof obj.nperiod === 'number' &&
           typeof obj.toggle === 'number';
  };

  const handleLoadParams = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Handle tables structure
        if (json.tables && Array.isArray(json.tables) && json.tables.length > 0) {
          const table = json.tables[0];
          if (table.data && Array.isArray(table.data)) {
            const presets = table.data.map(convertToPreset).filter((p): p is Preset => p !== null);
            if (presets.length > 0) {
              setLoadedPresets(presets);
              setParams(presets[0]);
              setTriggerClear(prev => prev + 1);
              setIterates(0);
              return;
            }
          }
        }
        
        // Handle array of presets
        if (Array.isArray(json)) {
          const presets = json.map(convertToPreset).filter((p): p is Preset => p !== null);
          if (presets.length > 0) {
            setLoadedPresets(presets);
            setParams(presets[0]);
            setTriggerClear(prev => prev + 1);
            setIterates(0);
            return;
          }
          // Fallback to validateParams for arrays
          const validPresets = json.filter(validateParams);
          if (validPresets.length > 0) {
            setLoadedPresets(validPresets);
            setParams(validPresets[0]);
            setTriggerClear(prev => prev + 1);
            setIterates(0);
            return;
          }
        } 
        // Handle single preset object
        const preset = convertToPreset(json);
        if (preset) {
          setLoadedPresets([preset]);
          setParams(preset);
          setTriggerClear(prev => prev + 1);
          setIterates(0);
          return;
        }
        
        if (validateParams(json)) {
          setLoadedPresets([json]);
          setParams(json);
          setTriggerClear(prev => prev + 1);
          setIterates(0);
        } else {
          alert("Invalid JSON file: File must contain valid square quilt parameters.");
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

  // Load presets on mount
  useEffect(() => {
    try {
      if (presetsData.tables && Array.isArray(presetsData.tables) && presetsData.tables.length > 0) {
        const table = presetsData.tables[0];
        if (table.data && Array.isArray(table.data)) {
          const presets = table.data.map((item: any) => convertToPreset(item)).filter((p): p is Preset => p !== null);
          if (presets.length > 0) {
            setLoadedPresets(presets);
            setParams(presets[0]);
            setTriggerClear(prev => prev + 1);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load presets", err);
    }
  }, []); // Run only on mount

  // Effect to auto-clear when critical parameters change
  React.useEffect(() => {
    setTriggerClear(prev => prev + 1);
  }, [params.nperiod, params.toggle]);

  return (
    <div className="square-quilt-container">
      <ControlPanel 
        params={params} 
        setParams={setParams} 
        onClear={handleClear}
        onReset={handleReset}
        onSaveParams={handleSaveParams}
        onLoadParams={handleLoadParams}
        onLoadPreset={(preset) => {
          setParams(preset);
          setTriggerClear(prev => prev + 1);
          setIterates(0);
        }}
        loadedPresets={loadedPresets}
        iterates={iterates}
      />
      <SquareQuiltCanvas 
        params={params} 
        setIterates={setIterates}
        shouldClear={triggerClear}
        onClearComplete={handleClearComplete}
      />
    </div>
  );
};


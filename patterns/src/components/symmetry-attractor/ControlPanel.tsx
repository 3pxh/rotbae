import React, { useState, useRef, useEffect } from 'react';
import type { SimulationParams, SavedPreset } from './types';
import './ControlPanel.css';

interface ControlPanelProps {
  params: SimulationParams;
  onParamChange: (newParams: Partial<SimulationParams>) => void;
  isRunning: boolean;
  setIsRunning: (val: boolean) => void;
  onReset: () => void;
  onClear: () => void;
  onRestart: () => void;
  savedPresets: SavedPreset[];
  onLoadPreset: (preset: SavedPreset, clearCanvas?: boolean) => void;
  color: string;
  onColorChange: (color: string) => void;
  renderMode: 'chalk' | 'glow' | 'histogram';
  onRenderModeChange: (mode: 'chalk' | 'glow' | 'histogram') => void;
  histogramColors: { low: string; mid: string; high: string };
  onHistogramColorsChange: (colors: { low: string; mid: string; high: string }) => void;
  speed: number;
  onSpeedChange: (val: number) => void;
}

// Helper to calculate estimated points per second based on logic in SimulationCanvas
const calculatePtsPerSec = (speedVal: number, mode: 'chalk' | 'glow' | 'histogram') => {
    const FPS = 60; // Approximate frames per second
    
    if (speedVal === 1) {
        // At minimum speed, 1 point per second
        return 1;
    }
    
    const t = (speedVal - 2) / 98; // Speed 2-100 maps to t 0-1
    let batchSize;
    
    if (mode === 'histogram') {
        const min = 1666;
        const max = 250000;
        batchSize = Math.floor(min * Math.pow(max/min, t));
    } else {
        const min = 100;
        const max = 3000;
        batchSize = Math.floor(min + (max - min) * t);
    }
    
    return batchSize * FPS;
};

const formatRate = (rate: number) => {
    if (rate >= 1000000) return `${(rate / 1000000).toFixed(1)}M`;
    if (rate >= 1000) return `${(rate / 1000).toFixed(0)}k`;
    return `${rate}`;
};

const SliderInput = ({ 
    label, 
    value, 
    min, 
    max, 
    step, 
    onChange 
}: { 
    label: string; 
    value: number; 
    min: number; 
    max: number; 
    step: number; 
    onChange: (val: number) => void 
}) => (
    <div className="slider-input">
        <div className="slider-label-row">
            <label className="slider-label">{label}</label>
            <span className="slider-value">{value.toFixed(3)}</span>
        </div>
        <input 
            type="range" 
            min={min} 
            max={max} 
            step={step} 
            value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="slider-input-range"
        />
    </div>
);

const NumberInput = ({
    label,
    value,
    step = 0.1,
    onChange
}: {
    label: string;
    value: number;
    step?: number;
    onChange: (val: number) => void;
}) => (
    <div className="number-input">
        <label className="number-input-label">{label}</label>
        <input
            type="number"
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="number-input-field"
        />
    </div>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
    params, 
    onParamChange,
    isRunning,
    setIsRunning,
    onReset,
    onClear,
    onRestart,
    savedPresets,
    onLoadPreset,
    color,
    onColorChange,
    renderMode,
    onRenderModeChange,
    histogramColors,
    onHistogramColorsChange,
    speed,
    onSpeedChange
}) => {
  const [currentPresetIndex, setCurrentPresetIndex] = useState<number>(0);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [clearOnPresetChange, setClearOnPresetChange] = useState<boolean>(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentRate = calculatePtsPerSec(speed, renderMode);
  const minRate = calculatePtsPerSec(1, renderMode);
  const maxRate = calculatePtsPerSec(100, renderMode);

  // Update current preset index when presets change
  useEffect(() => {
    if (savedPresets.length > 0 && currentPresetIndex >= savedPresets.length) {
      setCurrentPresetIndex(Math.max(0, savedPresets.length - 1));
    }
  }, [savedPresets.length, currentPresetIndex]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handlePrevPreset = () => {
    if (savedPresets.length === 0) return;
    const newIndex = currentPresetIndex > 0 ? currentPresetIndex - 1 : savedPresets.length - 1;
    setCurrentPresetIndex(newIndex);
    onLoadPreset(savedPresets[newIndex], clearOnPresetChange);
  };

  const handleNextPreset = () => {
    if (savedPresets.length === 0) return;
    const newIndex = currentPresetIndex < savedPresets.length - 1 ? currentPresetIndex + 1 : 0;
    setCurrentPresetIndex(newIndex);
    onLoadPreset(savedPresets[newIndex], clearOnPresetChange);
  };

  const handlePresetClick = (preset: SavedPreset, index: number) => {
    setCurrentPresetIndex(index);
    onLoadPreset(preset, clearOnPresetChange);
    setShowDropdown(false);
  };

  const currentPreset = savedPresets.length > 0 ? savedPresets[currentPresetIndex] : null;

  return (
    <div className="control-panel">
        
        {/* Presets Navigation */}
        {savedPresets.length > 0 && (
          <div className="control-section presets-navigation">
            <div className="presets-nav-container" ref={dropdownRef}>
              <button 
                onClick={handlePrevPreset}
                className="preset-nav-button preset-nav-prev"
                aria-label="Previous preset"
              >
                &lt;
              </button>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="preset-nav-current"
              >
                {currentPreset?.name || 'No Preset'}
              </button>
              <button 
                onClick={handleNextPreset}
                className="preset-nav-button preset-nav-next"
                aria-label="Next preset"
              >
                &gt;
              </button>
              
              {showDropdown && (
                <div className="presets-dropdown custom-scrollbar">
                  {savedPresets.map((preset, index) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetClick(preset, index)}
                      className={`preset-dropdown-item ${index === currentPresetIndex ? 'preset-dropdown-item-active' : ''}`}
                    >
                      <div className="preset-dropdown-name">{preset.name}</div>
                      <div className="preset-dropdown-params">
                        λ:{preset.params.lambda.toFixed(1)} n:{preset.params.n}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <label className="preset-clear-checkbox">
              <input
                type="checkbox"
                checked={clearOnPresetChange}
                onChange={(e) => setClearOnPresetChange(e.target.checked)}
              />
              <span>Clear canvas on preset change</span>
            </label>
          </div>
        )}

        {/* Speed Slider */}
        <div className="control-section speed-control">
            <div className="speed-header">
                <span className="speed-label">Simulation Speed</span>
                <span className="speed-value">~{formatRate(currentRate)} pts/s</span>
            </div>
            <input 
                type="range" 
                min="1" 
                max="100" 
                value={speed}
                onChange={(e) => onSpeedChange(parseInt(e.target.value))}
                className="speed-range"
            />
            <div className="speed-range-labels">
                <span>{formatRate(minRate)}</span>
                <span>{formatRate(maxRate)}</span>
            </div>
        </div>

        {/* Render Mode Toggle */}
        <div className="control-section render-mode-toggle">
            <button 
                onClick={() => onRenderModeChange('chalk')}
                className={`render-mode-button ${
                renderMode === 'chalk' 
                    ? 'render-mode-button-active' 
                    : ''
                }`}
            >
                Chalk
            </button>
            <button 
                onClick={() => onRenderModeChange('glow')}
                className={`render-mode-button ${
                renderMode === 'glow' 
                    ? 'render-mode-button-active' 
                    : ''
                }`}
            >
                Glow
            </button>
            <button 
                onClick={() => onRenderModeChange('histogram')}
                className={`render-mode-button ${
                renderMode === 'histogram' 
                    ? 'render-mode-button-active' 
                    : ''
                }`}
            >
                Histogram
            </button>
        </div>

        {/* Display Settings (Colors) - Label Removed */}
        <div className="control-section color-settings">
            {renderMode === 'histogram' ? (
                <div className="density-mapping-row">
                    <span className="density-mapping-title">DENSITY MAPPING</span>
                    <div className="density-color-inputs">
                        <div className="density-color-item">
                            <label className="color-label">Low</label>
                            <input 
                                type="color" 
                                value={histogramColors.low}
                                onChange={(e) => onHistogramColorsChange({ ...histogramColors, low: e.target.value })}
                                className="color-input"
                            />
                        </div>
                        <div className="density-color-item">
                            <label className="color-label">Mid</label>
                            <input 
                                type="color" 
                                value={histogramColors.mid}
                                onChange={(e) => onHistogramColorsChange({ ...histogramColors, mid: e.target.value })}
                                className="color-input"
                            />
                        </div>
                        <div className="density-color-item">
                            <label className="color-label">High</label>
                            <input 
                                type="color" 
                                value={histogramColors.high}
                                onChange={(e) => onHistogramColorsChange({ ...histogramColors, high: e.target.value })}
                                className="color-input"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="color-setting-row">
                    <label className="color-label">Dot Color</label>
                    <input 
                        type="color" 
                        value={color}
                        onChange={(e) => onColorChange(e.target.value)}
                        className="color-input"
                    />
                </div>
            )}
        </div>

        {/* Parameters */}
        <div className="control-section parameters-section">
            <div className="parameters-header">
                <h3 className="parameters-title">Parameters</h3>
                <button 
                    onClick={onReset}
                    className="reset-button"
                >
                    Reset Defaults
                </button>
            </div>
            
            <div className="number-inputs-grid">
                <NumberInput 
                    label="Degree (n)" 
                    value={params.n} 
                    step={1}
                    onChange={(v) => onParamChange({ n: Math.max(1, Math.floor(v)) })} 
                />
                <NumberInput 
                    label="Scale" 
                    value={params.scale} 
                    step={0.01}
                    onChange={(v) => onParamChange({ scale: Math.max(0.01, v) })} 
                />
            </div>
            
            <SliderInput 
                label="Lambda (λ)" 
                value={params.lambda} 
                min={-5} max={5} step={0.001} 
                onChange={(v) => onParamChange({ lambda: v })} 
            />
            <SliderInput 
                label="Alpha (α)" 
                value={params.alpha} 
                min={-5} max={15} step={0.001} 
                onChange={(v) => onParamChange({ alpha: v })} 
            />
            <SliderInput 
                label="Beta (β)" 
                value={params.beta} 
                min={-20} max={5} step={0.001} 
                onChange={(v) => onParamChange({ beta: v })} 
            />
            <SliderInput 
                label="Gamma (γ)" 
                value={params.gamma} 
                min={-2} max={2} step={0.001} 
                onChange={(v) => onParamChange({ gamma: v })} 
            />
            <SliderInput 
                label="Omega (ω)" 
                value={params.omega} 
                min={-1} max={1} step={0.001} 
                onChange={(v) => onParamChange({ omega: v })} 
            />
        </div>

        {/* Main Controls */}
        <div className="control-section">
            <div className="control-buttons-row">
                <button 
                    onClick={() => setIsRunning(!isRunning)}
                    className={`control-button ${
                        isRunning 
                        ? 'control-button-pause' 
                        : 'control-button-resume'
                    }`}
                >
                    {isRunning ? 'Pause' : 'Resume'}
                </button>
                <button 
                    onClick={onRestart}
                    className="control-button control-button-restart"
                >
                    Restart
                </button>
                <button 
                    onClick={onClear}
                    className="control-button control-button-clear"
                >
                    Clear
                </button>
            </div>
        </div>
    </div>
  );
};


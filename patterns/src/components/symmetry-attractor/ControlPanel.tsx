import React from 'react';
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
  onSaveImage: () => void;
  savedPresets: SavedPreset[];
  onSavePreset: () => void;
  onLoadPreset: (preset: SavedPreset) => void;
  onRemovePreset: (id: string) => void;
  onImportPresets: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadPresets: () => void;
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
    const t = (speedVal - 1) / 99;
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
    
    return batchSize * 60; // Assuming ~60fps
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
    onSaveImage,
    savedPresets,
    onSavePreset,
    onLoadPreset,
    onRemovePreset,
    onImportPresets,
    onDownloadPresets,
    color,
    onColorChange,
    renderMode,
    onRenderModeChange,
    histogramColors,
    onHistogramColorsChange,
    speed,
    onSpeedChange
}) => {
  const currentRate = calculatePtsPerSec(speed, renderMode);
  const minRate = calculatePtsPerSec(1, renderMode);
  const maxRate = calculatePtsPerSec(100, renderMode);

  return (
    <div className="control-panel">
        
        {/* Main Controls */}
        <div className="control-section">
            <button 
                onClick={onSaveImage}
                className="control-button-full"
            >
                Save Image
            </button>
            
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

        {/* Display Settings (Colors) - Label Removed */}
        <div className="control-section color-settings">
            {renderMode === 'histogram' ? (
                <>
                    <div className="color-setting-row">
                        <label className="color-label">Low Density</label>
                        <input 
                            type="color" 
                            value={histogramColors.low}
                            onChange={(e) => onHistogramColorsChange({ ...histogramColors, low: e.target.value })}
                            className="color-input"
                        />
                    </div>
                    <div className="color-setting-row">
                        <label className="color-label">Mid Density</label>
                        <input 
                            type="color" 
                            value={histogramColors.mid}
                            onChange={(e) => onHistogramColorsChange({ ...histogramColors, mid: e.target.value })}
                            className="color-input"
                        />
                    </div>
                    <div className="color-setting-row">
                        <label className="color-label">High Density</label>
                        <input 
                            type="color" 
                            value={histogramColors.high}
                            onChange={(e) => onHistogramColorsChange({ ...histogramColors, high: e.target.value })}
                            className="color-input"
                        />
                    </div>
                </>
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

        {/* Render Mode Toggle - Label Removed - Moved Here */}
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

        {/* Parameters */}
        <div className="parameters-section">
            <div className="parameters-header">
                <h3 className="parameters-title">Parameters</h3>
                <button 
                    onClick={onReset}
                    className="reset-button"
                >
                    Reset Defaults
                </button>
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
        </div>

        {/* Saved Presets */}
        <div className="presets-section">
            <div className="presets-buttons">
                <button 
                    onClick={onSavePreset}
                    className="preset-button preset-button-save"
                >
                    + Save
                </button>
                <label className="preset-button preset-button-load">
                    Load JSON
                    <input 
                        type="file" 
                        accept=".json" 
                        onChange={onImportPresets}
                        className="preset-file-input" 
                    />
                </label>
                <button 
                    onClick={onDownloadPresets}
                    disabled={savedPresets.length === 0}
                    className="preset-button preset-button-download"
                >
                    Download
                </button>
            </div>

            {savedPresets.length > 0 ? (
                <div className="presets-list custom-scrollbar">
                    {savedPresets.map((preset) => (
                        <div key={preset.id} className="preset-item">
                            <button 
                                onClick={() => onLoadPreset(preset)}
                                className="preset-item-button"
                            >
                                <div className="preset-item-name">{preset.name}</div>
                                <div className="preset-item-params">
                                    λ:{preset.params.lambda.toFixed(1)} n:{preset.params.n}
                                </div>
                            </button>
                            <button 
                                onClick={() => onRemovePreset(preset.id)}
                                className="preset-remove-button"
                                title="Remove"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="preset-empty">
                    No saved presets yet.
                </div>
            )}
        </div>
    </div>
  );
};


import React from 'react';
import type { IFSParams } from './types';
import { Input } from './Input';
import './ControlPanel.css';

type Preset = IFSParams & { name?: string; figure?: string };

interface ControlPanelProps {
  params: IFSParams;
  setParams: React.Dispatch<React.SetStateAction<IFSParams>>;
  onClear: () => void;
  onReset: () => void;
  onSaveParams: () => void;
  onLoadParams: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadPreset: (preset: Preset) => void;
  loadedPresets: Preset[];
  clearOnLoad: boolean;
  onClearOnLoadChange: (value: boolean) => void;
  renderMode: 'standard' | 'histogram';
  onRenderModeChange: (mode: 'standard' | 'histogram') => void;
  histogramColors: { low: string; mid: string; high: string };
  onHistogramColorsChange: (colors: { low: string; mid: string; high: string }) => void;
  pointCount: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  params, 
  setParams, 
  onClear, 
  onReset, 
  onSaveParams, 
  onLoadParams, 
  onLoadPreset, 
  loadedPresets, 
  clearOnLoad, 
  onClearOnLoadChange,
  renderMode,
  onRenderModeChange,
  histogramColors,
  onHistogramColorsChange,
  pointCount 
}) => {
  const updateParam = (key: keyof IFSParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSymmetry = () => {
    updateParam('conj', params.conj === 1 ? 0 : 1);
  };

  // Check contraction warning condition from BASIC code:
  const a1 = params.a11 * params.a11 + params.a21 * params.a21;
  const a2 = params.a21 * params.a21 + params.a22 * params.a22;
  const det = params.a11 * params.a22 - params.a12 * params.a21;
  const isWarning = a1 > 1 || a2 > 1 || (a1 + a2) > (1 + det * det);

  return (
    <div className="fractal-control-panel">
      <div className="fractal-control-header">
        <h1 className="fractal-control-title">IFS Generator</h1>
        <p className="fractal-control-subtitle">Based on BASIC logic</p>
      </div>

      <div className="fractal-control-content">
        
        {/* Status Display */}
        <div className="fractal-status">
          <div className="fractal-status-row">
            <span>Points:</span>
            <span className="fractal-status-value">{pointCount.toLocaleString()}</span>
          </div>
          <div className="fractal-status-row">
             <span>Symmetry:</span>
             <span className="fractal-status-symmetry">{params.conj === 1 ? `Dn (${params.n})` : `Zn (${params.n})`}</span>
          </div>
           {isWarning && (
            <div className="fractal-status-warning">
              Warning: Affine mapping may not be a contraction.
            </div>
          )}
        </div>

        {/* Symmetry Controls */}
        <div className="fractal-control-section">
          <h2 className="fractal-section-title">Symmetry</h2>
          <Input label="Degree (n)" value={params.n} onChange={(v) => updateParam('n', Math.max(1, Math.floor(v)))} step={1} min={1} />
          <div className="fractal-symmetry-toggle">
            <span className="fractal-symmetry-label">Type</span>
            <button
              onClick={toggleSymmetry}
              className={`fractal-symmetry-button ${params.conj === 1 ? 'fractal-symmetry-button-dn' : 'fractal-symmetry-button-zn'}`}
            >
              {params.conj === 1 ? 'Dn (Reflection)' : 'Zn (Rotation)'}
            </button>
          </div>
        </div>

        {/* Coefficients */}
        <div className="fractal-control-section">
          <h2 className="fractal-section-title">Affine Coefficients</h2>
          <div className="fractal-coefficients-grid">
            <Input label="a11" value={params.a11} onChange={(v) => updateParam('a11', v)} />
            <Input label="a12" value={params.a12} onChange={(v) => updateParam('a12', v)} />
            <Input label="a21" value={params.a21} onChange={(v) => updateParam('a21', v)} />
            <Input label="a22" value={params.a22} onChange={(v) => updateParam('a22', v)} />
            <Input label="b1" value={params.b1} onChange={(v) => updateParam('b1', v)} />
            <Input label="b2" value={params.b2} onChange={(v) => updateParam('b2', v)} />
          </div>
        </div>

        {/* View Controls */}
        <div className="fractal-control-section">
          <h2 className="fractal-section-title">View</h2>
          <Input label="Scale" value={params.scale} onChange={(v) => updateParam('scale', v)} step={0.1} />
        </div>

        {/* Render Mode */}
        <div className="fractal-control-section">
          <h2 className="fractal-section-title">Render Mode</h2>
          <div className="fractal-render-mode-toggle">
            <button
              onClick={() => onRenderModeChange('standard')}
              className={`fractal-render-mode-button ${renderMode === 'standard' ? 'fractal-render-mode-button-active' : ''}`}
            >
              Standard
            </button>
            <button
              onClick={() => onRenderModeChange('histogram')}
              className={`fractal-render-mode-button ${renderMode === 'histogram' ? 'fractal-render-mode-button-active' : ''}`}
            >
              Histogram
            </button>
          </div>
          {renderMode === 'histogram' && (
            <div className="fractal-histogram-colors">
              <div className="fractal-color-setting-row">
                <label className="fractal-color-label">Low Density</label>
                <input
                  type="color"
                  value={histogramColors.low}
                  onChange={(e) => onHistogramColorsChange({ ...histogramColors, low: e.target.value })}
                  className="fractal-color-input"
                />
              </div>
              <div className="fractal-color-setting-row">
                <label className="fractal-color-label">Mid Density</label>
                <input
                  type="color"
                  value={histogramColors.mid}
                  onChange={(e) => onHistogramColorsChange({ ...histogramColors, mid: e.target.value })}
                  className="fractal-color-input"
                />
              </div>
              <div className="fractal-color-setting-row">
                <label className="fractal-color-label">High Density</label>
                <input
                  type="color"
                  value={histogramColors.high}
                  onChange={(e) => onHistogramColorsChange({ ...histogramColors, high: e.target.value })}
                  className="fractal-color-input"
                />
              </div>
            </div>
          )}
        </div>

        {/* Loaded Presets */}
        {loadedPresets.length > 0 && (
          <div className="fractal-control-section">
            <div className="fractal-presets-header">
              <h2 className="fractal-section-title">Loaded Presets</h2>
              <label className="fractal-clear-on-load-toggle">
                <input
                  type="checkbox"
                  checked={clearOnLoad}
                  onChange={(e) => onClearOnLoadChange(e.target.checked)}
                  className="fractal-checkbox"
                />
                <span className="fractal-checkbox-label">Clear on load</span>
              </label>
            </div>
            <div className="fractal-presets-list">
              {loadedPresets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => onLoadPreset(preset)}
                  className="fractal-preset-item"
                >
                  <div className="fractal-preset-name">
                    {preset.name || `Preset ${index + 1}`}
                  </div>
                  {preset.figure && (
                    <div className="fractal-preset-figure">Fig. {preset.figure}</div>
                  )}
                  <div className="fractal-preset-info">
                    {preset.conj === 1 ? `D${preset.n}` : `Z${preset.n}`}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="fractal-actions">
           <button
            onClick={onClear}
            className="fractal-button fractal-button-clear"
          >
            Clear Screen
          </button>
          <button
            onClick={onReset}
            className="fractal-button fractal-button-reset"
          >
            Reset Defaults
          </button>
          <button
            onClick={onSaveParams}
            className="fractal-button fractal-button-save"
          >
            Save Parameters
          </button>
          <label className="fractal-button fractal-button-load">
            Load Parameters
            <input 
              type="file" 
              accept=".json" 
              onChange={onLoadParams}
              className="fractal-file-input" 
            />
          </label>
        </div>
      </div>
    </div>
  );
};


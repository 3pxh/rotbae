import React from 'react';
import type { SquareQuiltParams } from './types';
import { Input } from './Input';
import './ControlPanel.css';

type Preset = SquareQuiltParams & { name?: string; figure?: string };

interface ControlPanelProps {
  params: SquareQuiltParams;
  setParams: React.Dispatch<React.SetStateAction<SquareQuiltParams>>;
  onClear: () => void;
  onReset: () => void;
  onSaveParams: () => void;
  onLoadParams: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadPreset: (preset: Preset) => void;
  loadedPresets: Preset[];
  iterates: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ params, setParams, onClear, onReset, onSaveParams, onLoadParams, onLoadPreset, loadedPresets, iterates }) => {
  const updateParam = (key: keyof SquareQuiltParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const toggleColoring = () => {
    updateParam('toggle', params.toggle === 0 ? 1 : 0);
  };

  return (
    <div className="square-quilt-control-panel">
      <div className="square-quilt-control-header">
        <h1 className="square-quilt-control-title">Square Quilt</h1>
        <p className="square-quilt-control-subtitle">BASIC fractal generator</p>
      </div>

      <div className="square-quilt-control-content">
        
        {/* Status Display */}
        <div className="square-quilt-status">
          <div className="square-quilt-status-row">
            <span>Iterates:</span>
            <span className="square-quilt-status-value">{iterates.toLocaleString()}</span>
          </div>
          <div className="square-quilt-status-row">
            <span>Coloring:</span>
            <span className="square-quilt-status-value">{params.toggle === 0 ? 'Off' : 'On'}</span>
          </div>
          <div className="square-quilt-status-row">
            <span>Periods:</span>
            <span className="square-quilt-status-value">{params.nperiod}</span>
          </div>
        </div>

        {/* Parameters */}
        <div className="square-quilt-control-section">
          <h2 className="square-quilt-section-title">Parameters</h2>
          <Input label="Lambda" value={params.lambda} onChange={(v) => updateParam('lambda', v)} />
          <Input label="Alpha" value={params.alpha} onChange={(v) => updateParam('alpha', v)} />
          <Input label="Beta" value={params.beta} onChange={(v) => updateParam('beta', v)} />
          <Input label="Gamma" value={params.gamma} onChange={(v) => updateParam('gamma', v)} />
          <Input label="Omega" value={params.omega} onChange={(v) => updateParam('omega', v)} />
          <Input label="M" value={params.m} onChange={(v) => updateParam('m', v)} />
          <Input label="Shift" value={params.shift} onChange={(v) => updateParam('shift', v)} />
        </div>

        {/* Loaded Presets */}
        {loadedPresets.length > 0 && (
          <div className="square-quilt-control-section">
            <h2 className="square-quilt-section-title">Loaded Presets</h2>
            <div className="square-quilt-presets-list">
              {loadedPresets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => onLoadPreset(preset)}
                  className="square-quilt-preset-item"
                >
                  <div className="square-quilt-preset-name">
                    {preset.name || `Preset ${index + 1}`}
                  </div>
                  {preset.figure && (
                    <div className="square-quilt-preset-figure">Fig. {preset.figure}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* View Controls */}
        <div className="square-quilt-control-section">
          <h2 className="square-quilt-section-title">View</h2>
          <Input label="Periods" value={params.nperiod} onChange={(v) => updateParam('nperiod', Math.max(1, Math.floor(v)))} step={1} min={1} />
          <div className="square-quilt-toggle">
            <span className="square-quilt-toggle-label">Coloring</span>
            <button
              onClick={toggleColoring}
              className={`square-quilt-toggle-button ${params.toggle === 1 ? 'square-quilt-toggle-button-active' : ''}`}
            >
              {params.toggle === 0 ? 'Off' : 'On'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="square-quilt-actions">
          <button
            onClick={onClear}
            className="square-quilt-button square-quilt-button-clear"
          >
            Clear Screen
          </button>
          <button
            onClick={onReset}
            className="square-quilt-button square-quilt-button-reset"
          >
            Reset Defaults
          </button>
          <button
            onClick={onSaveParams}
            className="square-quilt-button square-quilt-button-save"
          >
            Save Parameters
          </button>
          <label className="square-quilt-button square-quilt-button-load">
            Load Parameters
            <input 
              type="file" 
              accept=".json" 
              onChange={onLoadParams}
              className="square-quilt-file-input" 
            />
          </label>
        </div>
      </div>
    </div>
  );
};


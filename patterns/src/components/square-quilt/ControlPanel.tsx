import React from 'react';
import type { SimulationParams } from './types';
import { PRESETS } from './types';
import './ControlPanel.css';

interface ControlPanelProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  onClear: () => void;
  onReset: () => void;
  isRunning: boolean;
  setIsRunning: (val: boolean) => void;
}

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}> = ({ label, value, min, max, step, onChange }) => (
  <div className="square-quilt-slider">
    <div className="square-quilt-slider-header">
      <label className="square-quilt-slider-label">{label}</label>
      <span className="square-quilt-slider-value">{value.toFixed(4)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="square-quilt-slider-input"
    />
  </div>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  setParams,
  onClear,
  onReset,
  isRunning,
  setIsRunning,
}) => {
  const handleChange = (key: keyof SimulationParams, value: number | string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="square-quilt-control-panel">
      <div className="square-quilt-control-header">
        <h2 className="square-quilt-control-title">Parameters</h2>
        <p className="square-quilt-control-subtitle">Adjust the chaos variables</p>
      </div>

      <div className="square-quilt-presets-section">
        <h3 className="square-quilt-presets-title">Presets</h3>
        <div className="square-quilt-presets-grid">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                onClear();
                setParams((prev) => ({ ...prev, ...preset.params }));
              }}
              className="square-quilt-preset-button"
              title={preset.name}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="square-quilt-controls-scroll">
        <div className="square-quilt-controls-content">
          <Slider
            label="Lambda (λ)"
            value={params.lambda}
            min={-3}
            max={3}
            step={0.01}
            onChange={(v) => handleChange('lambda', v)}
          />
          <Slider
            label="Alpha (α)"
            value={params.alpha}
            min={-3}
            max={3}
            step={0.01}
            onChange={(v) => handleChange('alpha', v)}
          />
          <Slider
            label="Beta (β)"
            value={params.beta}
            min={-1}
            max={1}
            step={0.01}
            onChange={(v) => handleChange('beta', v)}
          />
          <Slider
            label="Gamma (γ)"
            value={params.gamma}
            min={-1}
            max={1}
            step={0.01}
            onChange={(v) => handleChange('gamma', v)}
          />
          <Slider
            label="Omega (ω)"
            value={params.omega}
            min={-1}
            max={1}
            step={0.01}
            onChange={(v) => handleChange('omega', v)}
          />
          <Slider
            label="M Constant"
            value={params.ma}
            min={-1}
            max={1}
            step={0.01}
            onChange={(v) => handleChange('ma', v)}
          />
          
          <div className="square-quilt-settings-section">
            <h3 className="square-quilt-settings-title">Settings</h3>
            <Slider
              label="Periods (Tiling)"
              value={params.nperiod}
              min={1}
              max={10}
              step={1}
              onChange={(v) => {
                onClear();
                handleChange('nperiod', v);
              }}
            />
            <Slider
              label="Simulation Speed"
              value={params.speed}
              min={100}
              max={10000}
              step={100}
              onChange={(v) => handleChange('speed', v)}
            />
            <Slider
              label="Point Size"
              value={params.pointSize}
              min={0.5}
              max={5}
              step={0.1}
              onChange={(v) => handleChange('pointSize', v)}
            />
            <Slider
              label="Opacity"
              value={params.opacity}
              min={0.1}
              max={1}
              step={0.01}
              onChange={(v) => handleChange('opacity', v)}
            />
            <div className="square-quilt-shift-control">
              <label className="square-quilt-shift-label">Shift Offset</label>
              <button
                onClick={() => {
                  onClear();
                  handleChange('shift', params.shift === 0 ? 0.5 : 0);
                }}
                className={`square-quilt-shift-button ${params.shift > 0 ? 'square-quilt-shift-button-active' : ''}`}
              >
                {params.shift > 0 ? '+0.5' : '0.0'}
              </button>
            </div>
            <div className="square-quilt-color-control">
              <label className="square-quilt-color-label">Color</label>
              <input
                type="color"
                value={params.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className="square-quilt-color-input"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="square-quilt-actions">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`square-quilt-action-button square-quilt-action-button-toggle ${isRunning ? 'square-quilt-action-button-pause' : 'square-quilt-action-button-start'}`}
        >
          {isRunning ? 'Pause' : 'Start Simulation'}
        </button>
        <div className="square-quilt-action-buttons-row">
          <button
            onClick={onClear}
            className="square-quilt-action-button square-quilt-action-button-secondary"
          >
            Clear Canvas
          </button>
          <button
            onClick={onReset}
            className="square-quilt-action-button square-quilt-action-button-secondary"
          >
            Reset Params
          </button>
        </div>
      </div>
    </div>
  );
};

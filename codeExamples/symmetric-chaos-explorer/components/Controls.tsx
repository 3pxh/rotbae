import React from 'react';
import { SimulationParams, DEFAULT_PARAMS, PRESETS } from '../types';

interface ControlsProps {
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
  <div className="mb-4">
    <div className="flex justify-between mb-1">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>
      <span className="text-xs font-mono text-sky-400">{value.toFixed(4)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400 transition-colors"
    />
  </div>
);

export const Controls: React.FC<ControlsProps> = ({
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
    <div className="bg-slate-800/50 backdrop-blur-sm border-l border-slate-700 p-6 h-full overflow-y-auto w-full md:w-80 flex flex-col shadow-2xl z-10">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Parameters</h2>
        <p className="text-xs text-slate-500">Adjust the chaos variables</p>
      </div>

      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-300 uppercase mb-3">Presets</h3>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                onClear();
                setParams((prev) => ({ ...prev, ...preset.params }));
              }}
              className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-700 hover:bg-sky-600 hover:text-white rounded transition-colors text-left truncate"
              title={preset.name}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-2">
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
        
        <div className="my-4 border-t border-slate-700 pt-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase mb-3">Settings</h3>
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
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-medium text-slate-400 uppercase">Shift Offset</label>
              <button
                onClick={() => {
                    onClear();
                    handleChange('shift', params.shift === 0 ? 0.5 : 0);
                }}
                className={`text-xs px-2 py-1 rounded border transition-colors ${params.shift > 0 ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'bg-slate-700 border-slate-600 text-slate-400'}`}
              >
                {params.shift > 0 ? '+0.5' : '0.0'}
              </button>
            </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition-all shadow-lg ${
            isRunning
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/50 hover:bg-amber-500/20'
              : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-emerald-500/20'
          }`}
        >
          {isRunning ? 'Pause' : 'Start Simulation'}
        </button>
        <div className="flex space-x-3">
            <button
            onClick={onClear}
            className="flex-1 py-2 rounded-lg bg-slate-700 text-white font-semibold text-xs uppercase hover:bg-slate-600 transition-colors"
            >
            Clear Canvas
            </button>
            <button
            onClick={onReset}
            className="flex-1 py-2 rounded-lg bg-slate-700 text-white font-semibold text-xs uppercase hover:bg-slate-600 transition-colors"
            >
            Reset Params
            </button>
        </div>
      </div>
    </div>
  );
};
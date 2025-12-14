import React from 'react';

interface InputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

const Input: React.FC<InputProps> = ({ label, value, onChange, step = 0.01, min, max }) => {
  return (
    <div className="flex flex-col gap-1 mb-3">
      <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        step={step}
        min={min}
        max={max}
        className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded px-2 py-1 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
      />
    </div>
  );
};

export default Input;

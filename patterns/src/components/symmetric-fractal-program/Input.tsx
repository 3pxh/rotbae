import React from 'react';
import './Input.css';

interface InputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

export const Input: React.FC<InputProps> = ({ label, value, onChange, step = 0.01, min, max }) => {
  return (
    <div className="fractal-input">
      <label className="fractal-input-label">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        step={step}
        min={min}
        max={max}
        className="fractal-input-field"
      />
    </div>
  );
};


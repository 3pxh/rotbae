import React from 'react';
import { IFSParams } from '../types';
import Input from './Input';

interface ControlPanelProps {
  params: IFSParams;
  setParams: React.Dispatch<React.SetStateAction<IFSParams>>;
  onClear: () => void;
  onReset: () => void;
  pointCount: number;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ params, setParams, onClear, onReset, pointCount }) => {
  const updateParam = (key: keyof IFSParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSymmetry = () => {
    updateParam('conj', params.conj === 1 ? 0 : 1);
  };

  // Check contraction warning condition from BASIC code:
  // IF a1 > 1 OR a2 > 1 OR a1 + a2 > 1 + (a11 * a22 - a12 * a21)^2 THEN PRINT "WARNING..."
  const a1 = params.a11 * params.a11 + params.a21 * params.a21;
  const a2 = params.a21 * params.a21 + params.a22 * params.a22;
  const det = params.a11 * params.a22 - params.a12 * params.a21;
  const isWarning = a1 > 1 || a2 > 1 || (a1 + a2) > (1 + det * det);

  return (
    <div className="w-full md:w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="p-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-cyan-400 mb-1">IFS Generator</h1>
        <p className="text-xs text-slate-500 font-mono">Based on BASIC logic</p>
      </div>

      <div className="p-4 flex-1 space-y-6">
        
        {/* Status Display */}
        <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Points:</span>
            <span className="text-white">{pointCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-400 mt-1">
             <span>Symmetry:</span>
             <span className="text-yellow-400">{params.conj === 1 ? `Dn (${params.n})` : `Zn (${params.n})`}</span>
          </div>
           {isWarning && (
            <div className="mt-2 text-red-400 border-t border-slate-800 pt-1">
              Warning: Affine mapping may not be a contraction.
            </div>
          )}
        </div>

        {/* Symmetry Controls */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 border-b border-slate-700 pb-1">Symmetry</h2>
          <Input label="Degree (n)" value={params.n} onChange={(v) => updateParam('n', Math.max(1, Math.floor(v)))} step={1} min={1} />
          <div className="flex items-center justify-between bg-slate-800 p-2 rounded border border-slate-700">
            <span className="text-xs text-slate-400 font-mono uppercase">Type</span>
            <button
              onClick={toggleSymmetry}
              className={`px-3 py-1 text-xs rounded font-bold transition-colors ${
                params.conj === 1 
                  ? 'bg-purple-600 text-white hover:bg-purple-500' 
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {params.conj === 1 ? 'Dn (Reflection)' : 'Zn (Rotation)'}
            </button>
          </div>
        </div>

        {/* Coefficients */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 border-b border-slate-700 pb-1">Affine Coefficients</h2>
          <div className="grid grid-cols-2 gap-3">
            <Input label="a11" value={params.a11} onChange={(v) => updateParam('a11', v)} />
            <Input label="a12" value={params.a12} onChange={(v) => updateParam('a12', v)} />
            <Input label="a21" value={params.a21} onChange={(v) => updateParam('a21', v)} />
            <Input label="a22" value={params.a22} onChange={(v) => updateParam('a22', v)} />
            <Input label="b1" value={params.b1} onChange={(v) => updateParam('b1', v)} />
            <Input label="b2" value={params.b2} onChange={(v) => updateParam('b2', v)} />
          </div>
        </div>

        {/* View Controls */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 border-b border-slate-700 pb-1">View</h2>
          <Input label="Scale" value={params.scale} onChange={(v) => updateParam('scale', v)} step={0.1} />
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-col gap-2">
           <button
            onClick={onClear}
            className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-semibold transition-colors border border-slate-600"
          >
            Clear Screen
          </button>
          <button
            onClick={onReset}
            className="w-full py-2 bg-red-900/50 hover:bg-red-900/80 text-red-200 rounded text-sm font-semibold transition-colors border border-red-900"
          >
            Reset Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;

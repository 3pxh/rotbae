export type SimulationParams = {
  lambda: number;
  alpha: number;
  beta: number;
  gamma: number;
  omega: number;
  n: number;
  scale: number;
}

export const DEFAULT_PARAMS: SimulationParams = {
  lambda: -1.8,
  alpha: 2,
  beta: 0,
  gamma: 1,
  omega: 0,
  n: 4,
  scale: 1,
};

export type SavedPreset = {
  id: string;
  name: string;
  timestamp: number;
  params: SimulationParams;
}

export function isSimulationParams(value: unknown): value is SimulationParams {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Record<string, unknown>
  return (
    typeof p.lambda === 'number' &&
    typeof p.alpha === 'number' &&
    typeof p.beta === 'number' &&
    typeof p.gamma === 'number' &&
    typeof p.omega === 'number' &&
    typeof p.n === 'number' &&
    typeof p.scale === 'number'
  )
}

export function isValidSavedPreset(p: unknown): p is SavedPreset {
  if (typeof p !== 'object' || p === null) return false
  const o = p as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.timestamp === 'number' &&
    isSimulationParams(o.params)
  )
}


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


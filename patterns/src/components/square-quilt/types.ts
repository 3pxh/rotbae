export type SquareQuiltParams = {
  lambda: number;
  alpha: number;
  beta: number;
  gamma: number;
  omega: number;
  m: number; // ma in BASIC
  shift: number;
  nperiod: number; // Number of periods
  toggle: number; // 0 = coloring off, 1 = coloring on
}

export const DEFAULT_PARAMS: SquareQuiltParams = {
  lambda: -0.59,
  alpha: 0.2,
  beta: 0.1,
  gamma: -0.09,
  omega: 0,
  m: 0,
  shift: 0,
  nperiod: 3,
  toggle: 0,
};


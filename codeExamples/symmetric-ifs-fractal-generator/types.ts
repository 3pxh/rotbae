export interface IFSParams {
  a11: number;
  a12: number;
  a21: number;
  a22: number;
  b1: number;
  b2: number;
  n: number; // Degree of symmetry
  conj: number; // 0 for Zn, 1 for Dn (conjugate symmetry)
  scale: number;
}

export const DEFAULT_PARAMS: IFSParams = {
  a11: 0.4,
  a12: 0.35,
  a21: 0.2,
  a22: 0.4,
  b1: 0,
  b2: 0.4,
  n: 3,
  conj: 1,
  scale: 1,
};

export type SimulationParams = {
  lambda: number;
  alpha: number;
  beta: number;
  gamma: number;
  omega: number;
  ma: number; // The 'm' parameter
  shift: number; // The shift parameter (default 0 in init, toggles to 0.5 in menu)
  nperiod: number; // Tiling
  speed: number; // Iterations per frame
  pointSize: number;
  opacity: number;
  color: string;
}

export const DEFAULT_PARAMS: SimulationParams = {
  lambda: -0.59,
  alpha: 0.2,
  beta: 0.1,
  gamma: -0.09,
  omega: 0,
  ma: 0,
  shift: 0,
  nperiod: 3,
  speed: 2000,
  pointSize: 1,
  opacity: 0.3,
  color: '#38bdf8' // sky-400
};

export type Preset = {
  name: string;
  params: Partial<SimulationParams>;
}

export const PRESETS: Preset[] = [
  { 
    name: "Emerald Mosaic", 
    params: { lambda: -0.59, alpha: 0.2, beta: 0.1, gamma: -0.33, omega: 0.0, ma: 2, shift: 0 } 
  },
  { 
    name: "Sugar and Spice", 
    params: { lambda: -0.59, alpha: 0.2, beta: 0.1, gamma: -0.27, omega: 0.0, ma: 0, shift: 0.5 } 
  },
  { 
    name: "Sicilian Tile", 
    params: { lambda: -0.2, alpha: -0.1, beta: 0.1, gamma: -0.25, omega: 0.0, ma: 0, shift: 0 } 
  },
  { 
    name: "Roses", 
    params: { lambda: 0.25, alpha: -0.3, beta: 0.2, gamma: 0.3, omega: 0.0, ma: 1, shift: 0 } 
  },
  { 
    name: "Wagonwheels", 
    params: { lambda: -0.28, alpha: 0.25, beta: 0.05, gamma: -0.24, omega: 0.0, ma: -1, shift: 0 } 
  },
  { 
    name: "Victorian Tiles", 
    params: { lambda: -0.12, alpha: -0.36, beta: 0.18, gamma: -0.14, omega: 0.0, ma: 1, shift: 0.5 } 
  },
  { 
    name: "Mosque", 
    params: { lambda: 0.1, alpha: 0.2, beta: 0.1, gamma: 0.39, omega: 0.0, ma: -1, shift: 0 } 
  },
  { 
    name: "Red Tiles", 
    params: { lambda: -0.589, alpha: 0.2, beta: 0.04, gamma: -0.2, omega: 0.0, ma: 0, shift: 0.5 } 
  },
  { 
    name: "Cathedral Attractor", 
    params: { lambda: -0.28, alpha: 0.08, beta: 0.45, gamma: -0.05, omega: 0.0, ma: 2, shift: 0.5 } 
  },
  { 
    name: "Gyroscopes", 
    params: { lambda: -0.59, alpha: 0.2, beta: 0.2, gamma: 0.3, omega: 0.0, ma: 2, shift: 0 } 
  },
  { 
    name: "Cats Eyes", 
    params: { lambda: -0.28, alpha: 0.25, beta: 0.05, gamma: -0.24, omega: 0.0, ma: -1, shift: 0.5 } 
  },
  { 
    name: "Flowers with Ribbons", 
    params: { lambda: -0.11, alpha: -0.26, beta: 0.19, gamma: -0.059, omega: 0.07, ma: 2, shift: 0.5 } 
  }
];

export type MemoryUnit =
  | 'MB'
  | 'GB'
  | 'TB'

export type MemorySettings = {
  size: number;
  unit: MemoryUnit;
};

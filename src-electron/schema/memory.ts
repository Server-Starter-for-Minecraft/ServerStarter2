export type MemoryUnit =
  | 'B'
  | 'KB'
  | 'MB'
  | 'GB'
  | 'TB'
  | ''
  | 'K'
  | 'M'
  | 'G'
  | 'T';

export type MemorySettings = {
  size: number;
  unit: MemoryUnit;
};

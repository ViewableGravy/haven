/***** TYPE DEFINITIONS *****/
export type CornerPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

export type MemoryStatsProps = {
  corner?: CornerPosition;
};

export type MemoryData = {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
};

export type PerformanceWithMemory = Performance & {
  memory?: MemoryData;
};

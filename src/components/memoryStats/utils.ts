/***** UTILITY FUNCTIONS *****/
export const bytesToSize = (bytes: number, nFractDigit: number = 0): string => {
  if (bytes === 0) return 'n/a';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const precision = Math.pow(10, nFractDigit);
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return Math.round((bytes * precision) / Math.pow(1024, i)) / precision + ' ' + sizes[i];
};

export const getCornerClassName = (corner: string): string => {
  switch (corner) {
    case 'topLeft':
      return 'memory-stats-container--top-left';
    case 'topRight':
      return 'memory-stats-container--top-right';
    case 'bottomLeft':
      return 'memory-stats-container--bottom-left';
    case 'bottomRight':
      return 'memory-stats-container--bottom-right';
    default:
      return 'memory-stats-container--top-right';
  }
};

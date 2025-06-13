import { useCallback, useEffect, useState } from 'react';
import { GameConstants } from "../../shared/constants";
import './MemoryStats.css';
import type { MemoryStatsProps, PerformanceWithMemory } from './types';
import { bytesToSize, getCornerClassName } from './utils';

/***** TYPE DEFINITIONS *****/
type Bars = Array<{
  height: number;
  color: string;
}>;

const DEFAULT_BARS: Bars = Array.from({ length: 74 }, () => ({ height: 30, color: '#131' }));

/***** MEMORY STATS COMPONENT *****/
const _MemoryStats: React.FC<MemoryStatsProps> = ({ 
  corner = 'topRight' 
}) => {
  const [memoryText, setMemoryText] = useState('Memory');
  const [graphBars, setGraphBars] = useState<Bars>(DEFAULT_BARS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Memory tracking refs (these are fine to use for non-DOM values)
  const [lastTimeRef] = useState({ current: Date.now() });
  const [lastUsedHeapRef] = useState({ current: 0 });
  const [redrawMBThresholdRef] = useState({ current: 30 });

  const updateGraph = useCallback((height: number, color: string) => {
    setGraphBars((prevBars) => {
      const newBars = [...prevBars];
      // Move first element to end and update it
      const firstBar = newBars.shift()!;
      firstBar.height = height;
      firstBar.color = color;
      newBars.push(firstBar);
      return newBars;
    });
  }, []);

  const redrawGraph = useCallback((oHFactor: number, hFactor: number) => {
    setGraphBars((prevBars) => 
      prevBars.map((bar) => ({
        ...bar,
        height: 30 - ((30 - bar.height) / oHFactor) * hFactor
      }))
    );
  }, []);

  const updateMemoryStats = useCallback(() => {
    if (!isInitialized) return;

    const now = Date.now();
    // Update at 60fps for smoother animation
    if (now - lastTimeRef.current < 1000 / 60) return;
    lastTimeRef.current = now;

    const performanceWithMemory = window.performance as PerformanceWithMemory;
    const currentUsedHeap = performanceWithMemory.memory?.usedJSHeapSize || 0;
    
    const delta = currentUsedHeap - lastUsedHeapRef.current;
    lastUsedHeapRef.current = currentUsedHeap;

    // If memory has gone down, consider it a GC and draw a red bar
    const color = delta < 0 ? '#ff0000' : '#131';

    setMemoryText(`Mem: ${bytesToSize(currentUsedHeap, 2)}`);

    const mbValue = currentUsedHeap / (1024 * 1024);
    const GRAPH_HEIGHT = 30;

    if (mbValue > redrawMBThresholdRef.current) {
      const factor = (mbValue - (mbValue % GRAPH_HEIGHT)) / GRAPH_HEIGHT;
      const newThreshold = GRAPH_HEIGHT * (factor + 1);
      redrawGraph(
        GRAPH_HEIGHT / redrawMBThresholdRef.current,
        GRAPH_HEIGHT / newThreshold
      );
      redrawMBThresholdRef.current = newThreshold;
    }

    updateGraph(
      GRAPH_HEIGHT - mbValue * (GRAPH_HEIGHT / redrawMBThresholdRef.current),
      color
    );
  }, [isInitialized, updateGraph, redrawGraph]);

  // Initialize memory polyfill
  useEffect(() => {
    const performanceWithMemory = window.performance as PerformanceWithMemory;
    if (performanceWithMemory && !performanceWithMemory.memory) {
      performanceWithMemory.memory = { usedJSHeapSize: 0, totalJSHeapSize: 0 };
    }

    if (performanceWithMemory.memory?.totalJSHeapSize === 0) {
      console.warn('totalJSHeapSize === 0... performance.memory is only available in Chrome.');
    }

    // Initialize tracking values
    lastUsedHeapRef.current = performanceWithMemory.memory?.usedJSHeapSize || 0;
    setIsInitialized(true);
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isInitialized) return;

    let animationId: number;

    const animate = () => {
      updateMemoryStats();
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isInitialized, updateMemoryStats]);

  const cornerClassName = getCornerClassName(corner);

  return (
    <div className={`memory-stats-container ${cornerClassName}`}>
      <div className="memory-stats-content">
        <div className="memory-stats-text">
          {memoryText}
        </div>
        <div className="memory-stats-graph">
          {graphBars.map((bar, index) => (
            <span
              key={index}
              className="memory-stats-bar"
              style={{
                height: `${bar.height}px`,
                backgroundColor: bar.color
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const MemoryStats = (props: MemoryStatsProps) => {
  if (!GameConstants.MEMORY_STATS_ENABLED) return null;

  return <_MemoryStats {...props} />;
}

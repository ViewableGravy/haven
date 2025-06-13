import { useCallback, useEffect, useRef, useState } from 'react';

/***** TYPE DEFINITIONS *****/
interface MemoryStatsProps {
  corner?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

interface MemoryData {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: MemoryData;
}

/***** UTILITY FUNCTIONS *****/
const bytesToSize = (bytes: number, nFractDigit: number = 0): string => {
  if (bytes === 0) return 'n/a';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const precision = Math.pow(10, nFractDigit);
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return Math.round((bytes * precision) / Math.pow(1024, i)) / precision + ' ' + sizes[i];
};

const getCornerStyles = (corner: string) => {
  const base = { position: 'fixed' as const, zIndex: 10000 };
  
  switch (corner) {
    case 'topLeft':
      return { ...base, top: '0px', left: '0px' };
    case 'topRight':
      return { ...base, top: '0px', right: '0px' };
    case 'bottomLeft':
      return { ...base, bottom: '0px', left: '0px' };
    case 'bottomRight':
      return { ...base, bottom: '0px', right: '0px' };
    default:
      return { ...base, top: '0px', right: '0px' };
  }
};

/***** MEMORY STATS HOOK *****/
const useMemoryStats = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Memory tracking state
  const lastTimeRef = useRef(Date.now());
  const lastUsedHeapRef = useRef(0);
  const redrawMBThresholdRef = useRef(30);
  
  // DOM element refs
  const msTextRef = useRef<HTMLDivElement | null>(null);
  const msGraphRef = useRef<HTMLDivElement | null>(null);

  const initializeMemoryStats = useCallback(() => {
    if (!containerRef.current || isInitialized) return;

    const container = containerRef.current;
    container.style.cssText = 'width:80px;height:48px;opacity:0.9;cursor:pointer;overflow:hidden;z-index:10000;will-change:transform;';

    // Create main memory div
    const msDiv = document.createElement('div');
    msDiv.style.cssText = 'padding:0 0 3px 3px;text-align:left;background-color:#020;';
    container.appendChild(msDiv);

    // Create text element
    const msText = document.createElement('div');
    msText.style.cssText = 'color:#0f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
    msText.innerHTML = 'Memory';
    msDiv.appendChild(msText);
    msTextRef.current = msText;

    // Create graph element
    const msGraph = document.createElement('div');
    msGraph.style.cssText = 'position:relative;width:74px;height:30px;background-color:#0f0';
    msDiv.appendChild(msGraph);
    msGraphRef.current = msGraph;

    // Create graph bars
    for (let i = 0; i < 74; i++) {
      const bar = document.createElement('span');
      bar.style.cssText = 'width:1px;height:30px;float:left;background-color:#131';
      msGraph.appendChild(bar);
    }

    // Initialize performance memory polyfill
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
  }, [isInitialized]);

  const updateGraph = useCallback((dom: HTMLElement, height: number, color: string) => {
    if (!dom.firstChild) return;
    
    const child = dom.appendChild(dom.firstChild) as HTMLElement;
    child.style.height = height + 'px';
    if (color) child.style.backgroundColor = color;
  }, []);

  const redrawGraph = useCallback((dom: HTMLElement, oHFactor: number, hFactor: number) => {
    Array.from(dom.children).forEach((child) => {
      const htmlChild = child as HTMLElement;
      const cHeight = parseInt(htmlChild.style.height.substring(0, htmlChild.style.height.length - 2));
      const newVal = 30 - ((30 - cHeight) / oHFactor) * hFactor;
      htmlChild.style.height = newVal + 'px';
    });
  }, []);

  const updateMemoryStats = useCallback(() => {
    if (!isInitialized || !msTextRef.current || !msGraphRef.current) return;

    const now = Date.now();
    // Update at 30fps
    if (now - lastTimeRef.current < 1000 / 30) return;
    lastTimeRef.current = now;

    const performanceWithMemory = window.performance as PerformanceWithMemory;
    const currentUsedHeap = performanceWithMemory.memory?.usedJSHeapSize || 0;
    
    const delta = currentUsedHeap - lastUsedHeapRef.current;
    lastUsedHeapRef.current = currentUsedHeap;

    // If memory has gone down, consider it a GC and draw a red bar
    const color = delta < 0 ? '#830' : '#131';

    msTextRef.current.textContent = "Mem: " + bytesToSize(currentUsedHeap, 2);

    const mbValue = currentUsedHeap / (1024 * 1024);
    const GRAPH_HEIGHT = 30;

    if (mbValue > redrawMBThresholdRef.current) {
      const factor = (mbValue - (mbValue % GRAPH_HEIGHT)) / GRAPH_HEIGHT;
      const newThreshold = GRAPH_HEIGHT * (factor + 1);
      redrawGraph(
        msGraphRef.current,
        GRAPH_HEIGHT / redrawMBThresholdRef.current,
        GRAPH_HEIGHT / newThreshold
      );
      redrawMBThresholdRef.current = newThreshold;
    }

    updateGraph(
      msGraphRef.current,
      GRAPH_HEIGHT - mbValue * (GRAPH_HEIGHT / redrawMBThresholdRef.current),
      color
    );
  }, [isInitialized, updateGraph, redrawGraph]);

  useEffect(() => {
    initializeMemoryStats();
  }, [initializeMemoryStats]);

  useEffect(() => {
    if (!isInitialized) return;

    const animate = () => {
      updateMemoryStats();
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isInitialized, updateMemoryStats]);

  return containerRef;
};

/***** MEMORY STATS COMPONENT *****/
export const MemoryStats: React.FC<MemoryStatsProps> = ({ 
  corner = 'topRight' 
}) => {
  const containerRef = useMemoryStats();
  const styles = getCornerStyles(corner);

  return <div ref={containerRef} style={styles} />;
};

export default MemoryStats;

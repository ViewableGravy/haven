import type { ChunkWorkerMessage, ChunkWorkerResponse } from "./chunkWorker";

export interface WorkerTask {
  id: string;
  message: ChunkWorkerMessage;
  resolve: (response: ChunkWorkerResponse) => void;
  reject: (error: Error) => void;
}

export class WorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private workerTasks = new Map<Worker, WorkerTask>();
  private maxWorkers: number;
  private seedValue?: string | number;

  constructor(
    maxWorkers: number = navigator.hardwareConcurrency || 4
  ) {
    this.maxWorkers = Math.min(maxWorkers, 8); // Cap at 8 workers to avoid overwhelming
    this.initializeWorkers();
  }

  public async setSeed(seed: string | number): Promise<void> {
    this.seedValue = seed;
    
    // Seed all existing workers
    const seedPromises = this.workers.map(worker => this.seedWorker(worker));
    await Promise.all(seedPromises);
  }

  private async seedWorker(worker: Worker): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker seed timeout'));
      }, 5000);

      const handleMessage = (event: MessageEvent<ChunkWorkerResponse>) => {
        if (event.data.type === 'seedSet') {
          clearTimeout(timeout);
          worker.removeEventListener('message', handleMessage);
          resolve();
        }
      };

      const handleError = (error: ErrorEvent) => {
        clearTimeout(timeout);
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        reject(new Error(`Worker seed error: ${error.message}`));
      };

      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError);

      worker.postMessage({
        type: 'setSeed',
        data: { seed: this.seedValue }
      } as ChunkWorkerMessage);
    });
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker(
        new URL('./chunkWorker.ts', import.meta.url),
        { type: 'module' }
      );
      
      worker.onmessage = (event: MessageEvent<ChunkWorkerResponse>) => {
        // Skip seed responses as they're handled separately
        if (event.data.type === 'seedSet') return;

        const task = this.workerTasks.get(worker);
        if (task) {
          this.workerTasks.delete(worker);
          task.resolve(event.data);
          this.releaseWorker(worker);
        }
      };

      worker.onerror = (error) => {
        const task = this.workerTasks.get(worker);
        if (task) {
          this.workerTasks.delete(worker);
          task.reject(new Error(`Worker error: ${error.message}`));
          this.releaseWorker(worker);
        }
      };

      this.workers.push(worker);
      this.availableWorkers.push(worker);

      // If we already have a seed, apply it to this new worker
      if (this.seedValue !== undefined) {
        this.seedWorker(worker).catch(console.error);
      }
    }
  }

  public execute(message: ChunkWorkerMessage): Promise<ChunkWorkerResponse> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask = {
        id: `${message.data.chunkX},${message.data.chunkY}`,
        message,
        resolve,
        reject
      };

      this.taskQueue.push(task);
      this.processQueue();
    });
  }

  private processQueue(): void {
    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const task = this.taskQueue.shift()!;
      const worker = this.availableWorkers.shift()!;
      
      this.workerTasks.set(worker, task);
      worker.postMessage(task.message);
    }
  }

  private releaseWorker(worker: Worker): void {
    this.availableWorkers.push(worker);
    this.processQueue();
  }

  public terminate(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
    this.workerTasks.clear();
  }

  public getQueueSize(): number {
    return this.taskQueue.length;
  }

  public getActiveWorkers(): number {
    return this.workerTasks.size;
  }
}
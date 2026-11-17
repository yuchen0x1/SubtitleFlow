export interface QueueOptions {
  concurrency?: number;
}

interface PendingTask<T> {
  run: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

export class AsyncQueue {
  private readonly concurrency: number;
  private active = 0;
  private pending: PendingTask<any>[] = [];

  constructor(options: QueueOptions = {}) {
    this.concurrency = Math.max(1, options.concurrency ?? 1);
  }

  add<T>(run: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.pending.push({ run, resolve, reject });
      this.pump();
    });
  }

  clear(reason = new Error('Queue cleared')): void {
    const pending = this.pending.splice(0);
    for (const task of pending) task.reject(reason);
  }

  get size(): number {
    return this.pending.length;
  }

  private pump(): void {
    while (this.active < this.concurrency && this.pending.length) {
      const task = this.pending.shift();
      if (!task) return;
      this.active += 1;
      task.run().then(task.resolve, task.reject).finally(() => {
        this.active -= 1;
        this.pump();
      });
    }
  }
}

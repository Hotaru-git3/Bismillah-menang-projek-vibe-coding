export class RateLimiter {
  private queue: Array<{
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    retries: number;
  }> = [];
  private processing = false;
  private lastCallTime = 0;
  private minInterval = 2000; // 30 RPM
  private maxRetries = 3;

  async enqueue<T>(fn: () => Promise<T>, retries = this.maxRetries): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject, retries });
      if (!this.processing) this.processQueue();
    });
  }

  private async processQueue() {
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastCall = now - this.lastCallTime;

      if (timeSinceLastCall < this.minInterval) {
        await this.sleep(this.minInterval - timeSinceLastCall);
      }

      const task = this.queue.shift()!;
      try {
        const result = await task.fn();
        task.resolve(result);
      } catch (error: any) {
        if (task.retries > 0 && this.isRetryableError(error)) {
          // Re-queue with backoff
          task.retries--;
          const backoff = Math.pow(2, this.maxRetries - task.retries) * 1000;
          await this.sleep(backoff);
          this.queue.unshift(task);
          console.log(`🔄 Retry ${this.maxRetries - task.retries}/${this.maxRetries}`);
        } else {
          task.reject(error);
        }
      }
      this.lastCallTime = Date.now();
    }

    this.processing = false;
  }

  private isRetryableError(error: any): boolean {
    const status = error?.response?.status;
    return status === 429 || status === 503 || status === 502 || !status;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const aiRateLimiter = new RateLimiter();

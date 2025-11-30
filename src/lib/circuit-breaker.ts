export class CircuitBreaker {
  private threshold: number;
  private total: number = 0;
  private failures: number = 0;

  constructor(threshold: number = 0.5) {
    this.threshold = threshold;
  }

  recordSuccess(): void {
    this.total++;
  }

  recordFailure(): void {
    this.total++;
    this.failures++;
  }

  isOpen(): boolean {
    if (this.total === 0) return false;
    return this.failures / this.total > this.threshold;
  }

  getStats(): { total: number; failures: number; rate: number } {
    return {
      total: this.total,
      failures: this.failures,
      rate: this.total > 0 ? this.failures / this.total : 0
    };
  }

  reset(): void {
    this.total = 0;
    this.failures = 0;
  }
}

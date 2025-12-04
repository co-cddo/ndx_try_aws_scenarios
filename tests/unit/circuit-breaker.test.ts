import { describe, it, expect, beforeEach } from 'vitest';
import { CircuitBreaker } from '../../src/lib/circuit-breaker.js';

describe('Circuit Breaker (AC3.11)', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker(0.5); // 50% threshold
  });

  describe('initialization', () => {
    it('should start closed', () => {
      expect(breaker.isOpen()).toBe(false);
    });

    it('should start with zero counts', () => {
      const stats = breaker.getStats();
      expect(stats.total).toBe(0);
      expect(stats.failures).toBe(0);
      expect(stats.rate).toBe(0);
    });
  });

  describe('recording', () => {
    it('should track successes', () => {
      breaker.recordSuccess();
      breaker.recordSuccess();
      const stats = breaker.getStats();
      expect(stats.total).toBe(2);
      expect(stats.failures).toBe(0);
    });

    it('should track failures', () => {
      breaker.recordFailure();
      const stats = breaker.getStats();
      expect(stats.total).toBe(1);
      expect(stats.failures).toBe(1);
    });
  });

  describe('threshold detection', () => {
    it('should open when failures exceed 50%', () => {
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordSuccess();
      // 2 failures out of 3 = 66.7%
      expect(breaker.isOpen()).toBe(true);
    });

    it('should stay closed at exactly 50%', () => {
      breaker.recordFailure();
      breaker.recordSuccess();
      // 1 failure out of 2 = 50%, not exceeding threshold
      expect(breaker.isOpen()).toBe(false);
    });

    it('should open at 51%+', () => {
      // 51 failures, 49 successes = 51%
      for (let i = 0; i < 51; i++) breaker.recordFailure();
      for (let i = 0; i < 49; i++) breaker.recordSuccess();
      expect(breaker.isOpen()).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset all counts', () => {
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.reset();
      const stats = breaker.getStats();
      expect(stats.total).toBe(0);
      expect(stats.failures).toBe(0);
      expect(breaker.isOpen()).toBe(false);
    });
  });
});

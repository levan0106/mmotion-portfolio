import { Injectable, Logger } from '@nestjs/common';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  timeout: number; // Time in ms to wait before trying again
  successThreshold: number; // Number of successes needed to close circuit (in HALF_OPEN state)
  monitoringPeriod: number; // Time window for counting failures
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: Date | null;
  lastSuccessTime: Date | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private circuits = new Map<string, {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    lastFailureTime: Date | null;
    lastSuccessTime: Date | null;
    totalRequests: number;
    totalFailures: number;
    totalSuccesses: number;
    config: CircuitBreakerConfig;
  }>();

  private readonly defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    timeout: 60000, // 1 minute
    successThreshold: 3,
    monitoringPeriod: 300000 // 5 minutes
  };

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    circuitName: string,
    operation: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const circuitConfig = { ...this.defaultConfig, ...config };
    const circuit = this.getOrCreateCircuit(circuitName, circuitConfig);

    // Check if circuit is open and should remain open
    if (circuit.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset(circuit)) {
        circuit.state = CircuitState.HALF_OPEN;
        circuit.successCount = 0;
        this.logger.log(`Circuit ${circuitName} moved to HALF_OPEN state`);
      } else {
        throw new Error(`Circuit ${circuitName} is OPEN - too many failures`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess(circuitName, circuit);
      return result;
    } catch (error) {
      this.onFailure(circuitName, circuit);
      throw error;
    }
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(circuitName: string): CircuitBreakerStats | null {
    const circuit = this.circuits.get(circuitName);
    if (!circuit) return null;

    return {
      state: circuit.state,
      failureCount: circuit.failureCount,
      successCount: circuit.successCount,
      lastFailureTime: circuit.lastFailureTime,
      lastSuccessTime: circuit.lastSuccessTime,
      totalRequests: circuit.totalRequests,
      totalFailures: circuit.totalFailures,
      totalSuccesses: circuit.totalSuccesses
    };
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [name, circuit] of this.circuits) {
      stats[name] = {
        state: circuit.state,
        failureCount: circuit.failureCount,
        successCount: circuit.successCount,
        lastFailureTime: circuit.lastFailureTime,
        lastSuccessTime: circuit.lastSuccessTime,
        totalRequests: circuit.totalRequests,
        totalFailures: circuit.totalFailures,
        totalSuccesses: circuit.totalSuccesses
      };
    }
    return stats;
  }

  /**
   * Reset a circuit breaker
   */
  reset(circuitName: string): void {
    const circuit = this.circuits.get(circuitName);
    if (circuit) {
      circuit.state = CircuitState.CLOSED;
      circuit.failureCount = 0;
      circuit.successCount = 0;
      circuit.lastFailureTime = null;
      circuit.lastSuccessTime = null;
      this.logger.log(`Circuit ${circuitName} has been reset`);
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const [name, circuit] of this.circuits) {
      circuit.state = CircuitState.CLOSED;
      circuit.failureCount = 0;
      circuit.successCount = 0;
      circuit.lastFailureTime = null;
      circuit.lastSuccessTime = null;
    }
    this.logger.log('All circuits have been reset');
  }

  /**
   * Check if a circuit is healthy
   */
  isHealthy(circuitName: string): boolean {
    const circuit = this.circuits.get(circuitName);
    return circuit ? circuit.state === CircuitState.CLOSED : true;
  }

  private getOrCreateCircuit(circuitName: string, config: CircuitBreakerConfig) {
    if (!this.circuits.has(circuitName)) {
      this.circuits.set(circuitName, {
        state: CircuitState.CLOSED,
        failureCount: 0,
        successCount: 0,
        lastFailureTime: null,
        lastSuccessTime: null,
        totalRequests: 0,
        totalFailures: 0,
        totalSuccesses: 0,
        config
      });
    }
    return this.circuits.get(circuitName)!;
  }

  private shouldAttemptReset(circuit: any): boolean {
    if (!circuit.lastFailureTime) return true;
    
    const timeSinceLastFailure = Date.now() - circuit.lastFailureTime.getTime();
    return timeSinceLastFailure >= circuit.config.timeout;
  }

  private onSuccess(circuitName: string, circuit: any): void {
    circuit.totalRequests++;
    circuit.totalSuccesses++;
    circuit.lastSuccessTime = new Date();

    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.successCount++;
      if (circuit.successCount >= circuit.config.successThreshold) {
        circuit.state = CircuitState.CLOSED;
        circuit.failureCount = 0;
        circuit.successCount = 0;
        this.logger.log(`Circuit ${circuitName} moved to CLOSED state`);
      }
    } else {
      // Reset failure count on success
      circuit.failureCount = 0;
    }
  }

  private onFailure(circuitName: string, circuit: any): void {
    circuit.totalRequests++;
    circuit.totalFailures++;
    circuit.failureCount++;
    circuit.lastFailureTime = new Date();

    if (circuit.state === CircuitState.HALF_OPEN) {
      // If we're in half-open and get a failure, go back to open
      circuit.state = CircuitState.OPEN;
      circuit.successCount = 0;
      this.logger.warn(`Circuit ${circuitName} moved back to OPEN state due to failure`);
    } else if (circuit.failureCount >= circuit.config.failureThreshold) {
      circuit.state = CircuitState.OPEN;
      this.logger.warn(`Circuit ${circuitName} moved to OPEN state after ${circuit.failureCount} failures`);
    }
  }
}

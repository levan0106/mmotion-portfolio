import { Test, TestingModule } from '@nestjs/testing';
import { CircuitBreakerService } from './circuit-breaker.service';

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CircuitBreakerService],
    }).compile();

    service = module.get<CircuitBreakerService>(CircuitBreakerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should execute successful operation', async () => {
      const result = await service.execute('test-circuit', async () => 'success');
      expect(result).toBe('success');
    });

    it('should handle operation failure', async () => {
      await expect(
        service.execute('test-circuit', async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
    });

    it('should open circuit after threshold failures', async () => {
      const circuitName = 'failure-test-circuit';
      
      // Execute failing operations up to threshold
      for (let i = 0; i < 5; i++) {
        try {
          await service.execute(circuitName, async () => {
            throw new Error('Test error');
          });
        } catch (error) {
          // Expected to fail
        }
      }

      // Circuit should be open now
      const stats = service.getStats(circuitName);
      expect(stats?.state).toBe('OPEN');
    });

    it('should allow operation in half-open state', async () => {
      const circuitName = 'half-open-test-circuit';
      
      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await service.execute(circuitName, async () => {
            throw new Error('Test error');
          });
        } catch (error) {
          // Expected to fail
        }
      }

      // Wait for timeout (simulate)
      const circuit = (service as any).circuits.get(circuitName);
      if (circuit) {
        circuit.lastFailureTime = new Date(Date.now() - 60000); // 1 minute ago
      }

      // Should allow operation in half-open state
      const result = await service.execute(circuitName, async () => 'success');
      expect(result).toBe('success');
    });
  });

  describe('getStats', () => {
    it('should return null for non-existent circuit', () => {
      const stats = service.getStats('non-existent');
      expect(stats).toBeNull();
    });

    it('should return stats for existing circuit', async () => {
      await service.execute('stats-test-circuit', async () => 'success');
      const stats = service.getStats('stats-test-circuit');
      expect(stats).toBeDefined();
      expect(stats?.state).toBe('CLOSED');
      expect(stats?.totalRequests).toBe(1);
      expect(stats?.totalSuccesses).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset circuit to closed state', async () => {
      const circuitName = 'reset-test-circuit';
      
      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await service.execute(circuitName, async () => {
            throw new Error('Test error');
          });
        } catch (error) {
          // Expected to fail
        }
      }

      // Reset the circuit
      service.reset(circuitName);
      
      const stats = service.getStats(circuitName);
      expect(stats?.state).toBe('CLOSED');
      expect(stats?.failureCount).toBe(0);
      expect(stats?.successCount).toBe(0);
    });
  });

  describe('resetAll', () => {
    it('should reset all circuits', async () => {
      // Create multiple circuits
      await service.execute('circuit1', async () => 'success');
      await service.execute('circuit2', async () => 'success');
      
      // Reset all
      service.resetAll();
      
      const allStats = service.getAllStats();
      expect(Object.keys(allStats)).toHaveLength(2);
      
      Object.values(allStats).forEach(stats => {
        expect(stats.state).toBe('CLOSED');
        expect(stats.failureCount).toBe(0);
        expect(stats.successCount).toBe(0);
      });
    });
  });

  describe('isHealthy', () => {
    it('should return true for healthy circuit', async () => {
      await service.execute('healthy-circuit', async () => 'success');
      const isHealthy = service.isHealthy('healthy-circuit');
      expect(isHealthy).toBe(true);
    });

    it('should return false for open circuit', async () => {
      const circuitName = 'unhealthy-circuit';
      
      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await service.execute(circuitName, async () => {
            throw new Error('Test error');
          });
        } catch (error) {
          // Expected to fail
        }
      }

      const isHealthy = service.isHealthy(circuitName);
      expect(isHealthy).toBe(false);
    });

    it('should return true for non-existent circuit', () => {
      const isHealthy = service.isHealthy('non-existent');
      expect(isHealthy).toBe(true);
    });
  });
});

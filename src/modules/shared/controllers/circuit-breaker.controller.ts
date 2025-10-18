import { Controller, Get, Post, Param, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CircuitBreakerService } from '../services/circuit-breaker.service';

@ApiTags('Circuit Breaker')
@Controller('api/v1/circuit-breaker')
export class CircuitBreakerController {
  constructor(private readonly circuitBreakerService: CircuitBreakerService) {}

  /**
   * Get all circuit breaker statistics
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get all circuit breaker statistics',
    description: 'Returns statistics for all circuit breakers in the system',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Circuit breaker statistics retrieved successfully',
  })
  async getAllStats() {
    return {
      success: true,
      data: this.circuitBreakerService.getAllStats(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get circuit breaker statistics for a specific circuit
   */
  @Get('stats/:circuitName')
  @ApiOperation({
    summary: 'Get circuit breaker statistics for a specific circuit',
    description: 'Returns statistics for a specific circuit breaker',
  })
  @ApiParam({
    name: 'circuitName',
    description: 'Name of the circuit breaker',
    example: 'gold-price-api',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Circuit breaker statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Circuit breaker not found',
  })
  async getStats(@Param('circuitName') circuitName: string) {
    const stats = this.circuitBreakerService.getStats(circuitName);
    
    if (!stats) {
      return {
        success: false,
        message: `Circuit breaker '${circuitName}' not found`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset a specific circuit breaker
   */
  @Post('reset/:circuitName')
  @ApiOperation({
    summary: 'Reset a specific circuit breaker',
    description: 'Resets a specific circuit breaker to CLOSED state',
  })
  @ApiParam({
    name: 'circuitName',
    description: 'Name of the circuit breaker to reset',
    example: 'gold-price-api',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Circuit breaker reset successfully',
  })
  async resetCircuit(@Param('circuitName') circuitName: string) {
    this.circuitBreakerService.reset(circuitName);
    
    return {
      success: true,
      message: `Circuit breaker '${circuitName}' has been reset`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset all circuit breakers
   */
  @Post('reset-all')
  @ApiOperation({
    summary: 'Reset all circuit breakers',
    description: 'Resets all circuit breakers to CLOSED state',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All circuit breakers reset successfully',
  })
  async resetAllCircuits() {
    this.circuitBreakerService.resetAll();
    
    return {
      success: true,
      message: 'All circuit breakers have been reset',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if a circuit breaker is healthy
   */
  @Get('health/:circuitName')
  @ApiOperation({
    summary: 'Check circuit breaker health',
    description: 'Returns the health status of a specific circuit breaker',
  })
  @ApiParam({
    name: 'circuitName',
    description: 'Name of the circuit breaker to check',
    example: 'gold-price-api',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Circuit breaker health status retrieved successfully',
  })
  async getHealth(@Param('circuitName') circuitName: string) {
    const isHealthy = this.circuitBreakerService.isHealthy(circuitName);
    const stats = this.circuitBreakerService.getStats(circuitName);
    
    return {
      success: true,
      data: {
        circuitName,
        isHealthy,
        state: stats?.state || 'UNKNOWN',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

#!/usr/bin/env ts-node

import { spawn } from 'child_process';
import { performance } from 'perf_hooks';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test Monitor for CR-006 Asset Snapshot System
 * 
 * This script monitors test execution and provides real-time feedback
 * on test performance, memory usage, and system health.
 */

interface TestMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage: NodeJS.MemoryUsage;
  testCount: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  errorRate: number;
  performanceScore: number;
}

class TestMonitor {
  private metrics: TestMetrics;
  private logFile: string;
  private isRunning: boolean = false;

  constructor() {
    this.metrics = {
      startTime: performance.now(),
      memoryUsage: process.memoryUsage(),
      testCount: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      errorRate: 0,
      performanceScore: 0,
    };

    this.logFile = path.join(__dirname, 'test-monitor.log');
  }

  /**
   * Start monitoring tests
   */
  async startMonitoring(): Promise<void> {
    console.log('🔍 Starting test monitoring...');
    this.isRunning = true;

    // Start memory monitoring
    this.startMemoryMonitoring();

    // Start performance monitoring
    this.startPerformanceMonitoring();

    // Start log monitoring
    this.startLogMonitoring();

    console.log('✅ Test monitoring started');
  }

  /**
   * Stop monitoring tests
   */
  async stopMonitoring(): Promise<void> {
    console.log('🛑 Stopping test monitoring...');
    this.isRunning = false;

    this.metrics.endTime = performance.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;

    // Generate final report
    await this.generateReport();

    console.log('✅ Test monitoring stopped');
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    const memoryInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(memoryInterval);
        return;
      }

      const currentMemory = process.memoryUsage();
      this.metrics.memoryUsage = currentMemory;

      // Log memory usage
      const memoryLog = `Memory Usage - RSS: ${this.formatBytes(currentMemory.rss)}, Heap Used: ${this.formatBytes(currentMemory.heapUsed)}, Heap Total: ${this.formatBytes(currentMemory.heapTotal)}`;
      this.logToFile(memoryLog);

      // Check for memory leaks
      if (currentMemory.heapUsed > 500 * 1024 * 1024) { // 500MB
        console.warn('⚠️ High memory usage detected:', this.formatBytes(currentMemory.heapUsed));
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    const performanceInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(performanceInterval);
        return;
      }

      // Calculate performance score based on memory usage and test execution time
      const memoryScore = Math.max(0, 100 - (this.metrics.memoryUsage.heapUsed / 1024 / 1024 / 10)); // 10MB = 1 point
      const timeScore = Math.max(0, 100 - (this.metrics.duration || 0) / 1000); // 1 second = 1 point
      
      this.metrics.performanceScore = (memoryScore + timeScore) / 2;

      // Log performance metrics
      const performanceLog = `Performance Score: ${this.metrics.performanceScore.toFixed(2)}, Memory Score: ${memoryScore.toFixed(2)}, Time Score: ${timeScore.toFixed(2)}`;
      this.logToFile(performanceLog);
    }, 10000); // Check every 10 seconds
  }

  /**
   * Start log monitoring
   */
  private startLogMonitoring(): void {
    // Monitor Jest output for test results
    const jestProcess = spawn('npm', ['run', 'test:e2e:docker'], {
      stdio: 'pipe',
      shell: true,
    });

    jestProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      this.logToFile(`STDOUT: ${output}`);

      // Parse test results
      this.parseTestOutput(output);
    });

    jestProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      this.logToFile(`STDERR: ${output}`);

      // Check for errors
      if (output.includes('FAIL') || output.includes('Error')) {
        this.metrics.failedTests++;
      }
    });

    jestProcess.on('close', (code) => {
      console.log(`Test process exited with code ${code}`);
      this.stopMonitoring();
    });
  }

  /**
   * Parse test output to extract metrics
   */
  private parseTestOutput(output: string): void {
    // Count tests
    const testMatches = output.match(/(\d+) tests?/g);
    if (testMatches) {
      this.metrics.testCount = parseInt(testMatches[0].match(/\d+/)?.[0] || '0');
    }

    // Count passed tests
    const passedMatches = output.match(/(\d+) passed/g);
    if (passedMatches) {
      this.metrics.passedTests = parseInt(passedMatches[0].match(/\d+/)?.[0] || '0');
    }

    // Count failed tests
    const failedMatches = output.match(/(\d+) failed/g);
    if (failedMatches) {
      this.metrics.failedTests = parseInt(failedMatches[0].match(/\d+/)?.[0] || '0');
    }

    // Count skipped tests
    const skippedMatches = output.match(/(\d+) skipped/g);
    if (skippedMatches) {
      this.metrics.skippedTests = parseInt(skippedMatches[0].match(/\d+/)?.[0] || '0');
    }

    // Calculate error rate
    if (this.metrics.testCount > 0) {
      this.metrics.errorRate = (this.metrics.failedTests / this.metrics.testCount) * 100;
    }
  }

  /**
   * Log message to file
   */
  private logToFile(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    fs.appendFileSync(this.logFile, logMessage);
  }

  /**
   * Generate final report
   */
  private async generateReport(): Promise<void> {
    const report = {
      summary: {
        totalTests: this.metrics.testCount,
        passedTests: this.metrics.passedTests,
        failedTests: this.metrics.failedTests,
        skippedTests: this.metrics.skippedTests,
        errorRate: this.metrics.errorRate,
        duration: this.metrics.duration,
        performanceScore: this.metrics.performanceScore,
      },
      memory: {
        rss: this.formatBytes(this.metrics.memoryUsage.rss),
        heapUsed: this.formatBytes(this.metrics.memoryUsage.heapUsed),
        heapTotal: this.formatBytes(this.metrics.memoryUsage.heapTotal),
        external: this.formatBytes(this.metrics.memoryUsage.external),
      },
      recommendations: this.generateRecommendations(),
    };

    // Save report to file
    const reportFile = path.join(__dirname, 'test-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    // Display report
    console.log('\n📊 Test Execution Report');
    console.log('========================');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passedTests}`);
    console.log(`Failed: ${report.summary.failedTests}`);
    console.log(`Skipped: ${report.summary.skippedTests}`);
    console.log(`Error Rate: ${report.summary.errorRate.toFixed(2)}%`);
    console.log(`Duration: ${(report.summary.duration || 0).toFixed(2)}ms`);
    console.log(`Performance Score: ${report.summary.performanceScore.toFixed(2)}/100`);
    console.log(`Memory Usage: ${report.memory.heapUsed}`);
    console.log('\nRecommendations:');
    report.recommendations.forEach(rec => console.log(`- ${rec}`));
  }

  /**
   * Generate recommendations based on metrics
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.errorRate > 10) {
      recommendations.push('High error rate detected. Review failed tests and fix issues.');
    }

    if (this.metrics.performanceScore < 70) {
      recommendations.push('Low performance score. Consider optimizing test execution or reducing test data size.');
    }

    if (this.metrics.memoryUsage.heapUsed > 200 * 1024 * 1024) { // 200MB
      recommendations.push('High memory usage detected. Consider reducing test data size or optimizing memory usage.');
    }

    if (this.metrics.duration && this.metrics.duration > 60000) { // 1 minute
      recommendations.push('Long test execution time. Consider parallelizing tests or optimizing test performance.');
    }

    if (recommendations.length === 0) {
      recommendations.push('All metrics look good! No immediate optimizations needed.');
    }

    return recommendations;
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run monitor if this file is executed directly
if (require.main === module) {
  const monitor = new TestMonitor();
  
  monitor.startMonitoring().catch(console.error);
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, stopping monitor...');
    await monitor.stopMonitoring();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, stopping monitor...');
    await monitor.stopMonitoring();
    process.exit(0);
  });
}

export { TestMonitor };

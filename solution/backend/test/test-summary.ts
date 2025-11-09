#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

/**
 * Test Summary Generator for CR-006 Asset Snapshot System
 * 
 * This script generates a comprehensive summary of test execution results
 * and provides insights into test performance and coverage.
 */

interface TestSummary {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  errorRate: number;
  duration: number;
  performanceScore: number;
  memoryUsage: {
    rss: string;
    heapUsed: string;
    heapTotal: string;
    external: string;
  };
  recommendations: string[];
  testSuites: {
    name: string;
    tests: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  }[];
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
}

class TestSummaryGenerator {
  private testResultsDir: string;
  private coverageDir: string;
  private outputDir: string;

  constructor() {
    this.testResultsDir = path.join(__dirname, 'test-results');
    this.coverageDir = path.join(__dirname, 'coverage');
    this.outputDir = path.join(__dirname, 'reports');
  }

  /**
   * Generate comprehensive test summary
   */
  async generateSummary(): Promise<TestSummary> {
    console.log('📊 Generating test summary for CR-006 Asset Snapshot System...');
    console.log('============================================================');

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Collect test results
    const testResults = await this.collectTestResults();
    
    // Collect coverage data
    const coverage = await this.collectCoverageData();
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(testResults, coverage);
    
    // Create summary
    const summary: TestSummary = {
      timestamp: new Date().toISOString(),
      totalTests: testResults.totalTests,
      passedTests: testResults.passedTests,
      failedTests: testResults.failedTests,
      skippedTests: testResults.skippedTests,
      errorRate: testResults.errorRate,
      duration: testResults.duration,
      performanceScore: testResults.performanceScore,
      memoryUsage: testResults.memoryUsage,
      recommendations,
      testSuites: testResults.testSuites,
      coverage,
    };

    // Save summary to file
    await this.saveSummary(summary);
    
    // Generate HTML report
    await this.generateHtmlReport(summary);
    
    // Display summary
    this.displaySummary(summary);

    return summary;
  }

  /**
   * Collect test results from various sources
   */
  private async collectTestResults(): Promise<any> {
    const results = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      errorRate: 0,
      duration: 0,
      performanceScore: 0,
      memoryUsage: {
        rss: '0 Bytes',
        heapUsed: '0 Bytes',
        heapTotal: '0 Bytes',
        external: '0 Bytes',
      },
      testSuites: [] as any[],
    };

    try {
      // Read Jest results
      const jestResultsFile = path.join(this.testResultsDir, 'jest-results.json');
      if (fs.existsSync(jestResultsFile)) {
        const jestResults = JSON.parse(fs.readFileSync(jestResultsFile, 'utf8'));
        results.totalTests = jestResults.numTotalTests || 0;
        results.passedTests = jestResults.numPassedTests || 0;
        results.failedTests = jestResults.numFailedTests || 0;
        results.skippedTests = jestResults.numPendingTests || 0;
        results.duration = jestResults.perfStats?.end - jestResults.perfStats?.start || 0;
      }

      // Read performance results
      const perfResultsFile = path.join(this.testResultsDir, 'performance-results.json');
      if (fs.existsSync(perfResultsFile)) {
        const perfResults = JSON.parse(fs.readFileSync(perfResultsFile, 'utf8'));
        results.performanceScore = perfResults.performanceScore || 0;
        results.memoryUsage = perfResults.memoryUsage || results.memoryUsage;
      }

      // Read test suite results
      const suiteResultsFile = path.join(this.testResultsDir, 'suite-results.json');
      if (fs.existsSync(suiteResultsFile)) {
        const suiteResults = JSON.parse(fs.readFileSync(suiteResultsFile, 'utf8'));
        results.testSuites = suiteResults.testSuites || [];
      }

      // Calculate error rate
      if (results.totalTests > 0) {
        results.errorRate = (results.failedTests / results.totalTests) * 100;
      }

    } catch (error) {
      console.warn('⚠️ Failed to read some test result files:', error.message);
    }

    return results;
  }

  /**
   * Collect coverage data
   */
  private async collectCoverageData(): Promise<any> {
    const coverage = {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    };

    try {
      // Read Jest coverage summary
      const coverageSummaryFile = path.join(this.coverageDir, 'coverage-summary.json');
      if (fs.existsSync(coverageSummaryFile)) {
        const coverageSummary = JSON.parse(fs.readFileSync(coverageSummaryFile, 'utf8'));
        const total = coverageSummary.total;
        
        if (total) {
          coverage.statements = total.statements?.pct || 0;
          coverage.branches = total.branches?.pct || 0;
          coverage.functions = total.functions?.pct || 0;
          coverage.lines = total.lines?.pct || 0;
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to read coverage data:', error.message);
    }

    return coverage;
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(testResults: any, coverage: any): string[] {
    const recommendations: string[] = [];

    // Test execution recommendations
    if (testResults.errorRate > 10) {
      recommendations.push(`High error rate detected (${testResults.errorRate.toFixed(2)}%). Review and fix failed tests.`);
    }

    if (testResults.performanceScore < 70) {
      recommendations.push(`Low performance score (${testResults.performanceScore.toFixed(2)}/100). Consider optimizing test execution.`);
    }

    if (testResults.duration > 60000) { // 1 minute
      recommendations.push(`Long test execution time (${(testResults.duration / 1000).toFixed(2)}s). Consider parallelizing tests.`);
    }

    // Coverage recommendations
    if (coverage.statements < 80) {
      recommendations.push(`Low statement coverage (${coverage.statements.toFixed(2)}%). Add more tests to improve coverage.`);
    }

    if (coverage.branches < 70) {
      recommendations.push(`Low branch coverage (${coverage.branches.toFixed(2)}%). Add tests for edge cases and error conditions.`);
    }

    if (coverage.functions < 80) {
      recommendations.push(`Low function coverage (${coverage.functions.toFixed(2)}%). Add tests for untested functions.`);
    }

    // Memory recommendations
    const heapUsedMB = this.parseMemoryUsage(testResults.memoryUsage.heapUsed);
    if (heapUsedMB > 200) {
      recommendations.push(`High memory usage (${testResults.memoryUsage.heapUsed}). Consider optimizing memory usage.`);
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('All metrics look good! No immediate optimizations needed.');
    }

    return recommendations;
  }

  /**
   * Parse memory usage string to MB
   */
  private parseMemoryUsage(memoryStr: string): number {
    const match = memoryStr.match(/(\d+(?:\.\d+)?)\s*(Bytes|KB|MB|GB)/);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'Bytes': return value / 1024 / 1024;
      case 'KB': return value / 1024;
      case 'MB': return value;
      case 'GB': return value * 1024;
      default: return 0;
    }
  }

  /**
   * Save summary to file
   */
  private async saveSummary(summary: TestSummary): Promise<void> {
    const summaryFile = path.join(this.outputDir, 'test-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`✅ Test summary saved to: ${summaryFile}`);
  }

  /**
   * Generate HTML report
   */
  private async generateHtmlReport(summary: TestSummary): Promise<void> {
    const htmlContent = this.generateHtmlContent(summary);
    const htmlFile = path.join(this.outputDir, 'test-report.html');
    fs.writeFileSync(htmlFile, htmlContent);
    console.log(`✅ HTML report generated: ${htmlFile}`);
  }

  /**
   * Generate HTML content
   */
  private generateHtmlContent(summary: TestSummary): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CR-006 Asset Snapshot System - Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #666; font-size: 0.9em; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .coverage { margin-bottom: 30px; }
        .coverage-bar { background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden; margin: 5px 0; }
        .coverage-fill { height: 100%; transition: width 0.3s ease; }
        .coverage-80 { background: #28a745; }
        .coverage-60 { background: #ffc107; }
        .coverage-40 { background: #dc3545; }
        .recommendations { background: #e3f2fd; padding: 15px; border-radius: 6px; margin-bottom: 30px; }
        .recommendations h3 { margin-top: 0; color: #1976d2; }
        .recommendations ul { margin: 0; padding-left: 20px; }
        .test-suites { margin-bottom: 30px; }
        .test-suite { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 4px; }
        .footer { text-align: center; color: #666; font-size: 0.9em; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CR-006 Asset Snapshot System</h1>
            <h2>Test Execution Report</h2>
            <p>Generated: ${summary.timestamp}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value ${summary.errorRate > 10 ? 'danger' : 'success'}">${summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value success">${summary.passedTests}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value ${summary.failedTests > 0 ? 'danger' : 'success'}">${summary.failedTests}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value warning">${summary.skippedTests}</div>
                <div class="metric-label">Skipped</div>
            </div>
            <div class="metric">
                <div class="metric-value ${summary.errorRate > 10 ? 'danger' : 'success'}">${summary.errorRate.toFixed(2)}%</div>
                <div class="metric-label">Error Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value ${summary.performanceScore < 70 ? 'warning' : 'success'}">${summary.performanceScore.toFixed(2)}</div>
                <div class="metric-label">Performance Score</div>
            </div>
        </div>

        <div class="coverage">
            <h3>Code Coverage</h3>
            <div>
                <label>Statements: ${summary.coverage.statements.toFixed(2)}%</label>
                <div class="coverage-bar">
                    <div class="coverage-fill ${summary.coverage.statements >= 80 ? 'coverage-80' : summary.coverage.statements >= 60 ? 'coverage-60' : 'coverage-40'}" style="width: ${summary.coverage.statements}%"></div>
                </div>
            </div>
            <div>
                <label>Branches: ${summary.coverage.branches.toFixed(2)}%</label>
                <div class="coverage-bar">
                    <div class="coverage-fill ${summary.coverage.branches >= 80 ? 'coverage-80' : summary.coverage.branches >= 60 ? 'coverage-60' : 'coverage-40'}" style="width: ${summary.coverage.branches}%"></div>
                </div>
            </div>
            <div>
                <label>Functions: ${summary.coverage.functions.toFixed(2)}%</label>
                <div class="coverage-bar">
                    <div class="coverage-fill ${summary.coverage.functions >= 80 ? 'coverage-80' : summary.coverage.functions >= 60 ? 'coverage-60' : 'coverage-40'}" style="width: ${summary.coverage.functions}%"></div>
                </div>
            </div>
            <div>
                <label>Lines: ${summary.coverage.lines.toFixed(2)}%</label>
                <div class="coverage-bar">
                    <div class="coverage-fill ${summary.coverage.lines >= 80 ? 'coverage-80' : summary.coverage.lines >= 60 ? 'coverage-60' : 'coverage-40'}" style="width: ${summary.coverage.lines}%"></div>
                </div>
            </div>
        </div>

        <div class="recommendations">
            <h3>Recommendations</h3>
            <ul>
                ${summary.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>

        <div class="test-suites">
            <h3>Test Suites</h3>
            ${summary.testSuites.map(suite => `
                <div class="test-suite">
                    <strong>${suite.name}</strong><br>
                    Tests: ${suite.tests} | Passed: ${suite.passed} | Failed: ${suite.failed} | Skipped: ${suite.skipped} | Duration: ${suite.duration}ms
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>Generated by CR-006 Asset Snapshot System Test Suite</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Display summary in console
   */
  private displaySummary(summary: TestSummary): void {
    console.log('\n📊 Test Execution Summary');
    console.log('=========================');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests}`);
    console.log(`Failed: ${summary.failedTests}`);
    console.log(`Skipped: ${summary.skippedTests}`);
    console.log(`Error Rate: ${summary.errorRate.toFixed(2)}%`);
    console.log(`Duration: ${(summary.duration / 1000).toFixed(2)}s`);
    console.log(`Performance Score: ${summary.performanceScore.toFixed(2)}/100`);
    console.log(`Memory Usage: ${summary.memoryUsage.heapUsed}`);
    console.log('\nCode Coverage:');
    console.log(`  Statements: ${summary.coverage.statements.toFixed(2)}%`);
    console.log(`  Branches: ${summary.coverage.branches.toFixed(2)}%`);
    console.log(`  Functions: ${summary.coverage.functions.toFixed(2)}%`);
    console.log(`  Lines: ${summary.coverage.lines.toFixed(2)}%`);
    console.log('\nRecommendations:');
    summary.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
}

// Run summary generator if this file is executed directly
if (require.main === module) {
  const generator = new TestSummaryGenerator();
  
  generator.generateSummary().catch(error => {
    console.error('❌ Failed to generate test summary:', error);
    process.exit(1);
  });
}

export { TestSummaryGenerator };

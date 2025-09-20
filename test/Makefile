# Makefile for CR-006 Asset Snapshot System Tests

.PHONY: help test test-docker test-integration test-performance test-error-handling test-health test-clean test-setup test-teardown

# Default target
help:
	@echo "Available targets:"
	@echo "  test                 - Run all tests"
	@echo "  test-docker          - Run tests in Docker"
	@echo "  test-integration     - Run integration tests"
	@echo "  test-performance     - Run performance tests"
	@echo "  test-error-handling  - Run error handling tests"
	@echo "  test-health          - Run health check"
	@echo "  test-clean           - Clean test artifacts"
	@echo "  test-setup           - Setup test environment"
	@echo "  test-teardown        - Teardown test environment"

# Run all tests
test:
	npm run test:e2e:docker

# Run tests in Docker
test-docker:
	docker-compose -f test/docker-compose.test.yml up --build --abort-on-container-exit

# Run specific test categories
test-integration:
	npm run test:integration

test-performance:
	npm run test:performance

test-error-handling:
	npm run test:error-handling

# Health check
test-health:
	npx ts-node test/test-health-check.ts

# Clean test artifacts
test-clean:
	rm -rf test-results coverage test/reports
	docker-compose -f test/docker-compose.test.yml down -v

# Setup test environment
test-setup:
	docker-compose -f test/docker-compose.test.yml up -d postgres-test redis-test
	sleep 10
	npx ts-node test/test-health-check.ts

# Teardown test environment
test-teardown:
	docker-compose -f test/docker-compose.test.yml down -v

# Development Guidelines

## Code Quality Standards

### 1. Avoid Code Duplication

#### Logging System
- **NEVER** create duplicate logging services in individual modules
- **ALWAYS** use the centralized `LoggingModule` from `src/modules/logging/`
- **CHECK** existing logging functionality before creating new logging code

#### API Calls
- **NEVER** use different HTTP client patterns across modules
- **ALWAYS** use the centralized `apiService` from `frontend/src/services/api.ts`
- **CHECK** existing API call patterns before creating new ones
- **AVOID** using `fetch` or direct `axios` calls in hooks/components

#### Database Entities
- **NEVER** create duplicate entities for the same data
- **ALWAYS** use shared entities or proper relationships
- **CHECK** existing entities before creating new ones

#### Services
- **NEVER** recreate business logic in multiple services
- **ALWAYS** extract common logic to shared services
- **CHECK** existing services before creating new ones

### 2. Module Organization

#### Before Creating New Module
1. Check if functionality exists in other modules
2. Consider if it should be part of existing module
3. Ensure proper separation of concerns
4. Follow established patterns

#### Module Dependencies
- Keep dependencies minimal and clear
- Avoid circular dependencies
- Use proper NestJS module structure
- Import only what you need

### 3. Testing Standards

#### Unit Tests
- Write tests for all new functionality
- Aim for 100% test coverage on critical paths
- Use proper mocking for dependencies
- Follow AAA pattern (Arrange, Act, Assert)

#### Integration Tests
- Test module integration
- Test database interactions
- Test API endpoints
- Use test databases (in-memory or separate test DB)

### 4. Documentation Standards

#### Code Documentation
- Document all public methods and classes
- Use JSDoc for TypeScript/JavaScript
- Include examples for complex functionality
- Keep documentation up-to-date

#### API Documentation
- Use Swagger/OpenAPI for REST APIs
- Document all endpoints with examples
- Include error responses
- Keep API docs synchronized with code

### 5. Error Handling

#### Consistent Error Responses
- Use standard HTTP status codes
- Provide meaningful error messages
- Include error codes for programmatic handling
- Log errors appropriately

#### Validation
- Validate all inputs
- Use DTOs for request/response validation
- Provide clear validation error messages
- Handle edge cases gracefully

### 6. Performance Considerations

#### Database Queries
- Use proper indexes
- Avoid N+1 queries
- Use pagination for large datasets
- Consider caching for frequently accessed data

#### API Performance
- Use appropriate HTTP methods
- Implement proper caching headers
- Consider rate limiting
- Monitor performance metrics

### 7. Security Best Practices

#### Input Validation
- Validate all user inputs
- Sanitize data before processing
- Use parameterized queries
- Implement proper authentication/authorization

#### Data Protection
- Don't log sensitive information
- Use proper data encryption
- Implement proper access controls
- Follow OWASP guidelines

## Development Workflow

### 1. Before Starting Work
- [ ] Read relevant documentation
- [ ] Check existing code for similar functionality
- [ ] Review Memory Bank for project context
- [ ] Check anti-patterns document
- [ ] Plan the implementation approach

### 2. During Development
- [ ] Follow coding standards
- [ ] Write tests as you go
- [ ] Update documentation
- [ ] Check for code duplication
- [ ] Ensure proper error handling

### 3. Before Committing
- [ ] Run all tests
- [ ] Check for linting errors
- [ ] Review code for quality
- [ ] Update documentation if needed
- [ ] Ensure no sensitive data in commits

### 4. After Implementation
- [ ] Update Memory Bank with progress
- [ ] Update task status
- [ ] Document any new patterns or anti-patterns
- [ ] Consider if changes affect other modules
- [ ] Plan next steps

## Common Pitfalls to Avoid

### 1. Logging Duplication
- Don't create logging services in individual modules
- Use the centralized LoggingModule
- Check existing logging patterns before creating new ones

### 2. API Call Inconsistency
- Don't mix different HTTP client patterns (fetch, axios, apiService)
- Always use the centralized apiService for all API calls
- Check existing API call patterns before creating new ones
- Avoid manual error handling and authentication token management

### 3. Database Entity Duplication
- Don't create duplicate entities
- Use proper relationships between entities
- Consider if data should be in separate tables

### 4. Service Layer Duplication
- Don't recreate business logic
- Extract common functionality to shared services
- Use proper dependency injection

### 5. Configuration Duplication
- Don't duplicate configuration across modules
- Use centralized configuration management
- Follow environment-specific configuration patterns

### 6. Testing Duplication
- Don't duplicate test setup code
- Use shared test utilities
- Follow consistent testing patterns

## Resources

### Documentation
- [Memory Bank](../memory-bank/) - Project context and tracking
- [Anti-Patterns](../anti-patterns.md) - Common mistakes to avoid
- [System Patterns](../memory-bank/systemPatterns.md) - Established patterns
- [API Documentation](../api/) - API reference and examples

### Tools
- ESLint for code quality
- Prettier for code formatting
- Jest for testing
- Swagger for API documentation
- TypeORM for database operations

### Standards
- Follow TypeScript best practices
- Use NestJS conventions
- Follow REST API design principles
- Use proper Git workflow

---

*This document should be updated as new guidelines are established or patterns are discovered.*

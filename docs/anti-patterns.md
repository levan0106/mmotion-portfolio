# Anti-Patterns to Avoid

## Logging Duplication Anti-Pattern

### ❌ **DON'T: Create Duplicate Logging Systems**

**Problem**: Creating separate logging services, enums, interfaces, decorators, interceptors, and middleware in individual modules.

**Example of what NOT to do:**
```typescript
// ❌ WRONG - Don't create this in individual modules
src/modules/asset/services/logging.service.ts
src/modules/asset/enums/log-level.enum.ts
src/modules/asset/interfaces/log-context.interface.ts
src/modules/asset/decorators/logging.decorator.ts
src/modules/asset/interceptors/logging.interceptor.ts
src/modules/asset/middleware/request-logging.middleware.ts
```

**Why it's bad:**
- Code duplication across modules
- Inconsistent logging behavior
- Maintenance nightmare
- Testing complexity
- Memory overhead

### ✅ **DO: Use Centralized Logging System**

**Solution**: Use the main LoggingModule for all logging needs.

**Example of correct approach:**
```typescript
// ✅ CORRECT - Use centralized logging
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [
    LoggingModule, // Import the main logging module
    // ... other imports
  ],
  // ... rest of module
})
export class YourModule {}
```

**Benefits:**
- Single source of truth for logging
- Consistent behavior across modules
- Easy maintenance and updates
- Centralized configuration
- Better testing coverage

### **How to Avoid This Anti-Pattern:**

1. **Always check existing LoggingModule** before creating logging functionality
2. **Import LoggingModule** in your module instead of creating new logging services
3. **Use existing LoggingService** from the main logging module
4. **Follow the established logging patterns** defined in the system

### **Related Files:**
- `src/modules/logging/` - Main logging module
- `memory-bank/systemPatterns.md` - Logging pattern documentation
- `docs/architecture/` - System architecture guidelines

---

## Other Anti-Patterns

### Database Entity Duplication
- ❌ Don't create duplicate entities for the same data
- ✅ Use shared entities or proper relationships

### Service Layer Duplication
- ❌ Don't recreate business logic in multiple services
- ✅ Extract common logic to shared services

### DTO Duplication
- ❌ Don't create identical DTOs across modules
- ✅ Use shared DTOs or extend base DTOs

### Configuration Duplication
- ❌ Don't duplicate configuration across modules
- ✅ Use centralized configuration management

---

## Prevention Checklist

Before creating new functionality, always check:

- [ ] Is there an existing service/module that provides this functionality?
- [ ] Can I extend or reuse existing code instead of duplicating?
- [ ] Am I following established patterns in the codebase?
- [ ] Have I checked the Memory Bank for similar implementations?
- [ ] Does this follow the DRY (Don't Repeat Yourself) principle?

---

*This document should be updated whenever new anti-patterns are discovered during development.*

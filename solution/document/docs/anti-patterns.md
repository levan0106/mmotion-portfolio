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

## API Call Inconsistency Anti-Pattern

### ❌ **DON'T: Mix Different API Call Patterns**

**Problem**: Using different HTTP client libraries and patterns across modules without consistency.

**Example of what NOT to do:**
```typescript
// ❌ WRONG - Inconsistent API calls across modules
// Module A uses fetch directly
const response = await fetch('/api/v1/assets');
if (!response.ok) {
  throw new Error(`Failed to fetch assets: ${response.statusText}`);
}
return response.json();

// Module B uses axios directly
const response = await axios.get('/api/v1/portfolios');
return response.data;

// Module C uses apiService
const response = await apiService.api.get('/api/v1/trades');
return response.data;
```

**Why it's bad:**
- Inconsistent error handling across modules
- Different timeout and retry behaviors
- Manual authentication token management
- Duplicate configuration (base URL, headers)
- Hard to maintain and update
- No centralized request/response interceptors
- Inconsistent error messages and status codes

### ✅ **DO: Use Centralized API Service**

**Solution**: Use a single `apiService` instance with axios for all API calls.

**Example of correct approach:**
```typescript
// ✅ CORRECT - Consistent API calls using apiService
import { apiService } from '../services/api';

// All modules use the same pattern
const fetchAssets = async (): Promise<Asset[]> => {
  const response = await apiService.api.get('/api/v1/assets');
  return response.data;
};

const createAsset = async (data: CreateAssetDto): Promise<Asset> => {
  const response = await apiService.api.post('/api/v1/assets', data);
  return response.data;
};

const updateAsset = async (id: string, data: UpdateAssetDto): Promise<Asset> => {
  const response = await apiService.api.patch(`/api/v1/assets/${id}`, data);
  return response.data;
};
```

**Benefits:**
- Consistent error handling across all modules
- Centralized configuration (base URL, timeout, headers)
- Automatic authentication token injection
- Request/response interceptors for logging and error handling
- Easy to update API configuration globally
- Consistent error messages and status codes
- Better maintainability and testing

### **How to Avoid This Anti-Pattern:**

1. **Always use `apiService`** for all API calls in frontend
2. **Import `apiService`** from `src/services/api.ts`
3. **Use `apiService.api.get/post/put/patch/delete`** methods
4. **Don't use `fetch` or direct `axios` calls** in hooks or components
5. **Follow the established pattern** for error handling and data extraction

### **Related Files:**
- `frontend/src/services/api.ts` - Centralized API service
- `frontend/src/hooks/useGlobalAssets.ts` - Example of correct usage
- `frontend/src/hooks/useMarketData.ts` - Example of correct usage
- `frontend/src/hooks/useAssets.ts` - Example of incorrect usage (needs update)

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
- [ ] Am I using the centralized `apiService` for all API calls?
- [ ] Am I following the established API call patterns?
- [ ] Have I checked for existing logging, configuration, or service patterns?

---

*This document should be updated whenever new anti-patterns are discovered during development.*

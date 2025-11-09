# 🧪 Testing Documentation - Portfolio Management System

## 📋 **Tổng Quan**

Tài liệu này cung cấp hướng dẫn đầy đủ về unit testing cho Portfolio Management System, bao gồm setup, best practices, và templates sẵn sàng sử dụng.

## 📚 **Danh Sách Tài Liệu**

### **🚀 Hướng Dẫn Nhanh**
- **[QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)** - Bắt đầu trong 5 phút
- **[HOW_TO_RUN_TESTS.md](./HOW_TO_RUN_TESTS.md)** - Cách chạy tests

### **📖 Hướng Dẫn Chi Tiết**
- **[UNIT_TEST_GUIDE.md](./UNIT_TEST_GUIDE.md)** - Hướng dẫn đầy đủ về unit testing
- **[unit_testing_plan.md](./unit_testing_plan.md)** - Kế hoạch testing tổng thể
- **[unit_testing_task_breakdown.md](./unit_testing_task_breakdown.md)** - Task breakdown chi tiết

### **📋 Templates & Examples**
- **[TEST_TEMPLATES.md](./TEST_TEMPLATES.md)** - Templates copy-paste sẵn sàng
- **[NEXT_STEPS_QUICK_START.md](./NEXT_STEPS_QUICK_START.md)** - Hành động tiếp theo

### **📊 Progress Reports**
- **[task_1_completion_summary.md](./task_1_completion_summary.md)** - Task 1: Jest setup
- **[task_2_completion_summary.md](./task_2_completion_summary.md)** - Task 2: Test utilities

## 🎯 **Quick Start (5 Phút)**

### **1. Chạy Test Hiện Tại**
```bash
cd my_project
npm test
```

### **2. Tạo Test File Đầu Tiên**
```bash
# Tạo file test cho service
touch src/modules/portfolio/services/portfolio.service.spec.ts
```

### **3. Copy Template**
Mở **[TEST_TEMPLATES.md](./TEST_TEMPLATES.md)** và copy Service Test Template

### **4. Chạy Test Mới**
```bash
npm test portfolio.service.spec.ts
```

## 🏗️ **Cấu Trúc Testing**

```
my_project/
├── src/
│   └── **/*.spec.ts              # Test files
├── test/
│   ├── setup.ts                  # Global setup
│   ├── fixtures/                 # Test data
│   └── utils/                    # Test utilities
├── jest.config.js                # Jest configuration
└── document/05_testing/          # Documentation
    ├── README.md                 # This file
    ├── QUICK_START_GUIDE.md      # Quick start
    ├── UNIT_TEST_GUIDE.md        # Full guide
    ├── TEST_TEMPLATES.md         # Templates
    └── HOW_TO_RUN_TESTS.md       # Run commands
```

## 🚀 **Các Lệnh Chính**

| Lệnh | Mô tả |
|------|-------|
| `npm test` | Chạy tất cả tests |
| `npm run test:watch` | Watch mode |
| `npm run test:cov` | Coverage report |
| `npm test -- --testPathPattern=service` | Chạy service tests |
| `npm test -- --bail` | Dừng sau lỗi đầu tiên |

## 📊 **Coverage Goals**

- **Lines**: 90%
- **Branches**: 85%
- **Functions**: 90%
- **Statements**: 90%

## 🎯 **Testing Strategy**

### **Testing Pyramid**
```
        🔺 E2E Tests (Few)
       🔺🔺 Integration Tests (Some)  
    🔺🔺🔺🔺 Unit Tests (Many)
```

### **Priority Order**
1. **Service Tests** (Business Logic) - High Priority
2. **Controller Tests** (API Layer) - High Priority
3. **Repository Tests** (Data Layer)
4. **DTO Tests** (Validation)
5. **Module Tests** (Integration)

## 🔧 **Test Utilities Có Sẵn**

```typescript
import { testUtils } from '../../../../test/utils/test-helpers';

// Mock data
const portfolio = testUtils.fixtures.portfolio();
const account = testUtils.fixtures.account();

// Validation
testUtils.validation.validatePortfolioStructure(portfolio);

// Custom matchers
expect(uuid).toBeUUID();
expect(date).toBeValidDate();
```

## 📋 **Task Progress**

### **✅ Completed**
- **Task 1**: Jest testing environment setup
- **Task 2**: Test database and utilities setup

### **🔄 In Progress**
- **Task 3**: PortfolioRepository unit tests
- **Task 4**: PortfolioService unit tests (High Priority)
- **Task 7**: PortfolioController unit tests (High Priority)

### **⏳ Pending**
- **Task 5**: PortfolioAnalyticsService unit tests
- **Task 6**: PositionManagerService unit tests
- **Task 8**: PortfolioAnalyticsController unit tests
- **Task 9**: CreatePortfolioDto validation tests
- **Task 10**: UpdatePortfolioDto validation tests
- **Task 11**: PortfolioModule integration tests
- **Task 12**: Frontend testing setup
- **Task 13-21**: Frontend component tests
- **Task 22**: Testing documentation
- **Task 23**: CI/CD pipeline

## 🎯 **Next Steps**

### **Immediate Actions**
1. **Bắt đầu với Task 4**: PortfolioService unit tests
2. **Sử dụng templates** từ TEST_TEMPLATES.md
3. **Follow best practices** từ UNIT_TEST_GUIDE.md

### **Recommended Order**
1. **Service Tests** (Business logic)
2. **Controller Tests** (API endpoints)
3. **Repository Tests** (Data access)
4. **DTO Tests** (Validation)
5. **Integration Tests** (Module level)

## 🚨 **Troubleshooting**

### **Common Issues**
- **"No tests found"**: `npm test -- --passWithNoTests`
- **Coverage low**: Viết thêm test cases
- **Test timeout**: `npm test -- --testTimeout=60000`
- **Mock issues**: Kiểm tra `jest.clearAllMocks()`

### **Debug Tips**
- Sử dụng `console.log()` trong tests
- Chạy single test: `npm test -- --testNamePattern="test name"`
- Debug mode: `npm run test:debug`

## 📚 **Resources**

### **Documentation**
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [TypeScript Testing](https://jestjs.io/docs/getting-started#using-typescript)

### **Internal Resources**
- **Test Utilities**: `test/utils/test-helpers.ts`
- **Test Fixtures**: `test/fixtures/portfolio.fixtures.ts`
- **Jest Config**: `jest.config.js`

## 🎉 **Getting Started**

1. **Đọc QUICK_START_GUIDE.md** để bắt đầu nhanh
2. **Xem UNIT_TEST_GUIDE.md** để hiểu chi tiết
3. **Sử dụng TEST_TEMPLATES.md** để copy-paste
4. **Chạy tests** với HOW_TO_RUN_TESTS.md

---

**🚀 Sẵn sàng viết Unit Tests! Hãy bắt đầu với Task 4 - PortfolioService unit tests!** 🧪✅

**📞 Cần hỗ trợ?** Tham khảo các tài liệu trong thư mục này hoặc liên hệ team development.

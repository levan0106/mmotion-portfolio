# 🐛 Debug Guide - Portfolio Management System

## 🚀 Quick Start Debug

### 1. **Backend Debug (NestJS)**

#### **Cách 1: Sử dụng VS Code Debug Panel**
1. Mở VS Code
2. Nhấn `Ctrl+Shift+D` để mở Debug Panel
3. Chọn **"Debug Backend (NestJS)"** từ dropdown
4. Nhấn `F5` hoặc click **Start Debugging**

#### **Cách 2: Manual Start**
```bash
# Terminal 1: Start backend với debug mode
cd my_project
npm run start:debug

# Terminal 2: Attach debugger (nếu cần)
# VS Code sẽ tự động attach khi bạn start debugging
```

### 2. **Frontend Debug (React + Vite)**

```bash
# Terminal riêng cho frontend
cd my_project/frontend
npm run dev
```

Sau đó mở browser tại `http://localhost:5173` và sử dụng Chrome DevTools (F12)

### 3. **Debug Tests**

#### **Debug Unit Tests**
```bash
npm run test:debug
```

#### **Debug E2E Tests**
```bash
npm run test:e2e
```

#### **Debug Current Test File (VS Code)**
1. Mở file test cần debug
2. Chọn **"Debug Current Test File"** trong Debug Panel
3. Nhấn `F5`

## 🔧 Debug Configurations

### **VS Code Debug Configurations**

| Configuration | Mô tả | Port |
|---------------|-------|------|
| **Debug Backend (NestJS)** | Attach to running NestJS app | 9229 |
| **Debug Backend (Attach to Process)** | Attach to specific Node process | - |
| **Debug Tests** | Debug Jest unit tests | - |
| **Debug E2E Tests** | Debug end-to-end tests | - |
| **Debug Current Test File** | Debug file đang mở | - |

### **Available Scripts**

| Script | Command | Mô tả |
|--------|---------|-------|
| `start:debug` | `npm run start:debug` | Start backend với debug mode |
| `start:dev` | `npm run start:dev` | Start backend với watch mode |
| `test:debug` | `npm run test:debug` | Debug unit tests |
| `test:e2e` | `npm run test:e2e` | Run E2E tests |

## 🎯 Debug Techniques

### **1. Breakpoints**
- **Click** vào số dòng để set breakpoint
- **Right-click** → "Edit Breakpoint" cho conditional breakpoints
- **F9** để toggle breakpoint tại cursor

### **2. Debug Console**
- **Ctrl+Shift+Y** để mở Debug Console
- Evaluate expressions: `console.log(variable)`
- Inspect objects: `JSON.stringify(obj, null, 2)`

### **3. Variables Panel**
- Inspect local variables
- Watch expressions
- Hover over variables để xem values

### **4. Call Stack**
- Navigate between stack frames
- Click để jump to different function calls

## 🔍 Debugging Specific Areas

### **Backend Debugging**

#### **API Endpoints**
```typescript
// Set breakpoint trong controller
@Get('portfolios')
async getPortfolios() {
  debugger; // Breakpoint here
  return this.portfolioService.findAll();
}
```

#### **Database Queries**
```typescript
// Enable TypeORM logging trong .env
TYPEORM_LOGGING=true
TYPEORM_LOGGER=advanced-console
```

#### **Service Methods**
```typescript
// Set breakpoint trong service
async createPortfolio(data: CreatePortfolioDto) {
  console.log('Creating portfolio:', data); // Quick debug
  debugger; // VS Code breakpoint
  return this.portfolioRepository.save(data);
}
```

### **Frontend Debugging**

#### **React Components**
```tsx
// Set breakpoint trong component
const PortfolioList = () => {
  const [portfolios, setPortfolios] = useState([]);
  
  useEffect(() => {
    debugger; // Breakpoint here
    fetchPortfolios().then(setPortfolios);
  }, []);
  
  return <div>{/* JSX */}</div>;
};
```

#### **API Calls**
```typescript
// Debug API calls
const fetchPortfolios = async () => {
  console.log('Fetching portfolios...');
  debugger; // Breakpoint
  const response = await api.get('/portfolios');
  console.log('Response:', response.data);
  return response.data;
};
```

### **Test Debugging**

#### **Unit Tests**
```typescript
describe('PortfolioService', () => {
  it('should create portfolio', async () => {
    const data = { name: 'Test Portfolio' };
    debugger; // Breakpoint here
    const result = await service.create(data);
    expect(result).toBeDefined();
  });
});
```

#### **E2E Tests**
```typescript
describe('Portfolio E2E', () => {
  it('should create portfolio via API', async () => {
    const data = { name: 'Test Portfolio' };
    debugger; // Breakpoint here
    const response = await request(app.getHttpServer())
      .post('/portfolios')
      .send(data);
    expect(response.status).toBe(201);
  });
});
```

## 🛠️ Debug Tools & Extensions

### **VS Code Extensions (Recommended)**
- **Node.js Debug** (built-in)
- **Jest** - Jest test runner
- **Thunder Client** - API testing
- **Postman** - API development
- **REST Client** - HTTP requests

### **Browser Extensions**
- **React Developer Tools**
- **Redux DevTools** (nếu sử dụng Redux)
- **Apollo Client DevTools** (nếu sử dụng GraphQL)

## 🚨 Troubleshooting

### **Debugger không attach được**
1. Kiểm tra port 9229 có bị chiếm không:
   ```bash
   netstat -ano | findstr :9229
   ```
2. Restart VS Code
3. Thử port khác: `--debug=0.0.0.0:9230`

### **Breakpoints không hoạt động**
1. Kiểm tra source maps được enable trong `tsconfig.json`
2. Rebuild project: `npm run build`
3. Check TypeScript compilation

### **Tests không debug được**
1. Sử dụng `--runInBand` flag
2. Check Jest configuration
3. Verify test files có đúng format

### **Environment Variables**
Đảm bảo file `.env` có các settings debug:
```env
DEBUG=true
LOG_LEVEL=debug
TYPEORM_LOGGING=true
TYPEORM_LOGGER=advanced-console
```

## 📝 Debug Checklist

### **Before Starting Debug**
- [ ] Database đang chạy (PostgreSQL)
- [ ] Redis đang chạy (nếu sử dụng)
- [ ] File `.env` đã được tạo
- [ ] Dependencies đã install: `npm install`

### **During Debug**
- [ ] Set breakpoints tại các điểm quan trọng
- [ ] Sử dụng Debug Console để inspect variables
- [ ] Check Call Stack để hiểu flow
- [ ] Monitor Network tab cho API calls

### **After Debug**
- [ ] Remove debugger statements
- [ ] Clean up console.log statements
- [ ] Document findings nếu cần

## 🎯 Common Debug Scenarios

### **1. API không trả về data**
- Set breakpoint trong controller
- Check database connection
- Verify request/response format

### **2. Frontend không hiển thị data**
- Set breakpoint trong component
- Check API calls trong Network tab
- Verify state management

### **3. Tests failing**
- Set breakpoint trong test
- Check test data setup
- Verify mocks và stubs

### **4. Database queries chậm**
- Enable TypeORM logging
- Check query execution plans
- Optimize database indexes

---

## 🚀 Ready to Debug!

Bây giờ bạn đã sẵn sàng để debug project. Hãy thử các bước trên và cho tôi biết nếu cần hỗ trợ thêm!

**Quick Commands:**
```bash
# Start backend debug
npm run start:debug

# Start frontend
cd frontend && npm run dev

# Debug tests
npm run test:debug
```

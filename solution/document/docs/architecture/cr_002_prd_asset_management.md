# Project Requirement Document (PRD) - Asset Management Module

## 1. Tổng quan dự án

### 1.1 Mục tiêu
Phát triển module quản lý tài sản (Asset Management) cho hệ thống Portfolio Management System, cho phép user thực hiện các thao tác CRUD (Create, Read, Update, Delete) trên các tài sản trong portfolio của họ.

### 1.2 Phạm vi
- **In-scope**: CRUD operations cho assets trong portfolio
- **Out-of-scope**: Market data integration, real-time pricing (đã có sẵn trong hệ thống)

## 2. Phân tích yêu cầu chức năng

### 2.1 User Stories

#### US-001: Thêm tài sản mới vào portfolio
**Là một** user quản lý portfolio  
**Tôi muốn** thêm tài sản mới vào portfolio của mình  
**Để** theo dõi và quản lý đa dạng hóa đầu tư  

**Acceptance Criteria:**
- User có thể chọn loại tài sản (Stock, Bond, Gold, Deposit, Cash)
- User có thể nhập thông tin chi tiết tài sản (tên, mã, mô tả)
- User có thể thiết lập giá trị ban đầu và số lượng
- Hệ thống validate dữ liệu đầu vào
- Tài sản được lưu vào database và hiển thị trong portfolio

#### US-002: Xem danh sách tài sản trong portfolio
**Là một** user quản lý portfolio  
**Tôi muốn** xem danh sách tất cả tài sản trong portfolio  
**Để** có cái nhìn tổng quan về danh mục đầu tư  

**Acceptance Criteria:**
- Hiển thị danh sách tài sản với thông tin cơ bản
- Có thể lọc theo loại tài sản
- Có thể sắp xếp theo tên, giá trị, ngày tạo
- Hiển thị tổng giá trị và phân bổ theo loại tài sản

#### US-003: Chỉnh sửa thông tin tài sản
**Là một** user quản lý portfolio  
**Tôi muốn** chỉnh sửa thông tin tài sản đã có  
**Để** cập nhật thông tin khi có thay đổi  

**Acceptance Criteria:**
- User có thể chỉnh sửa tên, mô tả, giá trị ban đầu
- User có thể thay đổi loại tài sản
- Hệ thống validate dữ liệu cập nhật
- Lịch sử thay đổi được ghi lại
- Cập nhật real-time trong portfolio view

#### US-004: Xóa tài sản khỏi portfolio
**Là một** user quản lý portfolio  
**Tôi muốn** xóa tài sản khỏi portfolio  
**Để** loại bỏ tài sản không còn quan tâm  

**Acceptance Criteria:**
- User có thể xóa tài sản không có giao dịch liên quan
- Hệ thống hiển thị cảnh báo trước khi xóa
- Xóa tài sản có giao dịch cần xác nhận đặc biệt
- Cập nhật portfolio value sau khi xóa

### 2.2 Functional Requirements

#### FR-001: Asset CRUD Operations
- **FR-001.1**: Tạo asset mới với validation đầy đủ
- **FR-001.2**: Đọc danh sách assets với filtering và pagination
- **FR-001.3**: Cập nhật asset với audit trail
- **FR-001.4**: Xóa asset với business rules validation

#### FR-002: Asset Validation
- **FR-002.1**: Validate asset name không trùng lặp trong portfolio
- **FR-002.2**: Validate asset code format theo loại tài sản
- **FR-002.3**: Validate giá trị và số lượng phải > 0
- **FR-002.4**: Validate loại tài sản phải hợp lệ

#### FR-003: Portfolio Integration
- **FR-003.1**: Cập nhật portfolio value khi thêm/sửa/xóa asset
- **FR-003.2**: Cập nhật asset allocation percentages
- **FR-003.3**: Trigger portfolio analytics recalculation
- **FR-003.4**: Maintain referential integrity với trades

#### FR-004: User Interface
- **FR-004.1**: Asset management dashboard
- **FR-004.2**: Asset form với validation real-time
- **FR-004.3**: Asset list với sorting và filtering
- **FR-004.4**: Confirmation dialogs cho delete operations

### 2.3 Non-Functional Requirements

#### NFR-001: Performance
- API response time < 200ms cho CRUD operations
- Support 100+ assets per portfolio
- Real-time UI updates < 500ms

#### NFR-002: Security
- Input validation và sanitization
- Authorization checks cho asset operations
- Audit trail cho tất cả changes

#### NFR-003: Usability
- Intuitive UI/UX cho asset management
- Clear error messages và validation feedback
- Mobile-responsive design

#### NFR-004: Reliability
- Data consistency trong portfolio calculations
- Graceful error handling
- Transaction rollback cho failed operations

## 3. Business Rules

### 3.1 Asset Creation Rules
- Mỗi portfolio có thể có tối đa 50 assets
- Asset name phải unique trong portfolio
- Asset code phải unique globally (nếu có)
- Giá trị ban đầu phải >= 0

### 3.2 Asset Update Rules
- Không thể thay đổi asset type nếu đã có trades
- Không thể thay đổi asset code nếu đã có trades
- Có thể cập nhật name, description, initial value

### 3.3 Asset Deletion Rules
- Không thể xóa asset nếu có trades liên quan
- Phải xóa tất cả trades trước khi xóa asset
- Xóa asset sẽ trigger portfolio value recalculation

## 4. Data Requirements

### 4.1 Asset Entity Fields
```typescript
interface Asset {
  id: string;
  portfolioId: string;
  name: string;
  code?: string;
  type: AssetType; // STOCK, BOND, GOLD, DEPOSIT, CASH
  description?: string;
  initialValue: number;
  initialQuantity: number;
  currentValue?: number;
  currentQuantity?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}
```

### 4.2 Asset Type Enum
```typescript
enum AssetType {
  STOCK = 'STOCK',
  BOND = 'BOND', 
  GOLD = 'GOLD',
  DEPOSIT = 'DEPOSIT',
  CASH = 'CASH'
}
```

## 5. Integration Requirements

### 5.1 Existing System Integration
- **Portfolio Service**: Cập nhật portfolio value và allocation
- **Trading Service**: Validate asset có trades trước khi xóa
- **Analytics Service**: Trigger recalculation khi có thay đổi
- **Logging Service**: Log tất cả asset operations

### 5.2 API Endpoints
- `POST /api/v1/assets` - Tạo asset mới
- `GET /api/v1/assets` - Lấy danh sách assets
- `GET /api/v1/assets/:id` - Lấy chi tiết asset
- `PUT /api/v1/assets/:id` - Cập nhật asset
- `DELETE /api/v1/assets/:id` - Xóa asset

## 6. Success Criteria

### 6.1 Functional Success
- User có thể thêm/sửa/xóa assets thành công
- Portfolio value được cập nhật chính xác
- Validation rules được enforce đúng
- UI responsive và user-friendly

### 6.2 Technical Success
- API response time < 200ms
- 100% test coverage cho core functionality
- Zero data inconsistency issues
- Proper error handling và logging

## 7. Assumptions và Dependencies

### 7.1 Assumptions
- User đã có portfolio trước khi quản lý assets
- Asset types được định nghĩa trước và không thay đổi
- Market data integration đã có sẵn cho pricing

### 7.2 Dependencies
- Portfolio Management System (existing)
- Trading System (existing)
- Database schema (existing)
- Authentication system (future)

## 8. Risks và Mitigation

### 8.1 Technical Risks
- **Risk**: Data inconsistency khi cập nhật portfolio value
- **Mitigation**: Sử dụng database transactions và validation

- **Risk**: Performance issues với large asset lists
- **Mitigation**: Implement pagination và caching

### 8.2 Business Risks
- **Risk**: User xóa nhầm asset quan trọng
- **Mitigation**: Confirmation dialogs và soft delete

- **Risk**: Asset validation rules quá strict
- **Mitigation**: Flexible validation với clear error messages

## 9. Timeline Estimate

### Phase 1: Backend Implementation (3-4 days)
- Database schema updates
- API endpoints development
- Business logic implementation
- Unit testing

### Phase 2: Frontend Implementation (2-3 days)
- UI components development
- Form validation
- Integration với backend APIs
- User testing

### Phase 3: Integration & Testing (1-2 days)
- End-to-end testing
- Performance optimization
- Bug fixes
- Documentation

**Total Estimate**: 6-9 days

## 10. Acceptance Criteria Summary

✅ **User có thể thêm asset mới vào portfolio**  
✅ **User có thể xem danh sách assets với filtering/sorting**  
✅ **User có thể chỉnh sửa thông tin asset**  
✅ **User có thể xóa asset (với validation rules)**  
✅ **Portfolio value được cập nhật real-time**  
✅ **UI responsive và user-friendly**  
✅ **API performance < 200ms**  
✅ **100% test coverage cho core functionality**  
✅ **Proper error handling và logging**  
✅ **Integration với existing systems**  

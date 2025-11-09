# Event-Driven Auto Asset Creation Architecture

## 🎯 Tổng Quan

Sử dụng **Event-Driven Architecture** để tách biệt user creation và asset creation, tạo ra một hệ thống linh hoạt và dễ bảo trì hơn.

## 🏗️ Kiến Trúc Mới

```
┌─────────────────┐    Event     ┌──────────────────────┐
│   AuthService   │ ────────────► │ AutoAssetCreation    │
│                 │   user.created│ Listener              │
│ - createUser()  │               │                      │
│ - emit event    │               │ - handleUserCreated()│
└─────────────────┘               │ - createAssets()     │
                                 └──────────────────────┘
                                          │
                                          ▼
                                 ┌──────────────────────┐
                                 │   Asset Services     │
                                 │                      │
                                 │ - GlobalAssetService │
                                 │ - AssetService       │
                                 └──────────────────────┘
```

## 🔧 Các Thành Phần

### 1. **Event Definition**
```typescript
// src/modules/shared/events/user-created.event.ts
export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly accountId: string,
    public readonly username: string,
    public readonly isDemo: boolean = false,
  ) {}
}
```

### 2. **Event Emitter (AuthService)**
```typescript
// AuthService chỉ cần emit event
this.eventEmitter.emit('user.created', new UserCreatedEvent(
  user.userId,
  mainAccount.accountId,
  username,
  true // isDemo
));
```

### 3. **Event Listener (AutoAssetCreationListener)**
```typescript
@OnEvent('user.created')
async handleUserCreated(event: UserCreatedEvent): Promise<void> {
  // Logic tạo assets cho user mới
  const top100Assets = await this.globalAssetService.getTop100GlobalAssets();
  const result = await this.assetService.bulkCreateAssetsFromGlobal(globalAssetIds, event.accountId);
}
```

## ✅ Lợi Ích

### 1. **Decoupling (Tách Biệt)**
- AuthService không cần biết về AssetService
- Không có circular dependency
- Dễ test và maintain

### 2. **Scalability (Khả Năng Mở Rộng)**
- Có thể thêm nhiều listener khác cho user.created event
- Ví dụ: SendWelcomeEmailListener, CreateDefaultPortfolioListener, etc.

### 3. **Reliability (Độ Tin Cậy)**
- Nếu asset creation fail, user creation vẫn thành công
- Event được xử lý bất đồng bộ
- Có thể retry event nếu cần

### 4. **Flexibility (Linh Hoạt)**
- Có thể enable/disable listener
- Có thể thay đổi logic mà không ảnh hưởng AuthService
- Dễ dàng thêm business rules mới

## 🚀 Cách Sử Dụng

### Enable/Disable Feature
```bash
# Enable auto asset creation
AUTO_CREATE_ASSETS_FOR_NEW_USERS=true

# Disable auto asset creation  
AUTO_CREATE_ASSETS_FOR_NEW_USERS=false
```

### Thêm Listener Mới
```typescript
@Injectable()
export class WelcomeEmailListener {
  @OnEvent('user.created')
  async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    // Send welcome email logic
  }
}
```

## 🔄 So Sánh

| Aspect | Hardcode API | Event-Driven |
|--------|--------------|--------------|
| **Coupling** | Tight coupling | Loose coupling |
| **Testability** | Khó test | Dễ test |
| **Scalability** | Khó mở rộng | Dễ mở rộng |
| **Maintainability** | Khó bảo trì | Dễ bảo trì |
| **Performance** | Synchronous | Asynchronous |
| **Error Handling** | Có thể fail user creation | User creation luôn thành công |

## 🎯 Kết Luận

Event-Driven Architecture là cách tốt nhất để implement tính năng auto asset creation vì:

1. **Tách biệt concerns** - Mỗi service chỉ lo việc của mình
2. **Không có dependency** - Không cần import service khác
3. **Dễ mở rộng** - Có thể thêm nhiều listener khác
4. **Reliable** - User creation không bị ảnh hưởng bởi asset creation
5. **Testable** - Dễ test từng component riêng biệt

Đây là best practice trong NestJS và microservices architecture!

# 📚 Examples - AI Development Assistant

## 🎯 Real-World Examples

### **Example 1: E-commerce System với .NET Core**

#### **Step 1: Setup Project**
```bash
"Tôi muốn tạo một e-commerce system với .NET Core + Entity Framework + PostgreSQL. Hãy setup theo master template."
```

**Output:**
- Project structure với .NET Core conventions
- Entity Framework configuration
- PostgreSQL connection setup
- Authentication với JWT
- Swagger documentation setup

#### **Step 2: Tạo PRD**
```bash
"Tạo PRD cho e-commerce system với các tính năng:
- User management (registration, login, profile)
- Product catalog (CRUD, categories, search)
- Shopping cart (add/remove items, quantity)
- Order management (create, track, cancel)
- Payment integration (Stripe, PayPal)
- Admin dashboard (analytics, management)

Technology stack: .NET Core + Entity Framework + PostgreSQL"
```

**Output:**
- `business_analysis.md` với user stories
- Functional và non-functional requirements
- Success metrics và timeline estimates
- Technology stack analysis

#### **Step 3: Tạo TDD**
```bash
"Dựa trên PRD e-commerce system, hãy tạo TDD với:
- Microservices architecture
- RESTful API design
- Database schema cho users, products, orders
- Authentication với JWT
- Payment gateway integration
- Caching strategy với Redis"
```

**Output:**
- `tdd_ecommerce_system.md` với comprehensive technical design
- System architecture diagrams (Mermaid)
- Database ERD
- API documentation
- Security và performance considerations

#### **Step 4: Breakdown Tasks**
```bash
"Dựa trên TDD e-commerce system, hãy breakdown thành tasks cho:
- User Management module
- Product Catalog module
- Shopping Cart module
- Order Management module
- Payment Integration module
- Admin Dashboard module

Technology stack: .NET Core + Entity Framework + PostgreSQL"
```

**Output:**
- `task_ecommerce_system.md` với granular tasks
- Task dependencies và priorities
- .NET Core specific implementation details
- Entity Framework conventions
- Testing strategies

#### **Step 5: Implement Module**
```bash
"Tôi sẽ implement User Management module theo task breakdown với:
- UserController với CRUD endpoints
- UserService với business logic
- User entity với Entity Framework
- JWT authentication
- Input validation với FluentValidation

Technology stack: .NET Core + Entity Framework + PostgreSQL"
```

**Output:**
- Complete User Management implementation
- Unit tests với xUnit
- Integration tests
- API documentation
- Task status updates

### **Example 2: Blog API với Node.js + NestJS**

#### **Step 1: Setup Project**
```bash
"Tôi muốn tạo một blog API với Node.js + NestJS + TypeORM + PostgreSQL. Hãy setup theo master template."
```

**Output:**
- NestJS project structure
- TypeORM configuration
- PostgreSQL connection
- Authentication với JWT
- Swagger documentation

#### **Step 2: Tạo PRD**
```bash
"Tạo PRD cho blog API với các tính năng:
- User management (registration, login, profile)
- Post management (CRUD, categories, tags)
- Comment system (nested comments)
- Like/Unlike posts
- Search functionality
- Admin panel

Technology stack: Node.js + NestJS + TypeORM + PostgreSQL"
```

**Output:**
- `business_analysis.md` với user stories
- API requirements
- Database requirements
- Performance requirements

#### **Step 3: Tạo TDD**
```bash
"Dựa trên PRD blog API, hãy tạo TDD với:
- RESTful API design
- Database schema cho users, posts, comments
- Authentication với JWT
- Search với Elasticsearch
- Caching với Redis
- File upload cho images"
```

**Output:**
- `tdd_blog_api.md` với technical design
- API endpoints documentation
- Database schema design
- Authentication flow
- Search implementation

#### **Step 4: Breakdown Tasks**
```bash
"Dựa trên TDD blog API, hãy breakdown thành tasks cho:
- User module (auth, profile)
- Post module (CRUD, categories, tags)
- Comment module (nested comments)
- Search module (Elasticsearch integration)
- File upload module (images)

Technology stack: Node.js + NestJS + TypeORM + PostgreSQL"
```

**Output:**
- `task_blog_api.md` với detailed tasks
- NestJS specific implementation
- TypeORM conventions
- Testing strategies

#### **Step 5: Implement Module**
```bash
"Tôi sẽ implement Post module theo task breakdown với:
- PostController với CRUD endpoints
- PostService với business logic
- Post entity với TypeORM
- Category và Tag entities
- File upload cho images

Technology stack: Node.js + NestJS + TypeORM + PostgreSQL"
```

**Output:**
- Complete Post module implementation
- Unit tests với Jest
- Integration tests
- API documentation
- Task status updates

### **Example 3: Mobile App Backend với Python + FastAPI**

#### **Step 1: Setup Project**
```bash
"Tôi muốn tạo một mobile app backend với Python + FastAPI + SQLAlchemy + PostgreSQL. Hãy setup theo master template."
```

**Output:**
- FastAPI project structure
- SQLAlchemy configuration
- PostgreSQL connection
- Authentication với JWT
- API documentation

#### **Step 2: Tạo PRD**
```bash
"Tạo PRD cho mobile app backend với các tính năng:
- User management (registration, login, profile)
- Post management (CRUD, images, location)
- Social features (follow, like, comment)
- Real-time notifications
- Push notifications
- Analytics

Technology stack: Python + FastAPI + SQLAlchemy + PostgreSQL"
```

**Output:**
- `business_analysis.md` với mobile app requirements
- API requirements
- Real-time requirements
- Push notification requirements

#### **Step 3: Tạo TDD**
```bash
"Dựa trên PRD mobile app backend, hãy tạo TDD với:
- RESTful API design
- Database schema cho users, posts, social features
- WebSocket cho real-time features
- Push notification service
- Image storage với AWS S3
- Caching với Redis"
```

**Output:**
- `tdd_mobile_backend.md` với technical design
- API endpoints documentation
- WebSocket implementation
- Push notification design
- AWS S3 integration

#### **Step 4: Breakdown Tasks**
```bash
"Dựa trên TDD mobile app backend, hãy breakdown thành tasks cho:
- User module (auth, profile, social)
- Post module (CRUD, images, location)
- Social module (follow, like, comment)
- Notification module (real-time, push)
- File upload module (images, AWS S3)

Technology stack: Python + FastAPI + SQLAlchemy + PostgreSQL"
```

**Output:**
- `task_mobile_backend.md` với detailed tasks
- FastAPI specific implementation
- SQLAlchemy conventions
- WebSocket implementation
- Testing strategies

#### **Step 5: Implement Module**
```bash
"Tôi sẽ implement User module theo task breakdown với:
- UserController với CRUD endpoints
- UserService với business logic
- User model với SQLAlchemy
- JWT authentication
- Social features (follow, unfollow)

Technology stack: Python + FastAPI + SQLAlchemy + PostgreSQL"
```

**Output:**
- Complete User module implementation
- Unit tests với pytest
- Integration tests
- API documentation
- Task status updates

## 🔄 Feature Request Examples

### **Example 1: Thêm Payment Integration**

#### **Feature Request**
```bash
"Tôi có feature request mới cho e-commerce system:
- Thêm payment integration với Stripe
- Thêm payment methods (credit card, PayPal)
- Thêm payment history
- Thêm refund functionality

Technology stack: .NET Core + Entity Framework + PostgreSQL"
```

**Output:**
- `cr_001_prd_payment_integration.md`
- `cr_001_tdd_payment_integration.md`
- `cr_001_task_payment_integration.md`

#### **Implementation**
```bash
"Tôi sẽ implement payment integration theo task breakdown với:
- PaymentController với Stripe integration
- PaymentService với business logic
- Payment entity với Entity Framework
- Stripe webhook handling
- Refund functionality

Technology stack: .NET Core + Entity Framework + PostgreSQL"
```

### **Example 2: Thêm Real-time Chat**

#### **Feature Request**
```bash
"Tôi có feature request mới cho blog API:
- Thêm real-time chat system
- Thêm chat rooms
- Thêm message history
- Thêm online status

Technology stack: Node.js + NestJS + TypeORM + PostgreSQL"
```

**Output:**
- `cr_002_prd_chat_system.md`
- `cr_002_tdd_chat_system.md`
- `cr_002_task_chat_system.md`

#### **Implementation**
```bash
"Tôi sẽ implement chat system theo task breakdown với:
- ChatController với WebSocket endpoints
- ChatService với real-time logic
- Chat entities với TypeORM
- Socket.io integration
- Message persistence

Technology stack: Node.js + NestJS + TypeORM + PostgreSQL"
```

## 🚨 Common Issues & Solutions

### **Issue 1: Technology Stack Không Được Support**
```bash
"Tôi muốn sử dụng [Technology Stack] nhưng không thấy trong supported list. Hãy adapt master template cho technology stack này."
```

### **Issue 2: Task Breakdown Quá Phức Tạp**
```bash
"Task breakdown này quá phức tạp. Hãy sử dụng task breakdown rule để simplify và tạo manageable tasks."
```

### **Issue 3: TDD Thiếu Information**
```bash
"TDD này thiếu một số sections. Hãy sử dụng TDD rule để tạo comprehensive technical design document."
```

### **Issue 4: Implementation Không Follow Standards**
```bash
"Implementation này không follow coding standards. Hãy sử dụng implementation rule để ensure code quality."
```

## 📋 Validation Examples

### **Pre-Implementation Validation**
```bash
"Trước khi implement User Management module, hãy chạy validation checklist để đảm bảo:
- Tất cả dependencies đã sẵn sàng
- Code standards được follow
- Testing strategy đã được define
- Documentation plan đã được tạo"
```

### **Post-Implementation Validation**
```bash
"Sau khi implement User Management module, hãy chạy validation checklist để đảm bảo:
- Code quality standards được meet
- Tests đã được viết và pass
- Documentation đã được update
- Task status đã được update"
```

---

**These examples should help you get started quickly! 🚀**

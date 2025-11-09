# AI Development Assistant - Prompt System

## 🎯 Tổng Quan

Hệ thống prompt này được thiết kế để hỗ trợ AI trong việc phát triển phần mềm với nhiều technology stacks khác nhau. Tất cả prompts đều tuân thủ các quy tắc universal và có thể adapt theo technology stack cụ thể.

## 📁 Cấu Trúc Prompt Files

```
prompt/
├── 00. master_prompt_template.md      # Master template cho tất cả prompts
├── 0. workflow_prompt.md              # Development workflow chính
├── 1. PRD_prompt_v4.md                # Tạo Project Requirement Document
├── 2. technical_design_documentation_rule_universal.md # Tạo Technical Design Document
├── 3. task_breakdown_rule_universal.md # Breakdown tasks thành actionable items
├── 4. implementation_rule_universal.md # Implementation rules và guidelines
├── 5. feature_request_workflow_prompt.md # Xử lý feature requests
├── 6. validation_checklist.md        # Validation checklist cho tất cả phases
├── _draft ideas.md                    # Draft ideas và notes
└── _requirements.md                   # Requirements và specifications
```

## 🚀 Cách Sử Dụng Step-by-Step

### **Phase 1: Khởi Tạo Project**

#### **Bước 1: Sử dụng Master Template**
```markdown
File: 00. master_prompt_template.md
Khi nào dùng: Luôn luôn - đây là comprehensive template cho tất cả development
Mục đích: Universal standards, technology stack detection, development workflow, quality assurance
```

**Ví dụ sử dụng:**
```
"Tôi muốn bắt đầu một project mới với .NET Core. Hãy sử dụng master template để setup và hướng dẫn workflow."
```

#### **Bước 2: Tạo PRD (Project Requirement Document)**
```markdown
File: 1. PRD_prompt_v4.md
Khi nào dùng: Khi cần tạo requirements document cho project/feature mới
Mục đích: Phân tích requirements, tạo user stories, define success metrics
```

**Ví dụ sử dụng:**
```
"Tôi cần tạo PRD cho một e-commerce system với các tính năng:
- User registration/login
- Product catalog
- Shopping cart
- Order management
- Payment integration

Technology stack: Node.js + React.js + PostgreSQL"
```

**Output sẽ tạo:**
- `business_analysis.md` (saved in `docs/architecture/`)
- User stories với acceptance criteria
- Success metrics và timeline estimates

### **Phase 2: Technical Design**

#### **Bước 3: Tạo Technical Design Document (TDD)**
```markdown
File: 2. technical_design_documentation_rule_universal.md
Khi nào dùng: Sau khi có PRD approved, cần tạo technical design
Mục đích: Design system architecture, database schema, API endpoints
```

**Ví dụ sử dụng:**
```
"Dựa trên PRD đã tạo, hãy tạo TDD cho e-commerce system với:
- Microservices architecture
- RESTful API design
- Database schema cho products, users, orders
- Authentication với JWT
- Payment gateway integration"
```

**Output sẽ tạo:**
- `tdd_ecommerce_system.md` (saved in `docs/architecture/`)
- System architecture diagrams (Mermaid)
- Database ERD
- API documentation
- Security và performance considerations

### **Phase 3: Task Breakdown**

#### **Bước 4: Breakdown Tasks**
```markdown
File: 3. task_breakdown_rule_universal.md
Khi nào dùng: Sau khi có TDD approved, cần breakdown thành actionable tasks
Mục đích: Tạo granular, actionable tasks với clear acceptance criteria
```

**Ví dụ sử dụng:**
```
"Dựa trên TDD e-commerce system, hãy breakdown thành tasks cho:
- User management module
- Product catalog module
- Shopping cart module
- Order management module

Technology stack: Node.js + TypeScript + NestJS + PostgreSQL"
```

**Output sẽ tạo:**
- `task_ecommerce_system.md` (saved in `docs/architecture/`)
- Granular tasks với acceptance criteria
- Task dependencies và priorities
- Technology-specific implementation details

### **Phase 4: Implementation**

#### **Bước 5: Implementation Workflow**
```markdown
File: 00. master_prompt_template.md
Khi nào dùng: Khi bắt đầu implement tasks (đã được integrate vào master template)
Mục đích: Hướng dẫn workflow implementation với quality standards
```

**Ví dụ sử dụng:**
```
"Tôi sẽ implement User Management module theo task breakdown đã tạo.
Technology stack: Node.js + NestJS + TypeORM + PostgreSQL
Hãy hướng dẫn workflow implementation."
```

#### **Bước 6: Implementation Rules**
```markdown
File: 4. implementation_rule_universal.md
Khi nào dùng: Khi implement specific tasks
Mục đích: Đảm bảo code quality, testing, và documentation standards
```

**Ví dụ sử dụng:**
```
"Tôi cần implement UserController với các endpoints:
- POST /api/users (create user)
- GET /api/users/:id (get user)
- PUT /api/users/:id (update user)
- DELETE /api/users/:id (delete user)

Technology stack: NestJS + TypeORM + PostgreSQL
Hãy hướng dẫn implementation rules."
```

### **Phase 5: Feature Requests**

#### **Bước 7: Xử Lý Feature Requests**
```markdown
File: 5. feature_request_workflow_prompt.md
Khi nào dùng: Khi có feature request mới trong project đang phát triển
Mục đích: Phân tích feature request, tạo PRD, TDD, và task breakdown
```

**Ví dụ sử dụng:**
```
"Tôi có feature request mới cho e-commerce system:
- Thêm tính năng product reviews và ratings
- Thêm tính năng wishlist
- Thêm tính năng product recommendations

Technology stack: Node.js + NestJS + PostgreSQL
Hãy xử lý feature request này."
```

**Output sẽ tạo:**
- `cr_001_prd_product_reviews.md` (saved in `docs/architecture/`)
- `cr_001_tdd_product_reviews.md` (saved in `docs/architecture/`)
- `cr_001_task_product_reviews.md` (saved in `docs/architecture/`)

### **Phase 6: Validation**

#### **Bước 8: Validation Checklist**
```markdown
File: 6. validation_checklist.md
Khi nào dùng: Trước khi bắt đầu bất kỳ phase nào
Mục đích: Đảm bảo tất cả requirements và standards được meet
```

**Ví dụ sử dụng:**
```
"Trước khi implement User Management module, hãy chạy validation checklist để đảm bảo:
- Tất cả dependencies đã sẵn sàng
- Code standards được follow
- Testing strategy đã được define
- Documentation plan đã được tạo"
```

## 🔄 Workflow Tổng Thể

### **New Project Workflow:**
```
1. Master Template → 2. PRD → 3. TDD → 4. Task Breakdown → 5. Implementation → 6. Validation
```

### **Feature Request Workflow:**
```
1. Feature Request → 2. PRD → 3. TDD → 4. Task Breakdown → 5. Implementation → 6. Validation
```

### **Implementation Workflow:**
```
1. Task Analysis → 2. Implementation → 3. Validation → 4. Task Status Update
```

## 🛠️ Technology Stack Support

### **Supported Technology Stacks:**

#### **Backend:**
- **.NET/C#**: Entity Framework, ASP.NET Core, CQRS, MediatR
- **Node.js/TypeScript**: NestJS, Express.js, TypeORM, Prisma
- **Python**: Django, FastAPI, Flask, SQLAlchemy
- **Java**: Spring Boot, JPA/Hibernate, Maven/Gradle

#### **Frontend:**
- **React.js**: Functional components, hooks, state management
- **Vue.js**: Composition API, Vuex, Vue Router
- **Angular**: Components, services, dependency injection

#### **Databases:**
- **SQL**: PostgreSQL, MySQL, SQL Server
- **NoSQL**: MongoDB, Redis, Elasticsearch

## 📋 Best Practices

### **1. Luôn Bắt Đầu Với Master Template**
- Đảm bảo consistency across tất cả prompts
- Follow universal standards và conventions

### **2. Technology Stack Detection**
- Luôn identify technology stack trước khi bắt đầu
- Adapt approach theo technology stack cụ thể

### **3. Task Management**
- Follow `3. task_breakdown_rule_universal.md` cho task breakdown
- Update task status sau khi implement
- Track progress trong Memory Bank

### **4. TDD Creation**
- Follow `2. technical_design_documentation_rule_universal.md` cho TDD
- Include comprehensive technical design với diagrams
- Adapt structure theo technology stack

### **5. Validation**
- Chạy validation checklist trước mỗi phase
- Đảm bảo quality standards được meet
- Document any issues hoặc blockers

## 🎯 Ví Dụ Cụ Thể

### **Ví Dụ 1: Tạo Blog System với .NET Core**

```markdown
1. Master Template: Setup .NET Core project standards
2. PRD: Define blog features (posts, comments, categories)
3. TDD: Design architecture với Entity Framework + ASP.NET Core
4. Task Breakdown: Break down thành tasks cho each module
5. Implementation: Implement theo .NET Core conventions
6. Validation: Ensure code quality và testing
```

### **Ví Dụ 2: Tạo API Gateway với Node.js**

```markdown
1. Master Template: Setup Node.js project standards
2. PRD: Define API gateway requirements (routing, auth, rate limiting)
3. TDD: Design microservices architecture với NestJS
4. Task Breakdown: Break down thành tasks cho each service
5. Implementation: Implement theo NestJS conventions
6. Validation: Ensure API quality và performance
```

### **Ví Dụ 3: Tạo Mobile App Backend với Python**

```markdown
1. Master Template: Setup Python project standards
2. PRD: Define mobile app backend requirements (users, posts, notifications)
3. TDD: Design RESTful API với FastAPI + SQLAlchemy
4. Task Breakdown: Break down thành tasks cho each endpoint
5. Implementation: Implement theo FastAPI conventions
6. Validation: Ensure API documentation và testing
```

## 🚨 Lưu Ý Quan Trọng

### **1. Memory Bank Integration**
- Luôn đọc `memory-bank/activeContext.md` trước khi bắt đầu
- Update progress trong Memory Bank sau mỗi phase
- Maintain project context và history

### **2. File Organization**
- Tất cả documents được save trong `docs/architecture/`
- Follow naming conventions: `[type]_[name].md`
- Maintain consistent file structure

### **3. Quality Assurance**
- Luôn include testing trong implementation
- Follow coding standards cho technology stack
- Update documentation as you progress

### **4. Error Handling**
- Document any issues hoặc blockers
- Ask for clarification khi cần thiết
- Follow error handling guidelines

## 📞 Support

Nếu có bất kỳ câu hỏi nào về việc sử dụng prompt system, hãy tham khảo:

1. **Master Template** (`00. master_prompt_template.md`) - Base guidelines
2. **Validation Checklist** (`6. validation_checklist.md`) - Quality assurance
3. **Specific Prompt Files** - Detailed instructions cho từng phase

---

**Happy Coding! 🚀**

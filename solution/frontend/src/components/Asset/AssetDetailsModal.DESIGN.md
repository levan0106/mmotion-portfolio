# Asset Details Modal - Professional Design

## 🎨 **Thiết kế Layout Chuyên Nghiệp**

### **Tổng quan**
Modal Asset Details mới được thiết kế với layout chuyên nghiệp, phù hợp với hệ thống tài chính, sử dụng ModalWrapper để đảm bảo consistency với các modal khác trong hệ thống.

### **Cấu trúc Layout**

```
┌─────────────────────────────────────────────────────────┐
│ ModalWrapper (Header + Close Button)                   │
├─────────────────────────────────────────────────────────┤
│ Asset Header Section                                    │
│ ├─ Asset Name & Symbol (Large)                         │
│ ├─ Asset Type Badge                                     │
│ └─ Status Indicator                                     │
├─────────────────────────────────────────────────────────┤
│ Key Metrics Cards (4 cards in row)                      │
│ ├─ Current Value (Primary)                             │
│ ├─ P&L Amount (Color-coded)                            │
│ ├─ P&L Percentage (Color-coded)                        │
│ └─ Quantity (Secondary)                                │
├─────────────────────────────────────────────────────────┤
│ Financial Overview (2-column grid)                      │
│ ├─ Left: Price Information                             │
│ │   ├─ Current Price                                   │
│ │   ├─ Average Cost                                    │
│ │   └─ Price Change                                    │
│ └─ Right: Position Details                             │
│     ├─ Total Quantity                                  │
│     ├─ Cost Basis                                      │
│     └─ Market Value                                    │
├─────────────────────────────────────────────────────────┤
│ Performance Analytics (4 metrics)                       │
│ ├─ Daily Performance                                   │
│ ├─ Weekly Performance                                  │
│ ├─ Monthly Performance                                 │
│ └─ Yearly Performance                                  │
├─────────────────────────────────────────────────────────┤
│ Metadata Section (4 columns)                           │
│ ├─ Created Date                                        │
│ ├─ Last Updated                                        │
│ ├─ Asset ID                                            │
│ └─ Status                                              │
├─────────────────────────────────────────────────────────┤
│ Actions (Edit, Delete, Close)                           │
└─────────────────────────────────────────────────────────┘
```

## 🎯 **Tính năng chính**

### **1. Asset Header Section**
- **Asset Name**: Typography lớn, font-weight 700
- **Symbol**: Typography secondary, font-weight 500
- **Type Badge**: Color-coded theo loại tài sản
- **Status Badge**: Active/Inactive với màu sắc phù hợp
- **Description**: Hiển thị mô tả nếu có

### **2. Key Metrics Cards**
- **Current Value**: Giá trị hiện tại (Primary color)
- **Unrealized P&L**: Lãi/lỗ chưa thực hiện (Color-coded)
- **P&L Percentage**: Tỷ lệ lãi/lỗ (Color-coded)
- **Quantity**: Số lượng nắm giữ (Warning color)

### **3. Financial Overview**
- **Price Information**: Current Price, Average Cost, Price Change
- **Position Details**: Total Quantity, Cost Basis, Market Value
- **Color-coded values**: Success/Error colors cho performance

### **4. Performance Analytics**
- **4 metrics**: Daily, Weekly, Monthly, Yearly
- **Visual indicators**: Icons và colors cho positive/negative
- **Responsive grid**: Auto-fit columns

### **5. Metadata Section**
- **4 columns**: Created, Updated, Asset ID, Status
- **Responsive design**: Collapse trên mobile
- **Monospace font**: Cho Asset ID

## 🎨 **Design System**

### **Color Palette**
```css
/* Primary Colors */
--primary-blue: #1976d2;
--success-green: #2e7d32;
--error-red: #d32f2f;
--warning-orange: #f57c00;

/* Asset Type Colors */
--stock-blue: #1976d2;
--bond-purple: #7b1fa2;
--etf-green: #2e7d32;
--gold-orange: #f57c00;
--crypto-pink: #c2185b;
```

### **Typography Scale**
```css
/* Headers */
--h4: 1.5rem (24px) - Asset Name
--h6: 1.25rem (20px) - Section Titles
--h5: 1.5rem (24px) - Metric Values

/* Body Text */
--body1: 1rem (16px) - Primary text
--body2: 0.875rem (14px) - Secondary text
--caption: 0.75rem (12px) - Labels
```

### **Spacing System**
```css
/* Padding */
--padding-xs: 8px
--padding-sm: 12px
--padding-md: 16px
--padding-lg: 20px
--padding-xl: 24px

/* Margins */
--margin-xs: 8px
--margin-sm: 12px
--margin-md: 16px
--margin-lg: 20px
--margin-xl: 24px
```

## 📱 **Responsive Design**

### **Breakpoints**
```css
/* Desktop: 1200px+ */
- 4-column metrics grid
- 2-column financial overview
- 4-column performance grid
- 4-column metadata

/* Tablet: 768px - 1199px */
- 2-column metrics grid
- 1-column financial overview
- 2-column performance grid
- 2-column metadata

/* Mobile: < 768px */
- 1-column metrics grid
- 1-column financial overview
- 1-column performance grid
- 1-column metadata
```

### **Mobile Optimizations**
- Reduced padding và margins
- Smaller font sizes
- Single-column layouts
- Touch-friendly button sizes
- Optimized spacing

## 🎭 **Animation & Effects**

### **Hover Effects**
```css
.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}
```

### **Loading Animations**
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### **Staggered Animations**
- Cards animate in sequence
- 0.1s delay between each card
- Smooth transitions

## 🔧 **Implementation Details**

### **ModalWrapper Integration**
```typescript
<ModalWrapper
  open={open}
  onClose={onClose}
  title="Asset Details"
  icon={<AccountBalanceIcon />}
  maxWidth="lg"
  loading={loading}
  actions={<ActionButtons />}
>
  <AssetDetailsContent />
</ModalWrapper>
```

### **Component Structure**
```typescript
AssetDetailsModal
├── ModalWrapper
│   ├── Header (Title + Icon + Close)
│   ├── Content
│   │   ├── AssetHeader
│   │   ├── KeyMetrics (4 cards)
│   │   ├── FinancialOverview (2 columns)
│   │   ├── PerformanceAnalytics (4 metrics)
│   │   └── Metadata (4 columns)
│   └── Actions (Edit, Delete)
```

### **Props Interface**
```typescript
interface AssetDetailsModalProps {
  open: boolean;
  onClose: () => void;
  asset: Asset | null;
  onEdit?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
  loading?: boolean;
}
```

## 🚀 **Usage Examples**

### **Basic Usage**
```typescript
<AssetDetailsModal
  open={isOpen}
  onClose={handleClose}
  asset={selectedAsset}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### **With Loading State**
```typescript
<AssetDetailsModal
  open={isOpen}
  onClose={handleClose}
  asset={selectedAsset}
  loading={isLoading}
/>
```

### **Read-only Mode**
```typescript
<AssetDetailsModal
  open={isOpen}
  onClose={handleClose}
  asset={selectedAsset}
  // No onEdit or onDelete props
/>
```

## 📊 **Performance Considerations**

### **Optimizations**
- Lazy loading cho performance data
- Memoized calculations
- Efficient re-renders
- CSS animations thay vì JS animations

### **Accessibility**
- ARIA labels cho screen readers
- Keyboard navigation support
- High contrast ratios
- Focus management

## 🎯 **Benefits**

### **User Experience**
- ✅ Professional appearance
- ✅ Clear information hierarchy
- ✅ Responsive design
- ✅ Consistent với hệ thống

### **Developer Experience**
- ✅ Reusable component
- ✅ TypeScript support
- ✅ Consistent API
- ✅ Easy customization

### **Business Value**
- ✅ Professional financial system appearance
- ✅ Better user engagement
- ✅ Improved usability
- ✅ Modern design standards

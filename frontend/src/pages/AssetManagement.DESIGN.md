# Asset Management Page - Professional Design

## 🎨 Design Philosophy

### **Minimalist & Professional**
- **Color Palette**: Monochromatic với accent đen (#1a1a1a) và xám (#666)
- **Typography**: Clean, readable fonts với hierarchy rõ ràng
- **Spacing**: Consistent 8px grid system
- **Shadows**: Subtle shadows để tạo depth mà không quá nổi bật

### **Key Design Principles**

#### 1. **Monochromatic Color Scheme**
```css
Primary: #1a1a1a (Dark Gray/Black)
Secondary: #666 (Medium Gray)
Background: #fafafa (Light Gray)
Borders: #e0e0e0 (Light Gray)
```

#### 2. **Clean Typography Hierarchy**
- **H1**: 28px, font-weight: 600 (Page Title)
- **H2**: 24px, font-weight: 600 (Section Headers)
- **Body**: 16px, font-weight: 400 (Regular Text)
- **Small**: 14px, font-weight: 500 (Labels & Captions)

#### 3. **Consistent Spacing**
- **Small**: 8px
- **Medium**: 16px
- **Large**: 24px
- **Extra Large**: 32px

## 🏗️ Layout Structure

### **Header Section**
```css
.asset-management__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e0e0e0;
}
```

**Features:**
- Clean title với subtitle
- Action buttons với consistent styling
- Subtle border separation

### **Statistics Cards**
```css
.asset-management__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}
```

**Features:**
- Responsive grid layout
- Hover effects với subtle animation
- Clean card design với minimal shadows

### **Content Area**
```css
.asset-management__content {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
```

**Features:**
- Clean white background
- Subtle border và shadow
- Rounded corners cho modern look

## 🎯 Component Design

### **Button System**
```css
.btn--primary {
  background: #1a1a1a;
  color: white;
  border-color: #1a1a1a;
}

.btn--outline {
  background: transparent;
  color: #1a1a1a;
  border-color: #e0e0e0;
}
```

**Button Types:**
- **Primary**: Dark background cho main actions
- **Outline**: Transparent background cho secondary actions
- **Active**: Highlighted state cho selected items

### **Card Design**
```css
.stat-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 24px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
```

**Features:**
- Clean white background
- Subtle border
- Hover animation
- Consistent padding

## 📱 Responsive Design

### **Mobile First Approach**
```css
@media (max-width: 768px) {
  .asset-management__header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .asset-management__stats {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
  }
}
```

**Breakpoints:**
- **Desktop**: > 768px
- **Tablet**: 768px - 480px
- **Mobile**: < 480px

### **Grid System**
- **Desktop**: 4-column grid cho statistics
- **Tablet**: 2-column grid
- **Mobile**: 1-column grid

## 🎨 Visual Hierarchy

### **1. Information Architecture**
```
Header (Title + Actions)
    ↓
Statistics (4 Key Metrics)
    ↓
Filters (Search & Filter Controls)
    ↓
Controls (View Toggle + Pagination Info)
    ↓
Content (List/Grid View)
    ↓
Pagination (Navigation Controls)
```

### **2. Content Priority**
1. **Primary**: Asset list/grid
2. **Secondary**: Statistics và filters
3. **Tertiary**: Pagination và controls

## 🔧 Technical Implementation

### **CSS Architecture**
- **BEM Methodology**: Block__Element--Modifier
- **Component-based**: Mỗi section có class riêng
- **Responsive**: Mobile-first approach
- **Performance**: Optimized CSS với minimal redundancy

### **State Management**
- **View Mode**: List/Grid toggle
- **Filters**: Advanced filtering options
- **Pagination**: Smart pagination với ellipsis
- **Loading**: Skeleton states

## 🚀 Performance Optimizations

### **CSS Optimizations**
- **Minimal Colors**: Reduced color palette
- **Efficient Selectors**: Optimized CSS selectors
- **Responsive Images**: Proper image handling
- **Animation**: Hardware-accelerated transitions

### **JavaScript Optimizations**
- **Memoization**: useMemo cho expensive calculations
- **Callbacks**: useCallback cho event handlers
- **Lazy Loading**: Component lazy loading
- **Virtual Scrolling**: For large datasets

## 📊 Accessibility Features

### **Semantic HTML**
- Proper heading hierarchy
- ARIA labels cho interactive elements
- Keyboard navigation support
- Screen reader compatibility

### **Visual Accessibility**
- High contrast ratios
- Clear typography
- Consistent spacing
- Focus indicators

## 🎯 Future Enhancements

### **Planned Improvements**
1. **Dark Mode**: Toggle between light/dark themes
2. **Advanced Filters**: More filtering options
3. **Bulk Actions**: Multi-select operations
4. **Export Features**: Data export functionality
5. **Real-time Updates**: WebSocket integration

### **Performance Monitoring**
- Bundle size optimization
- Runtime performance tracking
- User experience metrics
- Accessibility compliance

---

## 📝 Usage Notes

### **CSS Classes**
```css
.asset-management__header     /* Main header section */
.asset-management__stats     /* Statistics cards grid */
.asset-management__content   /* Main content area */
.asset-management__controls  /* View controls */
.asset-management__pagination /* Pagination section */
```

### **Button Modifiers**
```css
.btn--primary    /* Primary action button */
.btn--outline    /* Secondary action button */
.btn--active     /* Active/selected state */
```

### **Responsive Breakpoints**
```css
@media (max-width: 768px)  /* Tablet */
@media (max-width: 480px)  /* Mobile */
```

Thiết kế này tập trung vào **usability**, **accessibility** và **performance** với giao diện chuyên nghiệp, tối giản và dễ sử dụng.

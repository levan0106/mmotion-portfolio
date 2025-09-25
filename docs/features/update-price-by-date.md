# Tính Năng Cập Nhật Giá Theo Ngày Lịch Sử

## Tổng Quan

Tính năng "Cập nhật giá theo ngày lịch sử" cho phép người dùng cập nhật giá hiện tại của các tài sản bằng cách lấy giá từ dữ liệu lịch sử theo ngày được chọn. Đây là một tính năng hữu ích để:

- Khôi phục giá từ một ngày cụ thể
- Cập nhật hàng loạt nhiều tài sản cùng lúc
- Tiết kiệm thời gian thay vì cập nhật từng tài sản một

## Workflow

### 1. Khởi Tạo
- Người dùng click button "Cập nhật giá theo ngày" trên trang Global Assets
- Modal mở ra với giao diện thân thiện

### 2. Chọn Ngày
- Date picker cho phép chọn ngày trong quá khứ
- Validation: Không cho chọn ngày tương lai
- Default: Ngày hôm qua

### 3. Hiển Thị Tài Sản
- Hệ thống tự động load danh sách tất cả tài sản
- Mỗi tài sản hiển thị:
  - ✅ Checkbox (default: checked cho tài sản có dữ liệu)
  - Symbol + tên tài sản
  - Giá hiện tại
  - Giá từ ngày được chọn (nếu có)
  - Trạng thái có/không có dữ liệu lịch sử

### 4. Chọn Tài Sản
- Người dùng có thể check/uncheck tài sản cần cập nhật
- Hệ thống hiển thị thống kê:
  - Tổng số tài sản
  - Số tài sản đã chọn
  - Số tài sản có dữ liệu lịch sử
  - Số tài sản không có dữ liệu

### 5. Xác Nhận
- Hiển thị tóm tắt trước khi thực hiện
- Cảnh báo về tài sản không có dữ liệu
- Cho phép nhập lý do cập nhật (tùy chọn)

### 6. Thực Hiện Cập Nhật
- Hệ thống xử lý từng tài sản một cách an toàn
- Graceful error handling: lỗi một tài sản không ảnh hưởng đến tài sản khác
- Hiển thị progress và kết quả chi tiết

### 7. Kết Quả
- Hiển thị thống kê tổng quan:
  - Số tài sản cập nhật thành công
  - Số tài sản thất bại
  - Tổng số tài sản đã xử lý
- Chi tiết kết quả cho từng tài sản:
  - Tài sản thành công: hiển thị giá cũ → giá mới
  - Tài sản thất bại: hiển thị lý do lỗi

## API Endpoints

### 1. Lấy Tài Sản Với Giá Lịch Sử
```
GET /api/v1/asset-prices/bulk/historical-prices
```

**Query Parameters:**
- `targetDate` (required): Ngày lấy giá lịch sử (YYYY-MM-DD)
- `assetIds` (optional): Danh sách ID tài sản cụ thể (comma-separated)

**Response:**
```json
[
  {
    "assetId": "uuid",
    "symbol": "HPG",
    "name": "Hoa Phat Group",
    "currentPrice": 150000,
    "historicalPrice": 148000,
    "hasHistoricalData": true,
    "currency": "VND",
    "type": "STOCK"
  }
]
```

### 2. Cập Nhật Hàng Loạt
```
POST /api/v1/asset-prices/bulk/update-by-date
```

**Request Body:**
```json
{
  "targetDate": "2024-01-15",
  "assetIds": ["uuid1", "uuid2"],
  "reason": "Bulk update from historical data"
}
```

**Response:**
```json
{
  "successCount": 2,
  "failedCount": 0,
  "totalCount": 2,
  "results": [
    {
      "assetId": "uuid1",
      "symbol": "HPG",
      "success": true,
      "message": "Updated from 150000 to 148000",
      "oldPrice": 150000,
      "newPrice": 148000
    }
  ]
}
```

### 3. Lấy Ngày Có Dữ Liệu
```
GET /api/v1/asset-prices/bulk/available-dates
```

**Query Parameters:**
- `limit` (optional): Số lượng ngày tối đa trả về (default: 30)

**Response:**
```json
[
  {
    "date": "2024-01-15",
    "assetCount": 25,
    "isWeekend": false,
    "isHoliday": false
  }
]
```

## Frontend Components

### 1. UpdatePriceByDateButton
Button chính để mở modal cập nhật giá.

**Props:**
- `onUpdateSuccess`: Callback khi cập nhật thành công
- `variant`: Style variant của button
- `size`: Kích thước button
- `disabled`: Trạng thái disabled
- `fullWidth`: Chiều rộng đầy đủ

### 2. UpdatePriceByDateModal
Modal chính chứa toàn bộ workflow cập nhật giá.

**Props:**
- `open`: Trạng thái mở/đóng modal
- `onClose`: Callback khi đóng modal
- `onSuccess`: Callback khi cập nhật thành công

### 3. useAssetPriceBulk Hook
Custom hook để gọi API và quản lý state.

**Methods:**
- `getAssetsWithHistoricalPrice`: Lấy tài sản với giá lịch sử
- `bulkUpdatePricesByDate`: Cập nhật hàng loạt
- `getAvailableHistoricalDates`: Lấy ngày có dữ liệu

## Tính Năng Bảo Mật

### 1. Validation
- Không cho chọn ngày tương lai
- Validate format ngày tháng
- Kiểm tra tồn tại của tài sản

### 2. Error Handling
- Graceful degradation: lỗi một tài sản không ảnh hưởng đến tài sản khác
- Detailed error messages cho từng trường hợp
- Logging đầy đủ cho debugging

### 3. Data Integrity
- Metadata tracking: lưu lý do, ngày target, giá cũ
- Audit trail: theo dõi mọi thay đổi giá
- Transaction safety: rollback nếu có lỗi nghiêm trọng

## Sử Dụng

### 1. Từ Trang Global Assets
1. Vào trang Global Assets
2. Click button "Cập nhật giá theo ngày" ở góc phải trên
3. Chọn ngày cần lấy giá lịch sử
4. Chọn tài sản cần cập nhật
5. Nhập lý do (tùy chọn)
6. Xác nhận và thực hiện cập nhật

### 2. Từ Code
```typescript
import { UpdatePriceByDateButton } from '../components/AssetPrice';

// Sử dụng button
<UpdatePriceByDateButton
  onUpdateSuccess={(result) => {
    console.log('Updated:', result.successCount, 'assets');
    // Refresh data
  }}
  variant="outlined"
  size="small"
/>

// Hoặc sử dụng hook trực tiếp
import { useAssetPriceBulk } from '../hooks/useAssetPriceBulk';

const { bulkUpdatePricesByDate } = useAssetPriceBulk();

const result = await bulkUpdatePricesByDate(
  '2024-01-15',
  ['asset-id-1', 'asset-id-2'],
  'Custom reason'
);
```

## Lưu Ý

### 1. Performance
- API được tối ưu để xử lý hàng loạt
- Frontend sử dụng pagination cho danh sách tài sản lớn
- Caching để giảm số lần gọi API

### 2. User Experience
- Loading states rõ ràng
- Progress indicators
- Error messages thân thiện
- Responsive design

### 3. Maintenance
- Code được viết theo best practices
- Comprehensive test coverage
- Detailed documentation
- Easy to extend và customize

## Troubleshooting

### 1. Không Có Dữ Liệu Lịch Sử
- Kiểm tra xem ngày được chọn có phải ngày nghỉ không
- Xác nhận tài sản đã có giá trong ngày đó
- Kiểm tra timezone settings

### 2. Lỗi Cập Nhật
- Xem chi tiết lỗi trong modal kết quả
- Kiểm tra logs backend
- Đảm bảo tài sản vẫn active

### 3. Performance Issues
- Giảm số lượng tài sản cập nhật cùng lúc
- Chọn ngày gần đây hơn
- Kiểm tra network connection

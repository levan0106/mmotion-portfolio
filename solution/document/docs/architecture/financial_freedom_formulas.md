# Công Thức Tính Toán Tài Chính - Financial Freedom Planning

## Định Nghĩa Các Biến

- **PV** = Vốn ban đầu (Present Value / Initial Investment)
- **PMT** = Vốn thanh toán định kỳ mỗi kỳ (Periodic Payment)
- **r** = Lãi suất danh nghĩa theo kỳ (Nominal Interest Rate per Period)
- **i** = Tỷ lệ lạm phát theo kỳ (Inflation Rate per Period)
- **n** = Số kỳ (Number of Periods)
- **FV** = Giá trị danh nghĩa mục tiêu sau n kỳ (Future Value - Nominal)
- **RV** = Giá trị thực mục tiêu (đã điều chỉnh lạm phát) (Real Value / Target Present Value)

## Công Thức Cơ Bản

### 1. Công thức tính FV (Future Value)

**Khi biết PV, PMT, r, n:**

```
FV = PV × (1 + r)^n + PMT × [((1 + r)^n - 1) / r]
```

**Trường hợp đặc biệt khi r = 0:**
```
FV = PV + PMT × n
```

### 2. Công thức tính PV (Present Value / Initial Investment)

**Khi biết FV, PMT, r, n:**

```
PV = (FV - PMT × [((1 + r)^n - 1) / r]) / (1 + r)^n
```

**Trường hợp đặc biệt khi r = 0:**
```
PV = FV - PMT × n
```

### 3. Công thức tính PMT (Periodic Payment)

**Khi biết FV, PV, r, n:**

```
PMT = (FV - PV × (1 + r)^n) / [((1 + r)^n - 1) / r]
```

**Trường hợp đặc biệt khi r = 0:**
```
PMT = (FV - PV) / n
```

### 4. Công thức tính r (Return Rate)

**Khi biết FV, PV, PMT, n:**

Không có công thức đại số trực tiếp. Phải giải bằng phương pháp số:
- **Newton-Raphson Method** (phương pháp được sử dụng trong code)
- **Binary Search** (phương pháp dự phòng)

**Công thức Newton-Raphson:**
```
r_new = r_old - f(r) / f'(r)
```

Trong đó:
```
f(r) = FV - PV × (1 + r)^n - PMT × [((1 + r)^n - 1) / r]
```

```
f'(r) = PV × n × (1 + r)^(n-1) + PMT × [(n × (1 + r)^n × r - ((1 + r)^n - 1)) / r²]
```

**Trường hợp đặc biệt khi r = 0:**
```
f'(r) = PV × n + PMT × [n × (n + 1) / 2]
```

### 5. Công thức tính n (Number of Periods)

**Khi biết FV, PV, PMT, r:**

Không có công thức đại số trực tiếp. Phải giải bằng phương pháp số:
- **Binary Search** (phương pháp được sử dụng trong code)

**Trường hợp đặc biệt khi r = 0:**
```
n = (FV - PV) / PMT
```

**Lưu ý:** PMT phải khác 0 khi r = 0

## Công Thức Liên Quan Đến Lạm Phát

### 6. Công thức tính FV từ RV (Future Value từ Real Value)

**Khi biết RV, i, n:**

```
FV = RV × (1 + i)^n
```

### 7. Công thức tính RV từ FV (Real Value từ Future Value)

**Khi biết FV, i, n:**

```
RV = FV / (1 + i)^n
```

### 8. Công thức tính i (Inflation Rate)

**Khi biết FV, RV, n:**

```
i = (FV / RV)^(1/n) - 1
```

**Hoặc:**
```
i = exp(ln(FV / RV) / n) - 1
```

### 9. Công thức tính n từ FV và RV

**Khi biết FV, RV, i:**

```
n = ln(FV / RV) / ln(1 + i)
```

**Hoặc:**
```
n = log(FV / RV) / log(1 + i)
```

## Tóm Tắt Các Công Thức

| Biến cần tính | Công thức | Điều kiện |
|--------------|----------|-----------|
| **FV** | `FV = PV × (1 + r)^n + PMT × [((1 + r)^n - 1) / r]` | Biết PV, PMT, r, n |
| **PV** | `PV = (FV - PMT × [((1 + r)^n - 1) / r]) / (1 + r)^n` | Biết FV, PMT, r, n |
| **PMT** | `PMT = (FV - PV × (1 + r)^n) / [((1 + r)^n - 1) / r]` | Biết FV, PV, r, n |
| **r** | Phương pháp số (Newton-Raphson hoặc Binary Search) | Biết FV, PV, PMT, n |
| **n** | Phương pháp số (Binary Search) | Biết FV, PV, PMT, r |
| **FV từ RV** | `FV = RV × (1 + i)^n` | Biết RV, i, n |
| **RV từ FV** | `RV = FV / (1 + i)^n` | Biết FV, i, n |
| **i** | `i = (FV / RV)^(1/n) - 1` | Biết FV, RV, n |
| **n từ FV/RV** | `n = ln(FV / RV) / ln(1 + i)` | Biết FV, RV, i |

## Trường Hợp Đặc Biệt (r = 0)

Khi lãi suất = 0, các công thức được đơn giản hóa:

| Biến | Công thức khi r = 0 |
|------|---------------------|
| **FV** | `FV = PV + PMT × n` |
| **PV** | `PV = FV - PMT × n` |
| **PMT** | `PMT = (FV - PV) / n` |
| **n** | `n = (FV - PV) / PMT` (nếu PMT ≠ 0) |

## Lưu Ý Quan Trọng

1. **Đơn vị của r và i:** Phải nhất quán (ví dụ: nếu n tính theo tháng, r và i cũng phải là lãi suất/tháng)

2. **Dấu của PMT:**
   - **Dương (+):** Khi là khoản đóng góp (contribution)
   - **Âm (-):** Khi là khoản rút tiền (withdrawal)

3. **Giải phương trình cho r và n:** 
   - Cần phương pháp số vì không có công thức đại số trực tiếp
   - Code hiện tại sử dụng Newton-Raphson cho r và Binary Search cho n

4. **Validation:**
   - Đảm bảo ít nhất một trong hai: PV > 0 hoặc PMT ≠ 0
   - Khi tính n với r = 0, PMT phải khác 0
   - Khi tính r, n phải > 0

## Ví Dụ Tính Toán

### Ví dụ 1: Tính FV
- PV = 10,000,000 VNĐ
- PMT = 1,000,000 VNĐ/tháng
- r = 0.01 (1%/tháng)
- n = 60 tháng

```
FV = 10,000,000 × (1.01)^60 + 1,000,000 × [((1.01)^60 - 1) / 0.01]
FV ≈ 10,000,000 × 1.8167 + 1,000,000 × 81.67
FV ≈ 18,167,000 + 81,670,000
FV ≈ 99,837,000 VNĐ
```

### Ví dụ 2: Tính PV
- FV = 100,000,000 VNĐ
- PMT = 1,000,000 VNĐ/tháng
- r = 0.01 (1%/tháng)
- n = 60 tháng

```
PV = (100,000,000 - 1,000,000 × [((1.01)^60 - 1) / 0.01]) / (1.01)^60
PV = (100,000,000 - 1,000,000 × 81.67) / 1.8167
PV = (100,000,000 - 81,670,000) / 1.8167
PV ≈ 10,100,000 VNĐ
```

### Ví dụ 3: Tính PMT
- FV = 100,000,000 VNĐ
- PV = 10,000,000 VNĐ
- r = 0.01 (1%/tháng)
- n = 60 tháng

```
PMT = (100,000,000 - 10,000,000 × (1.01)^60) / [((1.01)^60 - 1) / 0.01]
PMT = (100,000,000 - 10,000,000 × 1.8167) / 81.67
PMT = (100,000,000 - 18,167,000) / 81.67
PMT ≈ 1,001,000 VNĐ/tháng
```

### Ví dụ 4: Tính FV từ RV với lạm phát
- RV = 50,000,000 VNĐ (giá trị thực hiện tại)
- i = 0.045 (4.5%/năm)
- n = 10 năm

```
FV = 50,000,000 × (1.045)^10
FV = 50,000,000 × 1.5529
FV ≈ 77,645,000 VNĐ
```

### Ví dụ 5: Tính RV từ FV với lạm phát
- FV = 77,645,000 VNĐ (giá trị danh nghĩa sau 10 năm)
- i = 0.045 (4.5%/năm)
- n = 10 năm

```
RV = 77,645,000 / (1.045)^10
RV = 77,645,000 / 1.5529
RV ≈ 50,000,000 VNĐ
```

## Công Thức Tính Trực Tiếp Từ RV (Real Value)

Thay vì tính FV trước rồi mới tính các biến khác, có thể tính trực tiếp từ RV (giá trị thực). Điều này hữu ích khi mục tiêu được định nghĩa theo giá trị thực (đã điều chỉnh lạm phát).

### 10. Công thức tính PV từ RV (Initial Investment từ Real Value)

**Khi biết RV, PMT, r, i, n:**

```
PV = (RV × (1 + i)^n - PMT × [((1 + r)^n - 1) / r]) / (1 + r)^n
```

**Giải thích:**
1. Chuyển đổi RV sang FV: `FV = RV × (1 + i)^n`
2. Tính PV từ FV: `PV = (FV - PMT × [((1 + r)^n - 1) / r]) / (1 + r)^n`
3. Kết hợp: `PV = (RV × (1 + i)^n - PMT × [((1 + r)^n - 1) / r]) / (1 + r)^n`

**Trường hợp đặc biệt khi r = 0:**
```
PV = RV × (1 + i)^n - PMT × n
```

### 11. Công thức tính PMT từ RV (Periodic Payment từ Real Value)

**Khi biết RV, PV, r, i, n:**

```
PMT = (RV × (1 + i)^n - PV × (1 + r)^n) / [((1 + r)^n - 1) / r]
```

**Giải thích:**
1. Chuyển đổi RV sang FV: `FV = RV × (1 + i)^n`
2. Tính PMT từ FV: `PMT = (FV - PV × (1 + r)^n) / [((1 + r)^n - 1) / r]`
3. Kết hợp: `PMT = (RV × (1 + i)^n - PV × (1 + r)^n) / [((1 + r)^n - 1) / r]`

**Trường hợp đặc biệt khi r = 0:**
```
PMT = (RV × (1 + i)^n - PV) / n
```

### 12. Công thức tính r từ RV (Return Rate từ Real Value)

**Khi biết RV, PV, PMT, i, n:**

Không có công thức đại số trực tiếp. Phải giải bằng phương pháp số:
- **Newton-Raphson Method** với hàm mục tiêu được điều chỉnh
- **Binary Search** (phương pháp dự phòng)

**Công thức Newton-Raphson với RV:**
```
r_new = r_old - f(r) / f'(r)
```

Trong đó:
```
f(r) = RV × (1 + i)^n - PV × (1 + r)^n - PMT × [((1 + r)^n - 1) / r]
```

```
f'(r) = PV × n × (1 + r)^(n-1) + PMT × [(n × (1 + r)^n × r - ((1 + r)^n - 1)) / r²]
```

**Cách tính:**
1. Chuyển đổi RV sang FV: `FV = RV × (1 + i)^n`
2. Giải phương trình: `FV = PV × (1 + r)^n + PMT × [((1 + r)^n - 1) / r]` để tìm r

### 13. Công thức tính n từ RV (Number of Periods từ Real Value)

**Khi biết RV, PV, PMT, r, i:**

Không có công thức đại số trực tiếp. Phải giải bằng phương pháp số:
- **Binary Search** (phương pháp được sử dụng trong code)

**Cách tính:**
1. Với mỗi giá trị n thử nghiệm, chuyển đổi RV sang FV: `FV = RV × (1 + i)^n`
2. Tính FV thực tế: `FV_actual = PV × (1 + r)^n + PMT × [((1 + r)^n - 1) / r]`
3. So sánh FV và FV_actual để tìm n phù hợp

**Trường hợp đặc biệt khi r = 0:**
```
n = (RV × (1 + i)^n - PV) / PMT
```
Lưu ý: Phương trình này vẫn phải giải bằng phương pháp số vì n xuất hiện ở cả hai vế.

## Tóm Tắt Công Thức Tính Từ RV

| Biến cần tính | Công thức từ RV | Điều kiện |
|--------------|----------------|-----------|
| **PV từ RV** | `PV = (RV × (1 + i)^n - PMT × [((1 + r)^n - 1) / r]) / (1 + r)^n` | Biết RV, PMT, r, i, n |
| **PMT từ RV** | `PMT = (RV × (1 + i)^n - PV × (1 + r)^n) / [((1 + r)^n - 1) / r]` | Biết RV, PV, r, i, n |
| **r từ RV** | Phương pháp số (Newton-Raphson hoặc Binary Search) | Biết RV, PV, PMT, i, n |
| **n từ RV** | Phương pháp số (Binary Search) | Biết RV, PV, PMT, r, i |

## So Sánh: Tính Từ FV vs Tính Từ RV

### Phương pháp 1: Tính từ FV (2 bước)
1. Tính FV từ PV, PMT, r, n: `FV = PV × (1 + r)^n + PMT × [((1 + r)^n - 1) / r]`
2. Chuyển đổi FV sang RV: `RV = FV / (1 + i)^n`

### Phương pháp 2: Tính từ RV (trực tiếp)
1. Tính trực tiếp từ RV: `PV = (RV × (1 + i)^n - PMT × [((1 + r)^n - 1) / r]) / (1 + r)^n`

**Ưu điểm của phương pháp tính từ RV:**
- Tính toán trực tiếp, không cần bước trung gian
- Dễ hiểu hơn khi mục tiêu được định nghĩa theo giá trị thực
- Tránh sai số tích lũy từ nhiều bước tính toán

## Ví Dụ Tính Toán Từ RV

### Ví dụ 6: Tính PV từ RV
- RV = 50,000,000 VNĐ (giá trị thực mục tiêu)
- PMT = 1,000,000 VNĐ/tháng
- r = 0.01 (1%/tháng)
- i = 0.00375 (4.5%/năm = 0.375%/tháng)
- n = 60 tháng

**Bước 1:** Chuyển RV sang FV
```
FV = 50,000,000 × (1.00375)^60
FV ≈ 50,000,000 × 1.252
FV ≈ 62,600,000 VNĐ
```

**Bước 2:** Tính PV từ FV
```
PV = (62,600,000 - 1,000,000 × [((1.01)^60 - 1) / 0.01]) / (1.01)^60
PV = (62,600,000 - 1,000,000 × 81.67) / 1.8167
PV = (62,600,000 - 81,670,000) / 1.8167
PV ≈ -10,500,000 VNĐ (không hợp lý - cần điều chỉnh PMT)
```

**Hoặc tính trực tiếp:**
```
PV = (50,000,000 × (1.00375)^60 - 1,000,000 × [((1.01)^60 - 1) / 0.01]) / (1.01)^60
```

### Ví dụ 7: Tính PMT từ RV
- RV = 50,000,000 VNĐ (giá trị thực mục tiêu)
- PV = 10,000,000 VNĐ
- r = 0.01 (1%/tháng)
- i = 0.00375 (4.5%/năm = 0.375%/tháng)
- n = 60 tháng

**Bước 1:** Chuyển RV sang FV
```
FV = 50,000,000 × (1.00375)^60
FV ≈ 62,600,000 VNĐ
```

**Bước 2:** Tính PMT từ FV
```
PMT = (62,600,000 - 10,000,000 × (1.01)^60) / [((1.01)^60 - 1) / 0.01]
PMT = (62,600,000 - 10,000,000 × 1.8167) / 81.67
PMT = (62,600,000 - 18,167,000) / 81.67
PMT ≈ 544,000 VNĐ/tháng
```

**Hoặc tính trực tiếp:**
```
PMT = (50,000,000 × (1.00375)^60 - 10,000,000 × (1.01)^60) / [((1.01)^60 - 1) / 0.01]
```

## Lưu Ý Khi Tính Từ RV

1. **Đơn vị của i và r:** Phải nhất quán với n
   - Nếu n tính theo tháng, i và r cũng phải là lãi suất/tháng
   - Nếu n tính theo năm, i và r cũng phải là lãi suất/năm

2. **Chuyển đổi lãi suất:**
   - Lãi suất năm → tháng: `r_monthly = r_yearly / 12`
   - Lãi suất năm → quý: `r_quarterly = r_yearly / 4`

3. **Validation:**
   - RV phải > 0
   - Khi tính PV từ RV, đảm bảo kết quả >= 0
   - Khi tính PMT từ RV, xem xét dấu (contribution vs withdrawal)


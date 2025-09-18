# Alternative Cash Flow Design - Không dùng Trade

## Option 1: Tách riêng Cash Flow Entity

### 1.1 Tạo Cash Flow Entity riêng
```typescript
@Entity('cash_flows')
export class CashFlow {
  @PrimaryGeneratedColumn('uuid', { name: 'cash_flow_id' })
  cashFlowId: string;

  @Column('uuid', { name: 'portfolio_id' })
  portfolioId: string;

  @Column({ type: 'enum', enum: CashFlowType })
  type: CashFlowType;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'VND' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  reference: string;

  @Column({ type: 'timestamp', name: 'flow_date' })
  flowDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export enum CashFlowType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  DIVIDEND = 'DIVIDEND',
  INTEREST = 'INTEREST',
  FEE = 'FEE',
  TAX = 'TAX',
  ADJUSTMENT = 'ADJUSTMENT'
}
```

### 1.2 Cash Flow Service
```typescript
@Injectable()
export class CashFlowService {
  constructor(
    @InjectRepository(CashFlow)
    private readonly cashFlowRepository: Repository<CashFlow>,
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
  ) {}

  // Tạo cash flow
  async createCashFlow(
    portfolioId: string,
    type: CashFlowType,
    amount: number,
    description: string,
    reference?: string
  ): Promise<CashFlow> {
    const cashFlow = this.cashFlowRepository.create({
      portfolioId,
      type,
      amount,
      description,
      reference,
      flowDate: new Date()
    });

    const savedCashFlow = await this.cashFlowRepository.save(cashFlow);
    
    // Update portfolio cash balance
    await this.updatePortfolioCashBalance(portfolioId);
    
    return savedCashFlow;
  }

  // Tính cash balance từ tất cả cash flows
  async calculateCashBalance(portfolioId: string): Promise<number> {
    const cashFlows = await this.cashFlowRepository.find({
      where: { portfolioId },
      order: { flowDate: 'ASC' }
    });

    let balance = 0;
    for (const flow of cashFlows) {
      if (flow.type === CashFlowType.DEPOSIT || 
          flow.type === CashFlowType.DIVIDEND || 
          flow.type === CashFlowType.INTEREST) {
        balance += parseFloat(flow.amount.toString());
      } else {
        balance -= parseFloat(flow.amount.toString());
      }
    }

    return balance;
  }

  // Update portfolio cash balance
  private async updatePortfolioCashBalance(portfolioId: string): Promise<void> {
    const balance = await this.calculateCashBalance(portfolioId);
    
    await this.portfolioRepository.update(
      { portfolioId },
      { cashBalance: balance }
    );
  }
}
```

## Option 2: Sử dụng Portfolio Balance History

### 2.1 Tạo Balance History Entity
```typescript
@Entity('portfolio_balance_history')
export class PortfolioBalanceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'portfolio_id' })
  portfolioId: string;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  cashBalance: number;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  totalValue: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp', name: 'snapshot_date' })
  snapshotDate: Date;

  @CreateDateColumn()
  createdAt: Date;
}
```

### 2.2 Balance Snapshot Service
```typescript
@Injectable()
export class BalanceSnapshotService {
  // Tạo snapshot balance
  async createBalanceSnapshot(
    portfolioId: string,
    description: string
  ): Promise<PortfolioBalanceHistory> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId }
    });

    const snapshot = this.balanceHistoryRepository.create({
      portfolioId,
      cashBalance: portfolio.cashBalance,
      totalValue: portfolio.totalValue,
      description,
      snapshotDate: new Date()
    });

    return await this.balanceHistoryRepository.save(snapshot);
  }

  // Lấy balance history
  async getBalanceHistory(
    portfolioId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PortfolioBalanceHistory[]> {
    const query = this.balanceHistoryRepository
      .createQueryBuilder('history')
      .where('history.portfolioId = :portfolioId', { portfolioId });

    if (startDate) {
      query.andWhere('history.snapshotDate >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('history.snapshotDate <= :endDate', { endDate });
    }

    return await query
      .orderBy('history.snapshotDate', 'DESC')
      .getMany();
  }
}
```

## Option 3: Hybrid Approach - Kết hợp cả hai

### 3.1 Cash Flow cho transactions
- Sử dụng CashFlow entity cho các giao dịch tiền mặt
- Tách biệt với Trade entity

### 3.2 Trade chỉ cho assets
- Trade entity chỉ dành cho asset transactions
- AssetId luôn required

### 3.3 Portfolio Service kết hợp
```typescript
@Injectable()
export class PortfolioService {
  async calculatePortfolioValue(portfolio: Portfolio): Promise<void> {
    // 1. Tính cash balance từ cash flows
    const cashBalance = await this.cashFlowService.calculateCashBalance(portfolio.portfolioId);
    
    // 2. Tính asset values từ trades
    const assetValues = await this.portfolioCalculationService.calculateAssetValues(portfolio.portfolioId);
    
    // 3. Tính total value
    const totalValue = cashBalance + assetValues;
    
    // 4. Update portfolio
    portfolio.cashBalance = cashBalance;
    portfolio.totalValue = totalValue;
    await this.portfolioRepository.save(portfolio);
  }
}
```

## So sánh các giải pháp

### ✅ **Option 1: Tách riêng Cash Flow Entity**
**Ưu điểm:**
- Rõ ràng, dễ hiểu
- Không ảnh hưởng đến Trade entity
- Dễ maintain

**Nhược điểm:**
- Cần maintain 2 entities
- Có thể duplicate logic

### ✅ **Option 2: Balance History**
**Ưu điểm:**
- Audit trail hoàn chỉnh
- Dễ track changes
- Good for reporting

**Nhược điểm:**
- Phức tạp hơn
- Cần thêm storage

### ✅ **Option 3: Hybrid**
**Ưu điểm:**
- Best of both worlds
- Clear separation of concerns
- Flexible

**Nhược điểm:**
- Phức tạp hơn
- Cần maintain nhiều services

## Khuyến nghị

**Nếu muốn đơn giản**: Chọn **Option 1** - Tách riêng Cash Flow Entity
**Nếu muốn audit trail**: Chọn **Option 2** - Balance History  
**Nếu muốn linh hoạt**: Chọn **Option 3** - Hybrid Approach

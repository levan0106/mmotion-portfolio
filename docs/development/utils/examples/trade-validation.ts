/**
 * Trade Validation Examples
 * 
 * This file demonstrates how to use validation utilities in trade-related components.
 * All examples follow the best practices defined in VALIDATION_UTILS.md
 */

import { testUtils } from '@/test/utils/test-helpers';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Example 1: Trade Service Validation
export class TradeService {
  async createTrade(tradeData: CreateTradeDto) {
    // Validate portfolio ID
    if (!testUtils.validation.isValidUUID(tradeData.portfolioId)) {
      throw new BadRequestException('Invalid portfolio ID format');
    }

    // Validate asset ID
    if (!testUtils.validation.isValidUUID(tradeData.assetId)) {
      throw new BadRequestException('Invalid asset ID format');
    }

    // Validate quantity
    if (!testUtils.validation.isPositiveNumber(tradeData.quantity)) {
      throw new BadRequestException('Quantity must be a positive number');
    }

    // Validate price
    if (!testUtils.validation.isPositiveNumber(tradeData.price)) {
      throw new BadRequestException('Price must be a positive number');
    }

    // Validate trade date
    if (!testUtils.validation.isValidDate(tradeData.tradeDate)) {
      throw new BadRequestException('Invalid trade date');
    }

    // Validate trade type
    if (!['buy', 'sell'].includes(tradeData.type)) {
      throw new BadRequestException('Trade type must be either "buy" or "sell"');
    }

    // Business rule validation
    if (tradeData.quantity > 1000000) {
      throw new BadRequestException('Quantity exceeds maximum limit of 1,000,000');
    }

    if (tradeData.price <= 0) {
      throw new BadRequestException('Price must be greater than 0');
    }

    // Check if portfolio exists
    const portfolio = await this.portfolioService.findOne(tradeData.portfolioId);
    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    // Check if asset exists
    const asset = await this.assetService.findOne(tradeData.assetId);
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    // Create trade
    return this.tradeRepository.create(tradeData);
  }

  async updateTrade(tradeId: string, updateData: UpdateTradeDto) {
    // Validate trade ID
    if (!testUtils.validation.isValidUUID(tradeId)) {
      throw new BadRequestException('Invalid trade ID format');
    }

    // Validate quantity if provided
    if (updateData.quantity !== undefined) {
      if (!testUtils.validation.isPositiveNumber(updateData.quantity)) {
        throw new BadRequestException('Quantity must be a positive number');
      }
    }

    // Validate price if provided
    if (updateData.price !== undefined) {
      if (!testUtils.validation.isPositiveNumber(updateData.price)) {
        throw new BadRequestException('Price must be a positive number');
      }
    }

    // Validate trade date if provided
    if (updateData.tradeDate !== undefined) {
      if (!testUtils.validation.isValidDate(updateData.tradeDate)) {
        throw new BadRequestException('Invalid trade date');
      }
    }

    // Check if trade exists
    const existingTrade = await this.tradeRepository.findOne(tradeId);
    if (!existingTrade) {
      throw new NotFoundException('Trade not found');
    }

    // Update trade
    return this.tradeRepository.update(tradeId, updateData);
  }

  async deleteTrade(tradeId: string) {
    // Validate trade ID
    if (!testUtils.validation.isValidUUID(tradeId)) {
      throw new BadRequestException('Invalid trade ID format');
    }

    // Check if trade exists
    const trade = await this.tradeRepository.findOne(tradeId);
    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    // Delete trade
    return this.tradeRepository.delete(tradeId);
  }
}

// Example 2: Trade Controller Validation
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Post()
  async create(@Body() createTradeDto: CreateTradeDto) {
    // Additional controller-level validation
    if (!createTradeDto.portfolioId) {
      throw new BadRequestException('Portfolio ID is required');
    }

    if (!createTradeDto.assetId) {
      throw new BadRequestException('Asset ID is required');
    }

    if (!createTradeDto.quantity) {
      throw new BadRequestException('Quantity is required');
    }

    if (!createTradeDto.price) {
      throw new BadRequestException('Price is required');
    }

    if (!createTradeDto.tradeDate) {
      throw new BadRequestException('Trade date is required');
    }

    if (!createTradeDto.type) {
      throw new BadRequestException('Trade type is required');
    }

    return this.tradeService.createTrade(createTradeDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    // Validate trade ID
    if (!testUtils.validation.isValidUUID(id)) {
      throw new BadRequestException('Invalid trade ID format');
    }

    return this.tradeService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTradeDto: UpdateTradeDto
  ) {
    // Validate trade ID
    if (!testUtils.validation.isValidUUID(id)) {
      throw new BadRequestException('Invalid trade ID format');
    }

    return this.tradeService.updateTrade(id, updateTradeDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    // Validate trade ID
    if (!testUtils.validation.isValidUUID(id)) {
      throw new BadRequestException('Invalid trade ID format');
    }

    return this.tradeService.deleteTrade(id);
  }

  @Get()
  async findAll(@Query('portfolioId') portfolioId?: string) {
    // Validate portfolio ID if provided
    if (portfolioId && !testUtils.validation.isValidUUID(portfolioId)) {
      throw new BadRequestException('Invalid portfolio ID format');
    }

    return this.tradeService.findAll(portfolioId);
  }
}

// Example 3: Trade DTO Validation
export class CreateTradeDto {
  @IsNotEmpty()
  @IsString()
  portfolioId: string;

  @IsNotEmpty()
  @IsString()
  assetId: string;

  @IsNotEmpty()
  @IsPositive()
  quantity: number;

  @IsNotEmpty()
  @IsPositive()
  price: number;

  @IsNotEmpty()
  @IsDateString()
  tradeDate: string;

  @IsNotEmpty()
  @IsIn(['buy', 'sell'])
  type: 'buy' | 'sell';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsPositive()
  fees?: number;

  @IsOptional()
  @IsPositive()
  tax?: number;

  // Custom validation using utils
  @ValidateIf((o) => o.portfolioId)
  @CustomValidation('portfolioId', (value) => testUtils.validation.isValidUUID(value))
  portfolioIdFormat: string;

  @ValidateIf((o) => o.assetId)
  @CustomValidation('assetId', (value) => testUtils.validation.isValidUUID(value))
  assetIdFormat: string;

  @ValidateIf((o) => o.tradeDate)
  @CustomValidation('tradeDate', (value) => testUtils.validation.isValidDate(new Date(value)))
  tradeDateFormat: string;
}

export class UpdateTradeDto {
  @IsOptional()
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsDateString()
  tradeDate?: string;

  @IsOptional()
  @IsIn(['buy', 'sell'])
  type?: 'buy' | 'sell';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsPositive()
  fees?: number;

  @IsOptional()
  @IsPositive()
  tax?: number;

  // Custom validation using utils
  @ValidateIf((o) => o.tradeDate)
  @CustomValidation('tradeDate', (value) => testUtils.validation.isValidDate(new Date(value)))
  tradeDateFormat: string;
}

// Example 4: Trade Form Validation (Frontend)
export const TradeForm = ({ formData, setFormData, onSubmit, errors, setErrors }) => {
  const validateForm = () => {
    const newErrors = {};

    // Validate portfolio ID
    if (!formData.portfolioId) {
      newErrors.portfolioId = 'Portfolio ID is required';
    } else if (!testUtils.validation.isValidUUID(formData.portfolioId)) {
      newErrors.portfolioId = 'Invalid portfolio ID format';
    }

    // Validate asset ID
    if (!formData.assetId) {
      newErrors.assetId = 'Asset ID is required';
    } else if (!testUtils.validation.isValidUUID(formData.assetId)) {
      newErrors.assetId = 'Invalid asset ID format';
    }

    // Validate quantity
    if (!formData.quantity) {
      newErrors.quantity = 'Quantity is required';
    } else if (!testUtils.validation.isPositiveNumber(formData.quantity)) {
      newErrors.quantity = 'Quantity must be a positive number';
    } else if (formData.quantity > 1000000) {
      newErrors.quantity = 'Quantity exceeds maximum limit of 1,000,000';
    }

    // Validate price
    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (!testUtils.validation.isPositiveNumber(formData.price)) {
      newErrors.price = 'Price must be a positive number';
    }

    // Validate trade date
    if (!formData.tradeDate) {
      newErrors.tradeDate = 'Trade date is required';
    } else if (!testUtils.validation.isValidDate(new Date(formData.tradeDate))) {
      newErrors.tradeDate = 'Invalid trade date';
    }

    // Validate trade type
    if (!formData.type) {
      newErrors.type = 'Trade type is required';
    } else if (!['buy', 'sell'].includes(formData.type)) {
      newErrors.type = 'Trade type must be either "buy" or "sell"';
    }

    // Validate fees if provided
    if (formData.fees !== undefined && formData.fees !== '') {
      if (!testUtils.validation.isPositiveNumber(formData.fees)) {
        newErrors.fees = 'Fees must be a positive number';
      }
    }

    // Validate tax if provided
    if (formData.tax !== undefined && formData.tax !== '') {
      if (!testUtils.validation.isPositiveNumber(formData.tax)) {
        newErrors.tax = 'Tax must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="trade-form">
      <div className="form-group">
        <label htmlFor="portfolioId">Portfolio ID</label>
        <input
          type="text"
          id="portfolioId"
          value={formData.portfolioId}
          onChange={(e) => setFormData({...formData, portfolioId: e.target.value})}
          placeholder="Enter portfolio ID"
        />
        {errors.portfolioId && <span className="error">{errors.portfolioId}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="assetId">Asset ID</label>
        <input
          type="text"
          id="assetId"
          value={formData.assetId}
          onChange={(e) => setFormData({...formData, assetId: e.target.value})}
          placeholder="Enter asset ID"
        />
        {errors.assetId && <span className="error">{errors.assetId}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="quantity">Quantity</label>
        <input
          type="number"
          id="quantity"
          value={formData.quantity}
          onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})}
          placeholder="Enter quantity"
        />
        {errors.quantity && <span className="error">{errors.quantity}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="price">Price</label>
        <input
          type="number"
          id="price"
          value={formData.price}
          onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
          placeholder="Enter price"
        />
        {errors.price && <span className="error">{errors.price}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="tradeDate">Trade Date</label>
        <input
          type="date"
          id="tradeDate"
          value={formData.tradeDate}
          onChange={(e) => setFormData({...formData, tradeDate: e.target.value})}
        />
        {errors.tradeDate && <span className="error">{errors.tradeDate}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="type">Trade Type</label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => setFormData({...formData, type: e.target.value})}
        >
          <option value="">Select trade type</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
        {errors.type && <span className="error">{errors.type}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="fees">Fees (Optional)</label>
        <input
          type="number"
          id="fees"
          value={formData.fees}
          onChange={(e) => setFormData({...formData, fees: parseFloat(e.target.value)})}
          placeholder="Enter fees"
        />
        {errors.fees && <span className="error">{errors.fees}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="tax">Tax (Optional)</label>
        <input
          type="number"
          id="tax"
          value={formData.tax}
          onChange={(e) => setFormData({...formData, tax: parseFloat(e.target.value)})}
          placeholder="Enter tax"
        />
        {errors.tax && <span className="error">{errors.tax}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes (Optional)</label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder="Enter notes"
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          Create Trade
        </button>
        <button type="button" className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
};

// Example 5: Trade List Component with Validation
export const TradeList = ({ trades, onEdit, onDelete }) => {
  const handleEdit = (tradeId) => {
    if (!testUtils.validation.isValidUUID(tradeId)) {
      console.error('Invalid trade ID format');
      return;
    }
    onEdit(tradeId);
  };

  const handleDelete = (tradeId) => {
    if (!testUtils.validation.isValidUUID(tradeId)) {
      console.error('Invalid trade ID format');
      return;
    }
    onDelete(tradeId);
  };

  return (
    <div className="trade-list">
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Type</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trades.map(trade => (
            <tr key={trade.id}>
              <td>{trade.symbol}</td>
              <td className={trade.type === 'buy' ? 'buy' : 'sell'}>
                {trade.type.toUpperCase()}
              </td>
              <td>{trade.quantity}</td>
              <td>{trade.price}</td>
              <td>{trade.total}</td>
              <td>{trade.tradeDate}</td>
              <td>
                <button onClick={() => handleEdit(trade.id)}>Edit</button>
                <button onClick={() => handleDelete(trade.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Example 6: Trade Search Component with Validation
export const TradeSearch = ({ onSearch }) => {
  const [searchParams, setSearchParams] = useState({
    portfolioId: '',
    assetId: '',
    startDate: '',
    endDate: '',
    type: ''
  });

  const [errors, setErrors] = useState({});

  const validateSearchParams = () => {
    const newErrors = {};

    // Validate portfolio ID if provided
    if (searchParams.portfolioId && !testUtils.validation.isValidUUID(searchParams.portfolioId)) {
      newErrors.portfolioId = 'Invalid portfolio ID format';
    }

    // Validate asset ID if provided
    if (searchParams.assetId && !testUtils.validation.isValidUUID(searchParams.assetId)) {
      newErrors.assetId = 'Invalid asset ID format';
    }

    // Validate start date if provided
    if (searchParams.startDate && !testUtils.validation.isValidDate(new Date(searchParams.startDate))) {
      newErrors.startDate = 'Invalid start date format';
    }

    // Validate end date if provided
    if (searchParams.endDate && !testUtils.validation.isValidDate(new Date(searchParams.endDate))) {
      newErrors.endDate = 'Invalid end date format';
    }

    // Validate date range
    if (searchParams.startDate && searchParams.endDate) {
      const startDate = new Date(searchParams.startDate);
      const endDate = new Date(searchParams.endDate);
      
      if (startDate > endDate) {
        newErrors.dateRange = 'Start date must be before end date';
      }
    }

    // Validate trade type if provided
    if (searchParams.type && !['buy', 'sell'].includes(searchParams.type)) {
      newErrors.type = 'Trade type must be either "buy" or "sell"';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (validateSearchParams()) {
      onSearch(searchParams);
    }
  };

  return (
    <form onSubmit={handleSearch} className="trade-search">
      <div className="search-fields">
        <div className="form-group">
          <label htmlFor="portfolioId">Portfolio ID</label>
          <input
            type="text"
            id="portfolioId"
            value={searchParams.portfolioId}
            onChange={(e) => setSearchParams({...searchParams, portfolioId: e.target.value})}
            placeholder="Enter portfolio ID"
          />
          {errors.portfolioId && <span className="error">{errors.portfolioId}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="assetId">Asset ID</label>
          <input
            type="text"
            id="assetId"
            value={searchParams.assetId}
            onChange={(e) => setSearchParams({...searchParams, assetId: e.target.value})}
            placeholder="Enter asset ID"
          />
          {errors.assetId && <span className="error">{errors.assetId}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="startDate">Start Date</label>
          <input
            type="date"
            id="startDate"
            value={searchParams.startDate}
            onChange={(e) => setSearchParams({...searchParams, startDate: e.target.value})}
          />
          {errors.startDate && <span className="error">{errors.startDate}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="endDate">End Date</label>
          <input
            type="date"
            id="endDate"
            value={searchParams.endDate}
            onChange={(e) => setSearchParams({...searchParams, endDate: e.target.value})}
          />
          {errors.endDate && <span className="error">{errors.endDate}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="type">Trade Type</label>
          <select
            id="type"
            value={searchParams.type}
            onChange={(e) => setSearchParams({...searchParams, type: e.target.value})}
          >
            <option value="">All Types</option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
          {errors.type && <span className="error">{errors.type}</span>}
        </div>
      </div>

      {errors.dateRange && <span className="error">{errors.dateRange}</span>}

      <div className="search-actions">
        <button type="submit" className="btn-primary">Search</button>
        <button type="button" className="btn-secondary" onClick={() => setSearchParams({
          portfolioId: '',
          assetId: '',
          startDate: '',
          endDate: '',
          type: ''
        })}>Clear</button>
      </div>
    </form>
  );
};

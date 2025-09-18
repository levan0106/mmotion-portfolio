import { Test, TestingModule } from '@nestjs/testing';
import { AssetValueCalculatorService, TaxFeeOption } from './asset-value-calculator.service';

describe('AssetValueCalculatorService', () => {
  let service: AssetValueCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetValueCalculatorService],
    }).compile();

    service = module.get<AssetValueCalculatorService>(AssetValueCalculatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateCurrentValue', () => {
    it('should calculate basic current value', () => {
      const result = service.calculateCurrentValue(100, 1000);
      expect(result).toBe(100000);
    });

    it('should handle zero values', () => {
      const result = service.calculateCurrentValue(0, 1000);
      expect(result).toBe(0);
    });

    it('should calculate with fixed tax and fee', () => {
      const options = {
        tax: { type: 'fixed', value: 1000 } as TaxFeeOption,
        fee: { type: 'fixed', value: 500 } as TaxFeeOption,
      };
      
      const result = service.calculateCurrentValue(100, 1000, options);
      expect(result).toBe(98500); // 100000 - 1000 - 500
    });

    it('should calculate with percentage tax and fee', () => {
      const options = {
        tax: { type: 'percentage', value: 10 } as TaxFeeOption, // 10%
        fee: { type: 'percentage', value: 5 } as TaxFeeOption,  // 5%
      };
      
      const result = service.calculateCurrentValue(100, 1000, options);
      expect(result).toBe(85000); // 100000 - 10000 - 5000
    });

    it('should handle mixed fixed and percentage options', () => {
      const options = {
        tax: { type: 'percentage', value: 5 } as TaxFeeOption,  // 5% = 5000
        fee: { type: 'fixed', value: 2000 } as TaxFeeOption,   // 2000
      };
      
      const result = service.calculateCurrentValue(100, 1000, options);
      expect(result).toBe(93000); // 100000 - 5000 - 2000
    });

    it('should handle legacy number format', () => {
      const options = {
        tax: 1000, // Legacy number format
        fee: 500,  // Legacy number format
      };
      
      const result = service.calculateCurrentValue(100, 1000, options);
      expect(result).toBe(98500); // 100000 - 1000 - 500
    });

    it('should ensure non-negative result', () => {
      const options = {
        tax: { type: 'fixed', value: 50000 } as TaxFeeOption,
        fee: { type: 'fixed', value: 60000 } as TaxFeeOption,
      };
      
      const result = service.calculateCurrentValue(100, 1000, options);
      expect(result).toBe(0); // Should not be negative
    });
  });

  describe('calculateCurrentValueWithBreakdown', () => {
    it('should provide detailed breakdown', () => {
      const options = {
        tax: { type: 'percentage', value: 10 } as TaxFeeOption,
        fee: { type: 'fixed', value: 1000 } as TaxFeeOption,
        commission: { type: 'percentage', value: 2 } as TaxFeeOption,
      };
      
      const result = service.calculateCurrentValueWithBreakdown(100, 1000, options);
      
      expect(result.baseValue).toBe(100000);
      expect(result.taxAmount).toBe(10000); // 10% of 100000
      expect(result.feeAmount).toBe(1000);  // Fixed 1000
      expect(result.commissionAmount).toBe(2000); // 2% of 100000
      expect(result.totalDeductions).toBe(13000);
      expect(result.finalValue).toBe(87000);
    });
  });

  describe('static helper methods', () => {
    it('should create percentage option', () => {
      const option = AssetValueCalculatorService.createPercentageOption(15);
      expect(option).toEqual({ type: 'percentage', value: 15 });
    });

    it('should create fixed option', () => {
      const option = AssetValueCalculatorService.createFixedOption(5000);
      expect(option).toEqual({ type: 'fixed', value: 5000 });
    });

    it('should create percentage options', () => {
      const options = AssetValueCalculatorService.createPercentageOptions(10, 5);
      expect(options.tax).toEqual({ type: 'percentage', value: 10 });
      expect(options.fee).toEqual({ type: 'percentage', value: 5 });
    });

    it('should create fixed options', () => {
      const options = AssetValueCalculatorService.createFixedOptions(1000, 500);
      expect(options.tax).toEqual({ type: 'fixed', value: 1000 });
      expect(options.fee).toEqual({ type: 'fixed', value: 500 });
    });
  });

  describe('calculateTotalCurrentValue', () => {
    it('should calculate total for multiple assets', () => {
      const assets = [
        { quantity: 100, currentPrice: 1000, tax: { type: 'fixed', value: 1000 } as TaxFeeOption },
        { quantity: 50, currentPrice: 2000, fee: { type: 'percentage', value: 5 } as TaxFeeOption },
      ];
      
      const result = service.calculateTotalCurrentValue(assets);
      // Asset 1: 100000 - 1000 = 99000
      // Asset 2: 100000 - 5000 = 95000
      // Total: 194000
      expect(result).toBe(194000);
    });
  });
});

import { AssetTypeTemplate } from '../types/financialFreedom.types';

/**
 * Predefined asset type templates for financial freedom planning
 * Users can select from this list to add to their plan
 */
export const ASSET_TYPE_TEMPLATES: AssetTypeTemplate[] = [
  {
    code: 'stock',
    name: 'Cổ phiếu',
    nameEn: 'Stocks',
    color: '#1976d2',
    defaultExpectedReturn: 12,
  },
  {
    code: 'bond',
    name: 'Trái phiếu',
    nameEn: 'Bonds',
    color: '#2e7d32',
    defaultExpectedReturn: 7.5,
  },
  {
    code: 'gold',
    name: 'Vàng',
    nameEn: 'Gold',
    color: '#ed6c02',
    defaultExpectedReturn: 8.5,
  },
  {
    code: 'realEstate',
    name: 'Bất động sản',
    nameEn: 'Real Estate',
    color: '#9c27b0',
    defaultExpectedReturn: 10,
  },
  {
    code: 'crypto',
    name: 'Tiền điện tử',
    nameEn: 'Cryptocurrency',
    color: '#f44336',
    defaultExpectedReturn: 20,
  },
  {
    code: 'commodity',
    name: 'Hàng hóa',
    nameEn: 'Commodities',
    color: '#ff9800',
    defaultExpectedReturn: 9,
  },
  {
    code: 'currency',
    name: 'Ngoại tệ',
    nameEn: 'Foreign Currency',
    color: '#00bcd4',
    defaultExpectedReturn: 5,
  },
  {
    code: 'cash',
    name: 'Tiền mặt/Tiền gửi',
    nameEn: 'Cash/Bank Deposit',
    color: '#757575',
    defaultExpectedReturn: 0,
  },
  {
    code: 'other',
    name: 'Khác',
    nameEn: 'Other',
    color: '#9e9e9e',
    defaultExpectedReturn: 8,
  },
];


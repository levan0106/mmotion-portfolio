/**
 * Asset type enumeration for portfolio management.
 * Defines the different types of financial assets that can be held in a portfolio.
 */
export enum AssetType {
  /** Stock securities */
  STOCK = 'STOCK',
  
  /** Bond securities */
  BOND = 'BOND',
  
  /** Gold and precious metals */
  GOLD = 'GOLD',

  /** Crypto currencies */
  CRYPTO = 'CRYPTO',
  
  /** Commodities */
  COMMODITY = 'COMMODITY',
  
  /** Real estate investments */
  REALESTATE = 'REALESTATE',
  
  /** Other asset types */
  OTHER = 'OTHER',
  
  /** Bank deposits and fixed income */
  //DEPOSIT = 'DEPOSIT',
  
  /** Cash and cash equivalents */
  //CASH = 'CASH'
}

/**
 * Asset type display labels for UI.
 */
export const AssetTypeLabels: Record<AssetType, string> = {
  [AssetType.STOCK]: 'Cổ phiếu',
  [AssetType.BOND]: 'Trái phiếu',
  [AssetType.GOLD]: 'Vàng',
  [AssetType.CRYPTO]: 'Tài sản số',
  [AssetType.COMMODITY]: 'Hàng hóa',
  [AssetType.REALESTATE]: 'Bất động sản',
  [AssetType.OTHER]: 'Khác',
  //[AssetType.DEPOSIT]: 'Tiền gửi',
  //[AssetType.CASH]: 'Tiền mặt'
};

/**
 * Asset type descriptions for UI.
 */
export const AssetTypeDescriptions: Record<AssetType, string> = {
  [AssetType.STOCK]: 'Cổ phiếu của các công ty niêm yết và quỹ hoán đổi danh mục',
  [AssetType.BOND]: 'Trái phiếu chính phủ và doanh nghiệp',
  [AssetType.GOLD]: 'Vàng và kim loại quý',
  [AssetType.CRYPTO]: 'Tài sản số',
  [AssetType.COMMODITY]: 'Hàng hóa và nguyên liệu thô',
  [AssetType.REALESTATE]: 'Bất động sản và các khoản đầu tư liên quan',
  [AssetType.OTHER]: 'Các loại tài sản khác không thuộc các danh mục trên',
  //[AssetType.DEPOSIT]: 'Tiền gửi ngân hàng và sản phẩm tiết kiệm',
  //[AssetType.CASH]: 'Tiền mặt và các khoản tương đương tiền'
};

-- Add IRR, Alpha, Beta columns to asset_performance_snapshots table
ALTER TABLE asset_performance_snapshots 
ADD COLUMN asset_irr_1m numeric(8,4) DEFAULT 0,
ADD COLUMN asset_irr_3m numeric(8,4) DEFAULT 0,
ADD COLUMN asset_irr_6m numeric(8,4) DEFAULT 0,
ADD COLUMN asset_irr_1y numeric(8,4) DEFAULT 0,
ADD COLUMN asset_irr_ytd numeric(8,4) DEFAULT 0,
ADD COLUMN asset_alpha_1m numeric(8,4) DEFAULT 0,
ADD COLUMN asset_alpha_3m numeric(8,4) DEFAULT 0,
ADD COLUMN asset_alpha_6m numeric(8,4) DEFAULT 0,
ADD COLUMN asset_alpha_1y numeric(8,4) DEFAULT 0,
ADD COLUMN asset_alpha_ytd numeric(8,4) DEFAULT 0,
ADD COLUMN asset_beta_1m numeric(8,4) DEFAULT 0,
ADD COLUMN asset_beta_3m numeric(8,4) DEFAULT 0,
ADD COLUMN asset_beta_6m numeric(8,4) DEFAULT 0,
ADD COLUMN asset_beta_1y numeric(8,4) DEFAULT 0,
ADD COLUMN asset_beta_ytd numeric(8,4) DEFAULT 0;

-- Add IRR, Alpha, Beta columns to asset_group_performance_snapshots table
ALTER TABLE asset_group_performance_snapshots 
ADD COLUMN group_irr_1m numeric(8,4) DEFAULT 0,
ADD COLUMN group_irr_3m numeric(8,4) DEFAULT 0,
ADD COLUMN group_irr_6m numeric(8,4) DEFAULT 0,
ADD COLUMN group_irr_1y numeric(8,4) DEFAULT 0,
ADD COLUMN group_irr_ytd numeric(8,4) DEFAULT 0,
ADD COLUMN group_alpha_1m numeric(8,4) DEFAULT 0,
ADD COLUMN group_alpha_3m numeric(8,4) DEFAULT 0,
ADD COLUMN group_alpha_6m numeric(8,4) DEFAULT 0,
ADD COLUMN group_alpha_1y numeric(8,4) DEFAULT 0,
ADD COLUMN group_alpha_ytd numeric(8,4) DEFAULT 0,
ADD COLUMN group_beta_1m numeric(8,4) DEFAULT 0,
ADD COLUMN group_beta_3m numeric(8,4) DEFAULT 0,
ADD COLUMN group_beta_6m numeric(8,4) DEFAULT 0,
ADD COLUMN group_beta_1y numeric(8,4) DEFAULT 0,
ADD COLUMN group_beta_ytd numeric(8,4) DEFAULT 0;

COMMIT;

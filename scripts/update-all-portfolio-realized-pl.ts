/**
 * Script to update realized P&L for all portfolios that have sell trades
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PortfolioService } from '../src/modules/portfolio/services/portfolio.service';

async function updateAllPortfolioRealizedPL() {
  console.log('🚀 Starting to update realized P&L for all portfolios...');
  
  try {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);
    const portfolioService = app.get(PortfolioService);

    // Get all portfolios by using a known account ID
    // In a real scenario, you would get all account IDs from a proper service
    const knownAccountId = '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5'; // From our test data
    
    const allPortfolios = await portfolioService.getPortfoliosByAccount(knownAccountId);

    console.log(`📊 Found ${allPortfolios.length} portfolios to check`);

    let updatedCount = 0;
    let totalRealizedPL = 0;

    for (const portfolio of allPortfolios) {
      try {
        console.log(`\n🔄 Processing portfolio: ${portfolio.name} (${portfolio.portfolioId})`);
        
        // Update realized P&L for this portfolio
        const realizedPL = await portfolioService.updatePortfolioRealizedPL(portfolio.portfolioId);
        
        if (realizedPL !== 0) {
          console.log(`✅ Updated realized P&L: ${realizedPL.toLocaleString()} ₫`);
          updatedCount++;
          totalRealizedPL += realizedPL;
        } else {
          console.log(`ℹ️  No sell trades found, realized P&L remains: 0 ₫`);
        }
      } catch (error) {
        console.error(`❌ Error updating portfolio ${portfolio.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Update completed!`);
    console.log(`📈 Portfolios with realized P&L: ${updatedCount}/${allPortfolios.length}`);
    console.log(`💰 Total realized P&L across all portfolios: ${totalRealizedPL.toLocaleString()} ₫`);

    // Close the application
    await app.close();
    console.log('✅ Application closed successfully');
    
  } catch (error) {
    console.error('❌ Error during update process:', error);
    process.exit(1);
  }
}

// Run the script
updateAllPortfolioRealizedPL()
  .then(() => {
    console.log('🏁 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

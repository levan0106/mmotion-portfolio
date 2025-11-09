import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../services/api';
import { InvestorReportData } from '../../types/investor-report.types';
import InvestorReport from './InvestorReport';

interface InvestorReportWrapperProps {
  portfolioId: string;
  accountId: string;
}

const InvestorReportWrapper: React.FC<InvestorReportWrapperProps> = ({ 
  portfolioId,
  accountId
}) => {
  const { t } = useTranslation();
  const [reportData, setReportData] = useState<InvestorReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!portfolioId || !accountId) return;
      
      setLoading(true);
      setError(null);
      try {
        // Fetch comprehensive data using apiService
        const comprehensiveData = await apiService.getInvestorReport(portfolioId, accountId);
        
        // Transform comprehensive data to match existing interface
        const transformedData: InvestorReportData = {
          portfolioId: comprehensiveData.portfolio.id,
          portfolioName: comprehensiveData.portfolio.name,
          totalValue: comprehensiveData.portfolio.totalValue,
          cashBalance: comprehensiveData.portfolio.cashBalance,
          assetValue: comprehensiveData.portfolio.assetValue,
          assetAllocation: comprehensiveData.assetAllocation,
          assetDetails: comprehensiveData.assetDetails,
          summary: {
            totalAssets: comprehensiveData.summary.totalAssets,
            totalCash: comprehensiveData.summary.totalCash,
            totalValue: comprehensiveData.summary.totalValue,
            cashPercentage: comprehensiveData.summary.cashPercentage,
            assetPercentage: comprehensiveData.summary.assetPercentage,
            depositsValue: comprehensiveData.portfolio.depositsValue,
            depositsPercentage: comprehensiveData.summary.depositsPercentage,
          },
          deposits: comprehensiveData.deposits,
          performance: comprehensiveData.performance,
          lastUpdated: comprehensiveData.portfolio.lastUpdated,
        };
        
        setReportData(transformedData);
      } catch (error) {
        console.error('Error fetching investor report:', error);
        setError(t('investorReport.error.loadFailed', 'Không thể tải báo cáo đầu tư. Vui lòng thử lại sau.'));
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [portfolioId, accountId, t]);

  return (
    <InvestorReport 
      data={reportData!}
      loading={loading}
      error={error}
    />
  );
};

export default InvestorReportWrapper;

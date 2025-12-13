/**
 * Step 4: Financial Planning Component
 */

import React from 'react';
import { Box, Button } from '@mui/material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common';
import { Step4FinancialPlanningProps } from '../../types/personalFinancialAnalysis.types';
import { useTranslation } from 'react-i18next';

export const Step4FinancialPlanning: React.FC<Step4FinancialPlanningProps> = ({
  analysis,
  onPlanCreate,
  onPlanLink,
  onPlanUnlink,
}) => {
  const { t } = useTranslation();

  return (
    <Box>
      <ResponsiveTypography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        {t('personalFinancialAnalysis.steps.step4.title')}
      </ResponsiveTypography>

      {analysis.linkedFinancialFreedomPlanId ? (
        <Box>
          <ResponsiveTypography variant="body1" sx={{ mb: 2 }}>
            {t('personalFinancialAnalysis.financialPlanning.planLinked')}
          </ResponsiveTypography>
          <ResponsiveButton variant="outlined" onClick={onPlanUnlink}>
            {t('personalFinancialAnalysis.financialPlanning.unlinkPlan')}
          </ResponsiveButton>
        </Box>
      ) : (
        <Box>
          <ResponsiveTypography variant="body1" sx={{ mb: 2 }}>
            {t('personalFinancialAnalysis.financialPlanning.noPlanLinked')}
          </ResponsiveTypography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <ResponsiveButton variant="contained" onClick={onPlanCreate}>
              {t('personalFinancialAnalysis.financialPlanning.createPlan')}
            </ResponsiveButton>
            <ResponsiveButton variant="outlined" onClick={() => {}}>
              {t('personalFinancialAnalysis.financialPlanning.linkExistingPlan')}
            </ResponsiveButton>
          </Box>
        </Box>
      )}

      {/* Financial Freedom Plan integration will be implemented in Task 21 */}
    </Box>
  );
};


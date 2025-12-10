import React from 'react';
import { Box, Divider, Stack, Grid } from '@mui/material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common';
import { ModalWrapper } from '../Common/ModalWrapper';
import { FinancialFreedomPlan } from '../../types/financialFreedom.types';
import { formatCurrency, formatPercentageValue } from '../../utils/format';
import { useTranslation } from 'react-i18next';
import { ASSET_TYPE_TEMPLATES } from '../../config/assetTypeTemplates';
import { ProgressChart } from './ProgressChart';

interface PlanDetailModalProps {
  open: boolean;
  plan: FinancialFreedomPlan | null;
  onClose: () => void;
  onEdit: (plan: FinancialFreedomPlan) => void;
}

export const PlanDetailModal: React.FC<PlanDetailModalProps> = ({
  open,
  plan,
  onClose,
  onEdit,
}) => {
  const { t, i18n } = useTranslation();

  if (!plan) {
    return null;
  }

  const handleEdit = () => {
    onClose();
    onEdit(plan);
  };

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={plan.name || t('financialFreedom.title')}
      maxWidth="lg"
      fullWidth
      actions={
        <>
          <ResponsiveButton variant="outlined" onClick={onClose}>
            {t('common.close')}
          </ResponsiveButton>
          <ResponsiveButton variant="contained" onClick={handleEdit}>
            {t('common.edit')}
          </ResponsiveButton>
        </>
      }
    >
      <Grid container spacing={3}>
        {/* Left Column: Investment Parameters Section */}
        <Grid item xs={12} md={6}>
          <Box>
            <ResponsiveTypography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
              {t('financialFreedom.form.investmentParameters.title')}
            </ResponsiveTypography>
            <Stack spacing={1}>
              {plan.initialInvestment !== undefined && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                    <ResponsiveTypography variant="body2" color="text.secondary">
                      {t('financialFreedom.form.investmentParameters.initialInvestment')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(plan.initialInvestment, plan.baseCurrency || 'VND')}
                    </ResponsiveTypography>
                  </Box>
                  <Divider />
                </>
              )}
              {plan.periodicPayment !== undefined && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                    <ResponsiveTypography variant="body2" color="text.secondary">
                      {t('financialFreedom.form.investmentParameters.periodicPayment')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(plan.periodicPayment, plan.baseCurrency || 'VND')}
                    </ResponsiveTypography>
                  </Box>
                  <Divider />
                </>
              )}
              {plan.requiredReturnRate !== undefined && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                    <ResponsiveTypography variant="body2" color="text.secondary">
                      {t('financialFreedom.step4.requiredReturnRate')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatPercentageValue(plan.requiredReturnRate)}
                    </ResponsiveTypography>
                  </Box>
                  <Divider />
                </>
              )}
              {plan.investmentYears !== undefined && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                    <ResponsiveTypography variant="body2" color="text.secondary">
                      {t('financialFreedom.step4.remainingYears')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="body1" sx={{ fontWeight: 500 }}>
                      {plan.investmentYears} {t('financialFreedom.scenario.years')}
                    </ResponsiveTypography>
                  </Box>
                  <Divider />
                </>
              )}
              {plan.inflationRate !== undefined && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                    <ResponsiveTypography variant="body2" color="text.secondary">
                      {t('financialFreedom.form.investmentParameters.inflationRate')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatPercentageValue(plan.inflationRate)}
                    </ResponsiveTypography>
                  </Box>
                  <Divider />
                </>
              )}
              {plan.riskTolerance && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                  <ResponsiveTypography variant="body2" color="text.secondary">
                    {t('financialFreedom.form.investmentParameters.riskTolerance')}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="body1" sx={{ fontWeight: 500 }}>
                    {t(`financialFreedom.form.investmentParameters.${plan.riskTolerance}`)}
                  </ResponsiveTypography>
                </Box>
              )}
            </Stack>
          </Box>
        </Grid>

        {/* Right Column: Target Amount and Allocation Section */}
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            {/* Target Amount Section */}
            <Box>
              <ResponsiveTypography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
                {t('financialFreedom.form.targetAmount.title')}
              </ResponsiveTypography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                  <ResponsiveTypography variant="body2" color="text.secondary">
                    {t('financialFreedom.form.targetAmount.targetAmountFV')}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatCurrency(plan.futureValueRequired, plan.baseCurrency || 'VND')}
                  </ResponsiveTypography>
                </Box>
                {plan.targetPresentValue && (
                  <>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                      <ResponsiveTypography variant="body2" color="text.secondary">
                        {t('financialFreedom.form.targetAmount.targetAmountRealFV')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="body1" sx={{ fontWeight: 500 }}>
                        {formatCurrency(plan.targetPresentValue, plan.baseCurrency || 'VND')}
                      </ResponsiveTypography>
                    </Box>
                  </>
                )}
              </Stack>
            </Box>

            {/* Allocation Section */}
            {plan.suggestedAllocation && (
              <>
                <Divider />
                <Box>
                  <ResponsiveTypography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
                    {t('financialFreedom.step2.allocation')}
                  </ResponsiveTypography>
              <Stack spacing={1}>
                {plan.suggestedAllocation && Array.isArray(plan.suggestedAllocation) && plan.suggestedAllocation.length > 0 ? (
                  // Dynamic allocation display - array format with code, allocation, expectedReturn
                  plan.suggestedAllocation
                    .filter(item => item.allocation >= 0) // Only show asset types with allocation > 0
                    .map((item, index) => {
                      // Find template for display name
                      const template = ASSET_TYPE_TEMPLATES.find(t => t.code === item.code);
                      const displayName = template 
                        ? (i18n.language === 'en' && template.nameEn ? template.nameEn : template.name)
                        : item.code; // Fallback to code if template not found
                      
                      // Try to get translation key
                      const translationKey = `financialFreedom.allocation.${item.code}`;
                      const translatedName = t(translationKey, { defaultValue: displayName });
                      
                      return (
                        <React.Fragment key={item.code}>
                          {index > 0 && <Divider />}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                            <ResponsiveTypography variant="body2" color="text.secondary">
                              {translatedName}
                            </ResponsiveTypography>
                            <ResponsiveTypography variant="body1" sx={{ fontWeight: 500 }}>
                              {formatPercentageValue(item.allocation)}
                            </ResponsiveTypography>
                          </Box>
                        </React.Fragment>
                      );
                    })
                ) : plan.suggestedAllocation && !Array.isArray(plan.suggestedAllocation) && Object.keys(plan.suggestedAllocation).length > 0 ? (
                  // Backward compatibility: handle old object format
                  Object.entries(plan.suggestedAllocation)
                    .filter(([_, value]) => (value as number) > 0)
                    .map(([code, value], index) => {
                      const template = ASSET_TYPE_TEMPLATES.find(t => t.code === code);
                      const displayName = template 
                        ? (i18n.language === 'en' && template.nameEn ? template.nameEn : template.name)
                        : code;
                      const translationKey = `financialFreedom.allocation.${code}`;
                      const translatedName = t(translationKey, { defaultValue: displayName });
                      
                      return (
                        <React.Fragment key={code}>
                          {index > 0 && <Divider />}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                            <ResponsiveTypography variant="body2" color="text.secondary">
                              {translatedName}
                            </ResponsiveTypography>
                            <ResponsiveTypography variant="body1" sx={{ fontWeight: 500 }}>
                              {formatPercentageValue(value as number)}
                            </ResponsiveTypography>
                          </Box>
                        </React.Fragment>
                      );
                    })
                ) : (
                  // Fallback: no allocation data
                  <ResponsiveTypography variant="body2" color="text.secondary">
                    {t('financialFreedom.planDetails.noAllocation')}
                  </ResponsiveTypography>
                )}
              </Stack>
                </Box>
              </>
            )}
          </Stack>
        </Grid>

        {/* Full Width: Yearly Projections Chart Section */}
        {plan.yearlyProjections && plan.yearlyProjections.length > 0 && (
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box>
              <ProgressChart
                projections={plan.yearlyProjections}
                targetValue={plan.futureValueRequired}
                title={t('financialFreedom.step3.yearlyProjections')}
                baseCurrency={plan.baseCurrency || 'VND'}
                height={350}
                showTarget={true}
              />
            </Box>
          </Grid>
        )}
      </Grid>
    </ModalWrapper>
  );
};


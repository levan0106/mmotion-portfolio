import React from 'react';
import { Box, Grid, Card, CardContent, useTheme } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { Scenarios } from '../../types/financialFreedom.types';
import { formatCurrency, formatNumber, formatPercentageValue } from '../../utils/format';
import { useTranslation } from 'react-i18next';

interface ScenarioComparisonProps {
  scenarios: Scenarios;
  baseCurrency?: string;
  recommended?: 'conservative' | 'moderate' | 'aggressive';
  title?: string;
  investmentYears?: number;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  scenarios,
  baseCurrency = 'VND',
  recommended = 'moderate',
  title,
  investmentYears,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const scenarioData = [
    {
      key: 'conservative',
      label: t('financialFreedom.scenario.conservative'),
      data: scenarios.conservative,
      color: theme.palette.info.main,
    },
    {
      key: 'moderate',
      label: t('financialFreedom.scenario.moderate'),
      data: scenarios.moderate,
      color: theme.palette.primary.main,
    },
    {
      key: 'aggressive',
      label: t('financialFreedom.scenario.aggressive'),
      data: scenarios.aggressive,
      color: theme.palette.warning.main,
    },
  ];

  return (
    <Box>
      {title && (
        <ResponsiveTypography variant="h6" sx={{ mb: 2 }}>
          {title}
        </ResponsiveTypography>
      )}
      <Grid container spacing={2}>
        {scenarioData.map((scenario) => {
          const isRecommended = scenario.key === recommended;
          return (
            <Grid item xs={12} md={4} key={scenario.key}>
              <Card
                sx={{
                  height: '100%',
                  border: isRecommended ? `2px solid ${scenario.color}` : '1px solid',
                  borderColor: isRecommended ? scenario.color : theme.palette.divider,
                  position: 'relative',
                  boxShadow: isRecommended ? 4 : 1,
                }}
              >
                {isRecommended && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      bgcolor: scenario.color,
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 16 }} />
                    <ResponsiveTypography variant="caption" sx={{ fontWeight: 600 }}>
                      {t('financialFreedom.scenario.recommended')}
                    </ResponsiveTypography>
                  </Box>
                )}
                <CardContent>
                  <ResponsiveTypography
                    variant="h6"
                    sx={{
                      mb: 2,
                      color: scenario.color,
                      fontWeight: 600,
                    }}
                  >
                    {scenario.label}
                  </ResponsiveTypography>

                  {scenario.data.returnRate !== undefined && (
                    <Box sx={{ mb: 2 }}>
                      <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {t('financialFreedom.scenario.returnRate')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="h6" sx={{ fontWeight: 600, color: scenario.color }}>
                        {formatPercentageValue(scenario.data.returnRate)}
                      </ResponsiveTypography>
                    </Box>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {t('financialFreedom.scenario.finalValue')}
                      {investmentYears !== undefined && (
                        <ResponsiveTypography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                          ({t('financialFreedom.scenario.afterYears', { years: formatNumber(investmentYears, 2) })})
                        </ResponsiveTypography>
                      )}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatCurrency(scenario.data.finalValue, baseCurrency)}
                    </ResponsiveTypography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {t('financialFreedom.scenario.yearsToGoal')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatNumber(scenario.data.yearsToGoal, 2)} {t('financialFreedom.scenario.years')}
                    </ResponsiveTypography>
                  </Box>

                  <Box>
                    <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {t('financialFreedom.scenario.progress')}
                    </ResponsiveTypography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          flex: 1,
                          height: 8,
                          bgcolor: theme.palette.grey[200],
                          borderRadius: 1,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            width: `${scenario.data.progressPercentage}%`,
                            height: '100%',
                            bgcolor: scenario.color,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </Box>
                      <ResponsiveTypography variant="body2" sx={{ fontWeight: 600, minWidth: 50 }}>
                        {formatPercentageValue(scenario.data.progressPercentage)}
                      </ResponsiveTypography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};


/**
 * Personal Financial Analysis Wizard Page (with Tabs)
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  useTheme,
  TextField,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { ResponsiveTypography } from '../components/Common/ResponsiveTypography';
import { ResponsiveButton } from '../components/Common';
import { PersonalFinancialAnalysis, AnalysisStatus } from '../types/personalFinancialAnalysis.types';
import { useTranslation } from 'react-i18next';
import { useCreateAnalysis, useUpdateAnalysis, useAnalysis } from '../hooks/usePersonalFinancialAnalysis';
import { Step1CashFlowSurvey } from '../components/PersonalFinancialAnalysis/Step1CashFlowSurvey';
import { Step2FinancialAnalysis } from '../components/PersonalFinancialAnalysis/Step2FinancialAnalysis';
import { Step3AssetRestructuring } from '../components/PersonalFinancialAnalysis/Step3AssetRestructuring';
import { Step4FinancialPlanning } from '../components/PersonalFinancialAnalysis/Step4FinancialPlanning';
import { useSummaryMetrics, useIncomeExpenseBreakdown } from '../hooks/useAnalysisCalculations';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
    >
      {value === index && (
        <Box 
          sx={{ 
            py: 3, 
            px: { xs: 2, sm: 3, md: 4 },
            backgroundColor: 'background.paper',
            minHeight: '100%',
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
};

const PersonalFinancialAnalysisWizardPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [activeTab, setActiveTab] = useState(0);
  const createAnalysisMutation = useCreateAnalysis();
  const updateAnalysisMutation = useUpdateAnalysis();
  const { data: existingAnalysis, isLoading: isLoadingAnalysis } = useAnalysis(id);
  
  // Initialize analysis data
  const [analysisData, setAnalysisData] = useState<Partial<PersonalFinancialAnalysis>>({
    assets: [],
    income: [],
    expenses: [],
    debts: [],
      linkedPortfolioIds: [],
      scenarios: [],
      status: AnalysisStatus.DRAFT,
  });

  // Calculate currentAnalysis - must be done before hooks
  const currentAnalysis = (analysisData.id ? { ...analysisData, id: analysisData.id } : existingAnalysis) as PersonalFinancialAnalysis | undefined;

  // Calculate metrics - must be called unconditionally (Rules of Hooks)
  const summaryMetrics = useSummaryMetrics(currentAnalysis);
  const incomeExpenseBreakdown = useIncomeExpenseBreakdown(currentAnalysis);

  // Update analysisData when existingAnalysis changes
  useEffect(() => {
    if (existingAnalysis) {
      setAnalysisData(existingAnalysis);
    }
  }, [existingAnalysis]);

  // Create new analysis on mount if no ID
  useEffect(() => {
    if (!id && !createAnalysisMutation.isLoading && !existingAnalysis) {
      const createNew = async () => {
        try {
          const newAnalysis = await createAnalysisMutation.mutateAsync({
            name: undefined,
            assets: [],
            income: [],
            expenses: [],
            debts: [],
          });
          // Navigate to the new analysis ID
          navigate(`/personal-financial-analysis/${newAnalysis.id}`, { replace: true });
        } catch (error) {
          console.error('Error creating analysis:', error);
        }
      };
      createNew();
    }
  }, [id, createAnalysisMutation, existingAnalysis, navigate]);

  const tabs = [
    { label: t('personalFinancialAnalysis.steps.step1.title'), key: 'step1' },
    { label: t('personalFinancialAnalysis.steps.step2.title'), key: 'step2' },
    { label: t('personalFinancialAnalysis.steps.step3.title'), key: 'step3' },
    { label: t('personalFinancialAnalysis.steps.step4.title'), key: 'step4' },
  ];

  const handleTabChange = async (_event: React.SyntheticEvent, newValue: number) => {
    // Auto-save on tab change
    if (id && analysisData.id) {
      try {
        await updateAnalysisMutation.mutateAsync({
          id: analysisData.id,
          data: {
            assets: analysisData.assets,
            income: analysisData.income,
            expenses: analysisData.expenses,
            debts: analysisData.debts,
          },
        });
      } catch (error) {
        console.error('Error auto-saving:', error);
      }
    }
    setActiveTab(newValue);
  };

  const handleDataUpdate = async (updates: Partial<PersonalFinancialAnalysis>) => {
    setAnalysisData((prev) => ({
      ...prev,
      ...updates,
    }));
    // Auto-save updates
    if (id && analysisData.id) {
      try {
        await updateAnalysisMutation.mutateAsync({
          id: analysisData.id,
          data: updates,
        });
      } catch (error) {
        console.error('Error auto-saving updates:', error);
      }
    }
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newName = event.target.value;
    setAnalysisData((prev) => ({ ...prev, name: newName }));
    // Auto-save name change
    if (id && analysisData.id) {
      updateAnalysisMutation.mutate({
        id: analysisData.id,
        data: { name: newName },
      });
    }
  };

  const handleSave = async () => {
    if (!id && !analysisData.id) return;
    
    try {
      const analysisId = id || analysisData.id;
      if (analysisId) {
        await updateAnalysisMutation.mutateAsync({
          id: analysisId,
          data: {
            ...analysisData,
            status: AnalysisStatus.FINAL,
          },
        });
        navigate('/personal-financial-analysis');
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
      throw error;
    }
  };

  const handleBack = () => {
    navigate('/personal-financial-analysis');
  };

  if (isLoadingAnalysis || createAnalysisMutation.isLoading) {
    return (
      <Box>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <ResponsiveTypography sx={{ mt: 2 }}>Loading...</ResponsiveTypography>
        </Box>
      </Box>
    );
  }

  if (!currentAnalysis && !id) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>{t('personalFinancialAnalysis.creating')}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 2, px: { xs: 0, sm: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={handleBack} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flex: 1, maxWidth: { xs: '100%', sm: '500px' } }}>
              <TextField
                fullWidth
                variant="standard"
                placeholder={id ? t('personalFinancialAnalysis.edit') : t('personalFinancialAnalysis.create')}
                value={currentAnalysis?.name || ''}
                onChange={handleNameChange}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' },
                    fontWeight: 600,
                    color: 'text.primary',
                    py: 0.5,
                  },
                  '& .MuiInput-underline:before': {
                    borderBottom: 'none',
                  },
                  '& .MuiInput-underline:hover:before': {
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  },
                  '& .MuiInput-underline:after': {
                    borderBottom: '2px solid',
                    borderColor: 'primary.main',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    opacity: 0.5,
                    color: 'text.secondary',
                  },
                }}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ResponsiveButton 
              variant="contained" 
              onClick={handleSave} 
              disabled={updateAnalysisMutation.isLoading}
              sx={{ borderRadius: 2 }}
            >
              {updateAnalysisMutation.isLoading ? t('common.saving') : t('common.save')}
            </ResponsiveButton>
          </Box>
        </Box>
      </Box>

      {/* Tabs - Sticky */}
      <Box 
        sx={{ 
          position: 'sticky', 
          top: { xs: -8, sm: -16, md: -20 }, // Negative margin to account for AppLayout padding
          zIndex: 1000, 
          mb: 0,
          backgroundColor: 'background.paper',
          mx: { xs: 0, sm: 4 },
          py: 1,
          px: { xs: 1, sm: 2, md: 2.5 }, // Match AppLayout padding
        }}
      >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 0,
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={tab.key}
                label={tab.label}
                id={`analysis-tab-${index}`}
                aria-controls={`analysis-tabpanel-${index}`}
              />
            ))}
          </Tabs>
      </Box>

      {/* Tab Panels */}
      <Box sx={{ px: { xs: 0, sm: 4 } }}>
        <Paper 
          elevation={0}
          sx={{ 
            backgroundColor: 'background.paper',
            borderRadius: 0,
            overflow: 'hidden',
          }}
        >
          <TabPanel value={activeTab} index={0}>
          {currentAnalysis && (
            <Step1CashFlowSurvey
              analysis={currentAnalysis}
              onUpdate={handleDataUpdate}
              onPortfolioLink={async (portfolioId: string) => {
                // Portfolio linking is handled in Step1CashFlowSurvey component
                // This callback can be used for additional actions if needed
              }}
              onPortfolioUnlink={async (portfolioId: string) => {
                // Portfolio unlinking is handled in Step1CashFlowSurvey component
                // This callback can be used for additional actions if needed
              }}
            />
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {currentAnalysis && summaryMetrics && incomeExpenseBreakdown && (
            <Step2FinancialAnalysis
              analysis={currentAnalysis}
              summaryMetrics={summaryMetrics}
              incomeExpenseBreakdown={incomeExpenseBreakdown}
              onUpdate={handleDataUpdate}
            />
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {currentAnalysis && (
            <Step3AssetRestructuring
              analysis={currentAnalysis}
              onScenarioCreate={async (scenario) => {
                if (currentAnalysis.id) {
                  try {
                    await updateAnalysisMutation.mutateAsync({
                      id: currentAnalysis.id,
                      data: {
                        scenarios: [...(currentAnalysis.scenarios || []), {
                          id: crypto.randomUUID(),
                          name: scenario.name,
                          description: scenario.description,
                          assets: scenario.assets || [],
                          income: scenario.income || [],
                          expenses: scenario.expenses || [],
                          debts: scenario.debts || [],
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        }],
                      },
                    });
                  } catch (error) {
                    console.error('Error creating scenario:', error);
                  }
                }
              }}
              onScenarioUpdate={async (scenarioId, updates) => {
                if (currentAnalysis.id) {
                  try {
                    const updatedScenarios = (currentAnalysis.scenarios || []).map((s) =>
                      s.id === scenarioId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
                    );
                    await updateAnalysisMutation.mutateAsync({
                      id: currentAnalysis.id,
                      data: { scenarios: updatedScenarios },
                    });
                  } catch (error) {
                    console.error('Error updating scenario:', error);
                  }
                }
              }}
              onScenarioDelete={async (scenarioId) => {
                if (currentAnalysis.id) {
                  try {
                    const updatedScenarios = (currentAnalysis.scenarios || []).filter((s) => s.id !== scenarioId);
                    await updateAnalysisMutation.mutateAsync({
                      id: currentAnalysis.id,
                      data: { scenarios: updatedScenarios },
                    });
                  } catch (error) {
                    console.error('Error deleting scenario:', error);
                  }
                }
              }}
              onScenarioSelect={(scenarioId) => {
                // Scenario selection is handled internally in Step3 component
              }}
              onDataUpdate={handleDataUpdate}
            />
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          {currentAnalysis && (
            <Step4FinancialPlanning
              analysis={currentAnalysis}
              onPlanCreate={() => {}}
              onPlanLink={async () => {}}
              onPlanUnlink={async () => {}}
            />
          )}
          </TabPanel>
        </Paper>
      </Box>
    </Box>
  );
};

export default PersonalFinancialAnalysisWizardPage;


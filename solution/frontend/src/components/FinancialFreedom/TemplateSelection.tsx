import React from 'react';
import { Box, Grid, Button, CircularProgress } from '@mui/material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { TemplateCard } from './TemplateCard';
import { usePlanningTemplates } from '../../hooks/usePlanningTemplates';
import { PlanningTemplate } from '../../types/financialFreedom.types';
import { useTranslation } from 'react-i18next';

interface TemplateSelectionProps {
  onSelectTemplate: (template: PlanningTemplate) => void;
  onSkip: () => void;
}

export const TemplateSelection: React.FC<TemplateSelectionProps> = ({
  onSelectTemplate,
  onSkip,
}) => {
  const { t } = useTranslation();
  const { data: templates, isLoading } = usePlanningTemplates();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* <ResponsiveTypography variant="h4" sx={{ mb: 2 }}>
        {t('financialFreedom.templates.title')}
      </ResponsiveTypography> */}

      <ResponsiveTypography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
        {t('financialFreedom.templates.subtitle')}
      </ResponsiveTypography>

      <Box onClick={(e) => e.stopPropagation()}>
        <Grid container spacing={3}>
          {templates?.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <TemplateCard
                template={template}
                onClick={() => onSelectTemplate(template)}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ mt: 4, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <Button 
          variant="outlined" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSkip();
          }} 
          size="large"
        >
          {t('financialFreedom.templates.skip')}
        </Button>
      </Box>
    </Box>
  );
};


import React from 'react';
import {
  Card,
  CardContent,
  Chip,
  Box,
  useTheme,
} from '@mui/material';
import {
  Savings as SavingsIcon,
  Elderly as RetirementIcon,
  Whatshot as WhatshotIcon,
  Home as HomeIcon,
  School as SchoolIcon,
  LocalHospital as EmergencyIcon,
  ChildCare as ChildCareIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { PlanningTemplate } from '../../types/financialFreedom.types';
import { useTranslation } from 'react-i18next';

interface TemplateCardProps {
  template: PlanningTemplate;
  onClick: () => void;
}

const getIcon = (iconName: string) => {
  const icons: Record<string, React.ReactNode> = {
    savings: <SavingsIcon />,
    retirement: <RetirementIcon />,
    fire: <WhatshotIcon />,
    home: <HomeIcon />,
    school: <SchoolIcon />,
    emergency: <EmergencyIcon />,
    child: <ChildCareIcon />,
  };
  return icons[iconName] || <AccountBalanceIcon />;
};

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isVietnamese = i18n.language === 'vi';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)',
        },
      }}
      onClick={handleClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              bgcolor: theme.palette.primary.light,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              color: theme.palette.primary.main,
            }}
          >
            {getIcon(template.icon)}
          </Box>
          <Box sx={{ flex: 1 }}>
            <ResponsiveTypography variant="h6">
              {isVietnamese ? template.name : template.nameEn}
            </ResponsiveTypography>
            <Chip
              label={t(`financialFreedom.templates.categories.${template.category}`)}
              size="small"
              sx={{ mt: 0.5 }}
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>

        <ResponsiveTypography variant="caption" color="text.secondary" sx={{ mb: 2 }}  ellipsis={false}>
          {isVietnamese ? template.description : template.descriptionEn}
        </ResponsiveTypography>

        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ResponsiveTypography variant="caption" color="text.secondary">
            {t('financialFreedom.templates.willCalculate')}:
          </ResponsiveTypography>
          <Chip
            label={t(`financialFreedom.calculatedVariables.${template.calculateVariable}`)}
            size="small"
            color="secondary"
          />
        </Box>
      </CardContent>
    </Card>
  );
};


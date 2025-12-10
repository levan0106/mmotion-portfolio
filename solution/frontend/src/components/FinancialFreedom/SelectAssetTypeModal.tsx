import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Button,
} from '@mui/material';
import { ModalWrapper } from '../Common/ModalWrapper';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ASSET_TYPE_TEMPLATES } from '../../config/assetTypeTemplates';
import { AssetTypeMetadata, AssetTypeTemplate } from '../../types/financialFreedom.types';
import { useTranslation } from 'react-i18next';

interface SelectAssetTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: AssetTypeTemplate) => void;
  existingAssetTypes: AssetTypeMetadata[];
}

export const SelectAssetTypeModal: React.FC<SelectAssetTypeModalProps> = ({
  open,
  onClose,
  onSelect,
  existingAssetTypes,
}) => {
  const { t, i18n } = useTranslation();
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>('');

  const availableTemplates = ASSET_TYPE_TEMPLATES.filter(
    template => !existingAssetTypes.some(at => at.code === template.code)
  );

  const handleSelect = () => {
    if (!selectedTemplateCode) return;
    
    const template = ASSET_TYPE_TEMPLATES.find(t => t.code === selectedTemplateCode);
    if (template) {
      onSelect(template);
      setSelectedTemplateCode('');
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedTemplateCode('');
    onClose();
  };

  const actions = (
    <>
      <Button onClick={handleClose}>
        {t('common.cancel')}
      </Button>
      <Button 
        onClick={handleSelect} 
        variant="contained" 
        disabled={!selectedTemplateCode}
      >
        {t('common.add')}
      </Button>
    </>
  );

  return (
    <ModalWrapper
      open={open}
      onClose={handleClose}
      title={t('financialFreedom.step2.addAssetType')}
      actions={actions}
      maxWidth="sm"
    >
      <Box>
        <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('financialFreedom.step2.selectAssetType')}
        </ResponsiveTypography>
        <List>
          {availableTemplates.map((template) => (
            <React.Fragment key={template.code}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedTemplateCode === template.code}
                  onClick={() => setSelectedTemplateCode(template.code)}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: template.color,
                      border: '1px solid',
                      borderColor: 'divider',
                      mr: 2,
                    }}
                  />
                  <ListItemText
                    primary={i18n.language === 'en' ? template.nameEn : template.name}
                    secondary={t('financialFreedom.step2.defaultExpectedReturn') + ': ' + template.defaultExpectedReturn + '%'}
                  />
                </ListItemButton>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
          {availableTemplates.length === 0 && (
            <ListItem>
              <ListItemText
                primary={t('financialFreedom.step2.allAssetTypesAdded')}
                primaryTypographyProps={{ color: 'text.secondary', fontStyle: 'italic' }}
              />
            </ListItem>
          )}
        </List>
      </Box>
    </ModalWrapper>
  );
};


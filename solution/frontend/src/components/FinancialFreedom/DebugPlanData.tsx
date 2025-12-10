import React, { useState } from 'react';
import { Box, Paper, Collapse, IconButton, Typography, Divider } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { PlanData } from '../../types/financialFreedom.types';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';

interface DebugPlanDataProps {
  data: PlanData;
  currentStep?: 1 | 2 | 3;
}

export const DebugPlanData: React.FC<DebugPlanDataProps> = ({ data, currentStep }) => {
  const [expanded, setExpanded] = useState(false);

  const hasAnyData = data.step1 || data.step2 || data.step3;

  if (!hasAnyData) {
    return null;
  }

  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.100', border: '1px solid', borderColor: 'grey.300' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <ResponsiveTypography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          🔍 Debug: Plan Data {currentStep && `(Current: Step ${currentStep})`}
        </ResponsiveTypography>
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mt: 2 }}>
          {/* Step 1 Data */}
          {data.step1 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
                Step 1: Goal Definition
              </Typography>
              
              <Box component="pre" sx={{ 
                fontSize: '0.75rem', 
                bgcolor: 'background.paper', 
                p: 1.5, 
                borderRadius: 1, 
                overflow: 'auto',
                maxHeight: 400,
                fontFamily: 'monospace'
              }}>
                {JSON.stringify(data.step1, null, 2)}
              </Box>
            </Box>
          )}

          {/* Step 2 Data */}
          {data.step2 && (
            <>
              {data.step1 && <Divider sx={{ my: 2 }} />}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
                  Step 2: Allocation Suggestions
                </Typography>
              
                <Box component="pre" sx={{ 
                  fontSize: '0.75rem', 
                  bgcolor: 'background.paper', 
                  p: 1.5, 
                  borderRadius: 1, 
                  overflow: 'auto',
                  maxHeight: 400,
                  fontFamily: 'monospace'
                }}>
                  {JSON.stringify(data.step2, null, 2)}
                </Box>
              </Box>
            </>
          )}

          {/* Step 3 Data */}
          {data.step3 && (
            <>
              {(data.step1 || data.step2) && <Divider sx={{ my: 2 }} />}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
                  Step 3: Consolidated Overview
                </Typography>
              
                <Box component="pre" sx={{ 
                  fontSize: '0.75rem', 
                  bgcolor: 'background.paper', 
                  p: 1.5, 
                  borderRadius: 1, 
                  overflow: 'auto',
                  maxHeight: 400,
                  fontFamily: 'monospace'
                }}>
                  {JSON.stringify(data.step3, null, 2)}
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};


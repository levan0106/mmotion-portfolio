import React, { useEffect } from 'react';
import {
  Card,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Error as AlertCircle,
  CheckCircle,
  AccessTime as Clock,
  ExpandMore,
  Sync as SyncIcon,
} from '@mui/icons-material';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import ModalWrapper from '../Common/ModalWrapper';
import { GlobalAssetTracking, ApiCallDetail } from '../../services/api.global-asset-tracking';

interface GlobalAssetTrackingDetailsModalProps {
  open: boolean;
  onClose: () => void;
  selectedRecord: GlobalAssetTracking | null;
  apiCallDetails: ApiCallDetail[];
  loadingApiCalls: boolean;
  onFetchApiCallDetails: (executionId: string) => void;
}

export default function GlobalAssetTrackingDetailsModal({
  open,
  onClose,
  selectedRecord,
  apiCallDetails,
  loadingApiCalls,
  onFetchApiCallDetails,
}: GlobalAssetTrackingDetailsModalProps) {
  useEffect(() => {
    if (open && selectedRecord) {
      onFetchApiCallDetails(selectedRecord.executionId);
    }
  }, [open, selectedRecord?.executionId, onFetchApiCallDetails]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle color="success" fontSize="small" />;
      case 'failed':
        return <AlertCircle color="error" fontSize="small" />;
      case 'running':
        return <Clock color="warning" fontSize="small" />;
      default:
        return <Clock color="disabled" fontSize="small" />;
    }
  };


  const getApiCallStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <CheckCircle color="success" fontSize="small" />;
      case 'error':
        return <AlertCircle color="error" fontSize="small" />;
      case 'timeout':
        return <Clock color="warning" fontSize="small" />;
      default:
        return <Clock color="disabled" fontSize="small" />;
    }
  };

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title="Auto Sync Details"
      icon={<SyncIcon />}
      maxWidth="xl"
      fullWidth
      size="large"
    >
      <Box sx={{ p: 0 }}>
        {selectedRecord && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Chip 
              label={selectedRecord.executionId} 
              variant="outlined" 
              size="small"
              sx={{ fontFamily: 'monospace' }}
            />
          </Box>
        )}
        {selectedRecord && (
          <Box>
            {/* Header Cards - Combined Layout */}
            <Box sx={{ p: 2, backgroundColor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6} md={2}>
                  <Card variant="outlined" sx={{ p: 1, height: '100%' }}>
                    <ResponsiveTypography variant="subtitle2" color="text.secondary" gutterBottom>
                      Status
                    </ResponsiveTypography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {getStatusIcon(selectedRecord.successRate === 100 ? 'completed' : 'failed')}
                      <ResponsiveTypography variant="body2" fontWeight="bold">
                        {selectedRecord.successRate === 100 ? 'COMPLETED' : 'FAILED'}
                      </ResponsiveTypography>
                    </Box>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <Card variant="outlined" sx={{ p: 1, height: '100%' }}>
                    <ResponsiveTypography variant="subtitle2" color="text.secondary" gutterBottom>
                      Type & Source
                    </ResponsiveTypography>
                    <Box display="flex" gap={0.3} flexWrap="wrap">
                      <Chip 
                        label={selectedRecord.type.toUpperCase()} 
                        variant="outlined" 
                        size="small" 
                        sx={{ fontSize: '0.6rem', height: '18px' }}
                      />
                      <Chip 
                        label={selectedRecord.source.replace('_', ' ').toUpperCase()} 
                        variant="outlined" 
                        size="small" 
                        sx={{ fontSize: '0.6rem', height: '18px' }}
                      />
                    </Box>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <Card variant="outlined" sx={{ p: 1, height: '100%' }}>
                    <ResponsiveTypography variant="subtitle2" color="text.secondary" gutterBottom>
                      Duration & Success Rate
                    </ResponsiveTypography>
                    <Box justifyContent="space-between" alignItems="center">
                      <ResponsiveTypography variant="body2" color="primary" fontWeight="bold">
                        {formatDuration(selectedRecord.executionTimeMs)}
                      </ResponsiveTypography>
                      <ResponsiveTypography 
                        variant="body2" 
                        fontWeight="bold"
                        color={selectedRecord.successRate === 100 ? 'success.main' : 'error.main'}
                      >
                        {selectedRecord.successRate ? selectedRecord.successRate.toFixed(1) : '0.0'}%
                      </ResponsiveTypography>
                    </Box>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <Card variant="outlined" sx={{ p: 1, height: '100%' }}>
                    <ResponsiveTypography variant="subtitle2" color="text.secondary" gutterBottom>
                      Started & Completed
                    </ResponsiveTypography>
                    <Box>
                      <ResponsiveTypography variant="body2" sx={{ mb: 0.3 }}>
                        {formatDateTime(selectedRecord.startedAt)}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="body2">
                        {selectedRecord.completedAt ? formatDateTime(selectedRecord.completedAt) : 'N/A'}
                      </ResponsiveTypography>
                    </Box>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <Card variant="outlined" sx={{ p: 1, height: '100%' }}>
                    <ResponsiveTypography variant="subtitle2" color="text.secondary" gutterBottom>
                      Symbols Processed
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="body2" color="primary" fontWeight="bold">
                      {selectedRecord.totalSymbols}
                    </ResponsiveTypography>
                    <Box display="flex" gap={0.3} mt={0.2}>
                      <ResponsiveTypography variant="caption" color="success.main">
                        ✓ {selectedRecord.successfulUpdates}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="caption" color="error.main">
                        ✗ {selectedRecord.failedUpdates}
                      </ResponsiveTypography>
                    </Box>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <Card variant="outlined" sx={{ p: 1, height: '100%' }}>
                    <ResponsiveTypography variant="subtitle2" color="text.secondary" gutterBottom>
                      APIs Used
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="body2" color="primary" fontWeight="bold">
                      {selectedRecord.totalApis}
                    </ResponsiveTypography>
                    <Box display="flex" gap={0.3} mt={0.2}>
                      <ResponsiveTypography variant="caption" color="success.main">
                        ✓ {selectedRecord.successfulApis}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="caption" color="error.main">
                        ✗ {selectedRecord.failedApis}
                      </ResponsiveTypography>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {/* Main Content - Ultra Compact Layout */}
            <Box sx={{ p: 1.5 }}>

              {/* Failed Symbols & Errors - Single Row Layout */}
              <Box sx={{ mb: 1.5 }}>
                <Grid container spacing={1}>
                  {/* Failed Symbols */}
                  {selectedRecord.failedSymbols && selectedRecord.failedSymbols.length > 0 && (
                    <Grid item xs={12} sm={6} md={6}>
                      <Card variant="outlined" sx={{ p: 1, borderColor: 'error.main', height: '100%' }}>
                        <ResponsiveTypography variant="subtitle2" color="error" gutterBottom>
                          Failed Symbols ({selectedRecord.failedSymbols.length})
                        </ResponsiveTypography>
                        <Box display="flex" gap={0.3} flexWrap="wrap" sx={{ maxHeight: '60px', overflow: 'auto' }}>
                          {selectedRecord.failedSymbols.map((symbol, index) => (
                            <Chip
                              key={index}
                              label={symbol}
                              color="error"
                              variant="outlined"
                              size="small"
                              sx={{ fontSize: '0.65rem', height: '18px' }}
                            />
                          ))}
                        </Box>
                      </Card>
                    </Grid>
                  )}

                  {/* Error Information */}
                  {selectedRecord.errorMessage && (
                    <Grid item xs={12} sm={6} md={6}>
                      <Card variant="outlined" sx={{ p: 1, borderColor: 'error.main', height: '100%' }}>
                        <ResponsiveTypography variant="subtitle2" color="error" gutterBottom>
                          Error Information
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Code:</strong> {selectedRecord.errorCode}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Message:</strong> {selectedRecord.errorMessage}
                        </ResponsiveTypography>
                        {selectedRecord.stackTrace && (
                          <Accordion sx={{ '& .MuiAccordionSummary-root': { minHeight: '24px' } }}>
                            <AccordionSummary expandIcon={<ExpandMore />} sx={{ py: 0 }}>
                              <ResponsiveTypography variant="caption">Stack Trace</ResponsiveTypography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ py: 0.5 }}>
                              <Box 
                                component="pre" 
                                sx={{ 
                                  fontSize: '0.6rem', 
                                  backgroundColor: 'grey.100', 
                                  p: 0.5, 
                                  borderRadius: 1,
                                  overflow: 'auto',
                                  maxHeight: '80px'
                                }}
                              >
                                {selectedRecord.stackTrace}
                              </Box>
                            </AccordionDetails>
                          </Accordion>
                        )}
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* API Call Details - Ultra Optimized Layout */}
              <Box>
                <Box display="flex" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
                  <ResponsiveTypography variant="h6">
                    External API Calls
                  </ResponsiveTypography>
                  {apiCallDetails && apiCallDetails.length > 0 && (
                    <Chip 
                      label={`${apiCallDetails.length} calls`} 
                      color="primary" 
                      variant="outlined"
                      size="small"
                      sx={{ fontSize: '0.7rem', height: '20px' }}
                    />
                  )}
                </Box>
                                
                {loadingApiCalls ? (
                  <Box display="flex" alignItems="center" gap={2} sx={{ p: 3 }}>
                    <CircularProgress size={20} />
                    <ResponsiveTypography variant="body2">Loading API call details...</ResponsiveTypography>
                  </Box>
                ) : apiCallDetails && apiCallDetails.length > 0 ? (
                  <TableContainer 
                    component={Paper} 
                    sx={{ 
                      mt: 0.5,
                      '& .MuiTable-root': {
                        minWidth: '900px'
                      }
                    }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ minWidth: '90px', fontWeight: 'bold', fontSize: '0.75rem' }}>Provider</TableCell>
                          <TableCell sx={{ maxWidth: '500px', fontWeight: 'bold', fontSize: '0.75rem' }}>Endpoint</TableCell>
                          <TableCell sx={{ minWidth: '70px', fontWeight: 'bold', fontSize: '0.75rem' }}>Status</TableCell>
                          <TableCell sx={{ minWidth: '110px', fontWeight: 'bold', fontSize: '0.75rem' }}>Response Time</TableCell>
                          <TableCell sx={{ minWidth: '70px', fontWeight: 'bold', fontSize: '0.75rem' }}>Code</TableCell>
                          <TableCell sx={{ minWidth: '90px', fontWeight: 'bold', fontSize: '0.75rem' }}>Symbols</TableCell>
                          <TableCell sx={{ minWidth: '70px', fontWeight: 'bold', fontSize: '0.75rem' }}>Success</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {apiCallDetails.map((apiCall) => (
                          <React.Fragment key={apiCall.id}>
                            <TableRow 
                              hover 
                              onClick={() => {
                                // Toggle details for this row
                                const detailsRow = document.getElementById(`details-${apiCall.id}`);
                                if (detailsRow) {
                                  detailsRow.style.display = detailsRow.style.display === 'none' ? 'table-row' : 'none';
                                }
                              }}
                              sx={{ 
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: 'action.hover'
                                }
                              }}
                            >
                              <TableCell sx={{ minWidth: '90px' }}>
                                <ResponsiveTypography variant="body2" fontWeight="medium">
                                  {apiCall.provider}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell sx={{ maxWidth: '500px' }} >
                                <ResponsiveTypography variant="body2" >
                                  {apiCall.method} {apiCall.endpoint}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell sx={{ minWidth: '70px' }}>
                                <Box display="flex" alignItems="center" gap={0.3}>
                                  {getApiCallStatusIcon(apiCall.status)}
                                  
                                </Box>
                              </TableCell>
                              <TableCell sx={{ minWidth: '110px' }}>
                                <ResponsiveTypography variant="body2" fontWeight="medium">
                                  {formatDuration(apiCall.responseTime)}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell sx={{ minWidth: '70px' }}>
                                <ResponsiveTypography 
                                  variant="body2" 
                                  fontWeight="medium"
                                  color={apiCall.statusCode && apiCall.statusCode >= 400 ? 'error' : 'text.primary'}
                                >
                                  {apiCall.statusCode || 'N/A'}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell sx={{ minWidth: '90px' }}>
                                <Box>
                                  <ResponsiveTypography variant="body2" fontWeight="medium">
                                    {apiCall.symbolsProcessed}
                                  </ResponsiveTypography>
                                  <Box display="flex" gap={0.3} mt={0.1}>
                                    <ResponsiveTypography variant="caption" color="success.main">
                                      ✓ {apiCall.successfulSymbols}
                                    </ResponsiveTypography>
                                    <ResponsiveTypography variant="caption" color="error.main">
                                      ✗ {apiCall.failedSymbols}
                                    </ResponsiveTypography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ minWidth: '70px' }}>
                                <ResponsiveTypography 
                                  variant="body2" 
                                  fontWeight="medium"
                                  color={apiCall.symbolsProcessed > 0 && (apiCall.successfulSymbols / apiCall.symbolsProcessed) >= 0.9 ? 'success.main' : 'warning.main'}
                                >
                                  {apiCall.symbolsProcessed > 0 
                                    ? ((apiCall.successfulSymbols / apiCall.symbolsProcessed) * 100).toFixed(0)
                                    : 0
                                  }%
                                </ResponsiveTypography>
                              </TableCell>
                            </TableRow>
                            
                            {/* Expandable details row - Ultra Compact */}
                            <TableRow id={`details-${apiCall.id}`} style={{ display: 'none' }}>
                              <TableCell colSpan={8} sx={{ py: 0, border: 'none' }}>
                                <Box sx={{ p: 1, backgroundColor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
                                  <Grid container spacing={1}>
                                    <Grid item xs={12} sm={6} md={3}>
                                      <Card variant="outlined" sx={{ p: 1, height: '100%' }}>
                                        <ResponsiveTypography variant="subtitle2" gutterBottom color="primary">
                                          Timing
                                        </ResponsiveTypography>
                                        <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 0.3 }}>
                                          <strong>Started:</strong> {formatDateTime(apiCall.startedAt)}
                                        </ResponsiveTypography>
                                        <ResponsiveTypography variant="body2" color="text.secondary">
                                          <strong>Completed:</strong> {apiCall.completedAt ? formatDateTime(apiCall.completedAt) : 'N/A'}
                                        </ResponsiveTypography>
                                      </Card>
                                    </Grid>
                                    
                                    {apiCall.errorMessage && (
                                      <Grid item xs={12} sm={6} md={3}>
                                        <Card variant="outlined" sx={{ p: 1, height: '100%', borderColor: 'error.main' }}>
                                          <ResponsiveTypography variant="subtitle2" color="error" gutterBottom>
                                            Error
                                          </ResponsiveTypography>
                                          <ResponsiveTypography variant="body2">
                                            {apiCall.errorMessage}
                                          </ResponsiveTypography>
                                        </Card>
                                      </Grid>
                                    )}
                                    
                                    {apiCall.requestData && (
                                      <Grid item xs={12} sm={6} md={3}>
                                        <Card variant="outlined" sx={{ p: 1, height: '100%' }}>
                                          <ResponsiveTypography variant="subtitle2" gutterBottom color="info">
                                            Request
                                          </ResponsiveTypography>
                                          <Box 
                                            component="pre" 
                                            sx={{ 
                                              fontSize: '0.6rem', 
                                              backgroundColor: 'grey.100', 
                                              p: 0.5, 
                                              borderRadius: 1,
                                              overflow: 'auto',
                                              maxHeight: 100,
                                              border: 1,
                                              borderColor: 'divider'
                                            }}
                                          >
                                            {JSON.stringify(apiCall.requestData, null, 2)}
                                          </Box>
                                        </Card>
                                      </Grid>
                                    )}
                                    
                                    {apiCall.responseData && (
                                      <Grid item xs={12} sm={6} md={3}>
                                        <Card variant="outlined" sx={{ p: 1, height: '100%' }}>
                                          <ResponsiveTypography variant="subtitle2" gutterBottom color="success">
                                            Response
                                          </ResponsiveTypography>
                                          <Box 
                                            component="pre" 
                                            sx={{ 
                                              fontSize: '0.6rem', 
                                              backgroundColor: 'grey.100', 
                                              p: 0.5, 
                                              borderRadius: 1,
                                              overflow: 'auto',
                                              maxHeight: 100,
                                              border: 1,
                                              borderColor: 'divider'
                                            }}
                                          >
                                            {JSON.stringify(apiCall.responseData, null, 2)}
                                          </Box>
                                        </Card>
                                      </Grid>
                                    )}
                                  </Grid>
                                </Box>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <ResponsiveTypography variant="body2" color="text.secondary">
                      No API call details available
                    </ResponsiveTypography>
                  </Box>
                )}
              </Box>

              {/* Metadata - Ultra Compact */}
              {selectedRecord.metadata && (
                <Box sx={{ mt: 1 }}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />} sx={{ py: 0.3 }}>
                      <ResponsiveTypography variant="subtitle2">
                        Metadata
                      </ResponsiveTypography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ py: 0.5 }}>
                      <Box 
                        component="pre" 
                        sx={{ 
                          fontSize: '0.6rem', 
                          backgroundColor: 'grey.100', 
                          p: 0.5, 
                          borderRadius: 1,
                          overflow: 'auto',
                          maxHeight: 120
                        }}
                      >
                        {JSON.stringify(selectedRecord.metadata, null, 2)}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </ModalWrapper>
  );
}

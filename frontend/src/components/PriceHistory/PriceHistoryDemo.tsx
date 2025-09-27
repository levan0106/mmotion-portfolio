import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button
} from '@mui/material';
import PriceHistoryTable from './PriceHistoryTable';

const PriceHistoryDemo: React.FC = () => {
  const [assetId, setAssetId] = useState('2e4cde8c-9799-443e-96bd-2cb120b67a0c');
  const [showTable, setShowTable] = useState(false);

  const handleLoadHistory = () => {
    if (assetId.trim()) {
      setShowTable(true);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Price History Demo
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Enter Asset ID
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            label="Asset ID"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleLoadHistory}
            disabled={!assetId.trim()}
          >
            Load History
          </Button>
        </Box>
      </Paper>

      {showTable && (
        <PriceHistoryTable
          assetId={assetId}
          showFilters={true}
          showPagination={true}
          pageSize={10}
        />
      )}
    </Box>
  );
};

export default PriceHistoryDemo;

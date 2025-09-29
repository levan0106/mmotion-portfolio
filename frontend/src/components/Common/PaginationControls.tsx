import React from 'react';
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';

interface PaginationControlsProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  limitOptions?: number[];
  showLimitSelector?: boolean;
  showPageInfo?: boolean;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  page,
  limit,
  total,
  totalPages,
  hasNext,
  hasPrev,
  onPageChange,
  onLimitChange,
  limitOptions = [5, 10, 25, 50, 100],
  showLimitSelector = true,
  showPageInfo = true,
}) => {
  const handleFirstPage = () => onPageChange(1);
  const handlePrevPage = () => onPageChange(page - 1);
  const handleNextPage = () => onPageChange(page + 1);
  const handleLastPage = () => onPageChange(totalPages);

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
        backgroundColor: 'grey.50',
      }}
    >
      {/* Page Info */}
      {showPageInfo && (
        <Typography variant="body2" color="text.secondary">
          Showing {startItem}-{endItem} of {total} items
        </Typography>
      )}

      {/* Limit Selector */}
      {showLimitSelector && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">Items per page:</Typography>
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              displayEmpty
            >
              {limitOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Pagination Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title="First page">
          <IconButton
            onClick={handleFirstPage}
            disabled={!hasPrev}
            size="small"
          >
            <FirstPage />
          </IconButton>
        </Tooltip>

        <Tooltip title="Previous page">
          <IconButton
            onClick={handlePrevPage}
            disabled={!hasPrev}
            size="small"
          >
            <NavigateBefore />
          </IconButton>
        </Tooltip>

        <Typography variant="body2" sx={{ mx: 1 }}>
          Page {page} of {totalPages}
        </Typography>

        <Tooltip title="Next page">
          <IconButton
            onClick={handleNextPage}
            disabled={!hasNext}
            size="small"
          >
            <NavigateNext />
          </IconButton>
        </Tooltip>

        <Tooltip title="Last page">
          <IconButton
            onClick={handleLastPage}
            disabled={!hasNext}
            size="small"
          >
            <LastPage />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

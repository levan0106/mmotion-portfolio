import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
} from '@mui/material';
import { ResponsiveTableProps } from './ResponsiveTable.types';
import ResponsiveTypography from './ResponsiveTypography';
import './ResponsiveTable.styles.css';

/**
 * Responsive Table Component with consistent styling
 * Provides light borders and optimized text visibility
 */
const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  columns,
  data,
  loading = false,
  emptyMessage = 'Không có dữ liệu',
  size = 'small',
  variant = 'outlined',
  showBorders = true,
  hoverable = true,
  striped = false,
  className = '',
  sx = {},
  onRowClick,
  getRowKey,
  ...props
}) => {

  const defaultSx = {
    border: showBorders ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
    borderRadius: 2,
    overflow: 'auto',
    maxWidth: '100%',
    '&::-webkit-scrollbar': {
      height: 8,
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      borderRadius: 4,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: 4,
      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      },
    },
    '& .MuiTable-root': {
      minWidth: 'max-content',
      '& .MuiTableRow-root': {
        '&:not(:last-child)': {
          borderBottom: showBorders ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
        },
        '&:hover': hoverable ? {
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          cursor: onRowClick ? 'pointer' : 'default',
        } : {},
        ...(striped && {
          '&:nth-of-type(even)': {
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          },
        }),
      },
      '& .MuiTableCell-root': {
        borderBottom: showBorders ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
        borderRight: showBorders ? '1px solid rgba(0, 0, 0, 0.05)' : 'none',
        '&:last-child': {
          borderRight: 'none',
        },
        color: 'rgba(0, 0, 0, 0.87)',
        fontSize: size === 'small' ? '0.875rem' : '1rem',
        padding: size === 'small' ? '8px 12px' : '12px 16px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
      '& .MuiTableHead-root .MuiTableCell-root': {
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderBottom: showBorders ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
        fontWeight: 600,
        fontSize: size === 'small' ? '0.8rem' : '0.9rem',
      },
    },
    ...sx,
  };

  const handleRowClick = (row: any, index: number) => {
    if (onRowClick) {
      onRowClick(row, index);
    }
  };

  const getRowKeyValue = (row: any, index: number) => {
    if (getRowKey) {
      return getRowKey(row, index);
    }
    return index;
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <TableContainer 
        component={Paper} 
        variant={variant}
        className={`responsive-table ${className}`}
        sx={defaultSx}
        {...props}
      >
      <Table size={size}>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableCell
                key={column.key || index}
                align={column.align || 'left'}
                sx={{
                  ...(column.headerSx || {}),
                  // Apply cellSx to header for responsive behavior
                  ...(column.cellSx || {}),
                  ...(column.minWidth && { minWidth: column.minWidth }),
                  ...(column.maxWidth && { maxWidth: column.maxWidth }),
                  ...(column.width && { width: column.width }),
                } as any}
              >
                {column.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center">
                  <ResponsiveTypography variant="body2" color="text.secondary">
                    Đang tải...
                  </ResponsiveTypography>
                </Box>
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center">
                  <ResponsiveTypography variant="body2" color="text.secondary">
                    {emptyMessage}
                  </ResponsiveTypography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow
                key={getRowKeyValue(row, index)}
                onClick={() => handleRowClick(row, index)}
                sx={{
                  ...(onRowClick && { cursor: 'pointer' }),
                }}
              >
                {columns.map((column, colIndex) => (
                  <TableCell
                    key={column.key || colIndex}
                    align={column.align || 'left'}
                    sx={{
                      ...column.cellSx,
                      minWidth: column.minWidth,
                      maxWidth: column.maxWidth,
                      width: column.width,
                    }}
                  >
                    {column.render ? column.render(row, index) : row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </TableContainer>
      
      {/* Scroll indicator */}
      <Box
        sx={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 20,
          height: 40,
          background: 'linear-gradient(to left, rgba(0,0,0,0.1), transparent)',
          pointerEvents: 'none',
          opacity: 0.6,
          display: { xs: 'block', sm: 'none' },
          zIndex: 1,
        }}
      />
    </Box>
  );
};

export default ResponsiveTable;

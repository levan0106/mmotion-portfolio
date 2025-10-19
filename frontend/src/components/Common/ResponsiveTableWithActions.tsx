import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  Tooltip,
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import ResponsiveTable from './ResponsiveTable';
import { ResponsiveTableWithActionsProps, TableAction } from './ResponsiveTable.types';

/**
 * Enhanced Responsive Table with Actions
 * Includes action menu for each row
 */
const ResponsiveTableWithActions: React.FC<ResponsiveTableWithActionsProps> = ({
  actions = [],
  actionsColumnWidth = 80,
  showActionsOnHover = true,
  ...tableProps
}) => {
  const [anchorEl, setAnchorEl] = useState<{ [key: string]: HTMLElement | null }>({});
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, row: any, index: number) => {
    event.stopPropagation();
    setAnchorEl({ [`${index}`]: event.currentTarget });
    setSelectedRow(row);
    setSelectedIndex(index);
  };

  const handleMenuClose = () => {
    setAnchorEl({});
    setSelectedRow(null);
    setSelectedIndex(-1);
  };

  const handleActionClick = (action: TableAction) => {
    if (selectedRow && selectedIndex >= 0) {
      action.onClick(selectedRow, selectedIndex);
    }
    handleMenuClose();
  };

  const getVisibleActions = (row: any, index: number) => {
    return actions.filter(action => 
      !action.hidden || !action.hidden(row, index)
    );
  };


  // Add actions column if actions are provided
  const enhancedColumns = [
    ...tableProps.columns,
    ...(actions.length > 0 ? [{
      key: 'actions',
      header: '',
      align: 'center' as const,
      width: actionsColumnWidth,
      render: (row: any, index: number) => {
        const visibleActions = getVisibleActions(row, index);
        
        if (visibleActions.length === 0) {
          return null;
        }

        const isDisabled = visibleActions.every(action => 
          action.disabled && action.disabled(row, index)
        );

        return (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: showActionsOnHover ? 0 : 1,
              transition: 'opacity 0.2s ease-in-out',
              '&:hover': {
                opacity: 1,
              },
            }}
          >
            <Tooltip title="Hành động">
              <IconButton
                size="small"
                onClick={(e) => handleMenuOpen(e, row, index)}
                disabled={isDisabled}
                sx={{
                  opacity: isDisabled ? 0.5 : 1,
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    }] : []),
  ];

  return (
    <>
      <ResponsiveTable
        {...tableProps}
        columns={enhancedColumns}
        sx={{
          '& .MuiTableRow-root:hover .responsive-table-actions': {
            opacity: 1,
          },
          ...tableProps.sx,
        }}
      />
      
      {/* Actions Menu */}
      {Object.entries(anchorEl).map(([index, anchor]) => {
        const rowIndex = parseInt(index);
        const row = tableProps.data[rowIndex];
        const visibleActions = getVisibleActions(row, rowIndex);
        
        return (
          <Menu
            key={index}
            anchorEl={anchor}
            open={Boolean(anchor)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                minWidth: 160,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
            }}
          >
            {visibleActions.map((action, actionIndex) => {
              const isDisabled = action.disabled && action.disabled(row, rowIndex);
              
              return (
                <MenuItem
                  key={actionIndex}
                  onClick={() => handleActionClick(action)}
                  disabled={isDisabled}
                  sx={{
                    color: isDisabled ? 'text.disabled' : `${action.color || 'primary'}.main`,
                    '&:hover': {
                      backgroundColor: `${action.color || 'primary'}.light`,
                      color: `${action.color || 'primary'}.contrastText`,
                    },
                  }}
                >
                  {action.icon && (
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {action.icon}
                    </ListItemIcon>
                  )}
                  <ListItemText 
                    primary={action.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  />
                </MenuItem>
              );
            })}
          </Menu>
        );
      })}
    </>
  );
};

export default ResponsiveTableWithActions;

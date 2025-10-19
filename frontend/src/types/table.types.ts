import { ReactNode } from 'react';
import { SxProps, Theme } from '@mui/material';

export interface ResponsiveTableColumn<T = any> {
  key: string;
  header: ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  render?: (row: T, index: number) => ReactNode;
  headerSx?: SxProps<Theme>;
  cellSx?: SxProps<Theme>;
  sortable?: boolean;
  sortKey?: string;
}

export interface ResponsiveTableProps<T = any> {
  columns: ResponsiveTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'elevation';
  showBorders?: boolean;
  hoverable?: boolean;
  striped?: boolean;
  className?: string;
  sx?: SxProps<Theme>;
  onRowClick?: (row: T, index: number) => void;
  getRowKey?: (row: T, index: number) => string | number;
  stickyHeader?: boolean;
  maxHeight?: string | number;
}

export interface TableAction<T = any> {
  label: string;
  icon?: ReactNode;
  onClick: (row: T, index: number) => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  variant?: 'text' | 'outlined' | 'contained';
  disabled?: (row: T, index: number) => boolean;
  hidden?: (row: T, index: number) => boolean;
}

export interface ResponsiveTableWithActionsProps<T = any> extends ResponsiveTableProps<T> {
  actions?: TableAction<T>[];
  actionsColumnWidth?: string | number;
  showActionsOnHover?: boolean;
}

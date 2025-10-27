import { ReactNode } from 'react';
import { SxProps, Theme } from '@mui/material';

export interface ResponsiveCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  variant?: 'default' | 'transparent' | 'outlined' | 'elevated';
  size?: 'none' | 'small' | 'medium' | 'large';
  spacing?: 'none' | 'small' | 'medium' | 'large';
  hoverable?: boolean;
  clickable?: boolean;
  loading?: boolean;
  error?: string | null;
  actions?: ReactNode;
  className?: string;
  sx?: SxProps<Theme>;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export interface ResponsiveCardContentProps {
  children: ReactNode;
  padding?: 'none' | 'small' | 'medium' | 'large';
  className?: string;
  sx?: SxProps<Theme>;
}

export interface ResponsiveCardHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  sx?: SxProps<Theme>;
}

export interface ResponsiveCardActionsProps {
  children: ReactNode;
  position?: 'left' | 'center' | 'right';
  spacing?: 'none' | 'small' | 'medium' | 'large';
  className?: string;
  sx?: SxProps<Theme>;
}

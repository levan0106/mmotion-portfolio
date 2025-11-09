/**
 * FIFOTooltip Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import FIFOTooltip from '../FIFOTooltip';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('FIFOTooltip', () => {
  it('renders help icon button', () => {
    renderWithTheme(<FIFOTooltip />);
    
    const helpButton = screen.getByRole('button');
    expect(helpButton).toBeInTheDocument();
  });

  it('shows tooltip on hover', async () => {
    renderWithTheme(<FIFOTooltip />);
    
    const helpButton = screen.getByRole('button');
    fireEvent.mouseOver(helpButton);
    
    // Wait for tooltip to appear
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if tooltip content is present
    expect(screen.getByText('FIFO (First In, First Out)')).toBeInTheDocument();
  });

  it('displays FIFO explanation content', async () => {
    renderWithTheme(<FIFOTooltip />);
    
    const helpButton = screen.getByRole('button');
    fireEvent.mouseOver(helpButton);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check for key content
    expect(screen.getByText('Phương pháp tính lãi/lỗ thực hiện trong giao dịch')).toBeInTheDocument();
    expect(screen.getByText('Nguyên tắc hoạt động:')).toBeInTheDocument();
    expect(screen.getByText('Ví dụ thực tế:')).toBeInTheDocument();
    expect(screen.getByText('Cách tính FIFO:')).toBeInTheDocument();
    expect(screen.getByText('Lợi ích của FIFO:')).toBeInTheDocument();
  });

  it('applies custom props correctly', () => {
    renderWithTheme(
      <FIFOTooltip 
        placement="bottom" 
        size="medium" 
        color="secondary" 
      />
    );
    
    const helpButton = screen.getByRole('button');
    expect(helpButton).toBeInTheDocument();
  });

  it('handles auto placement detection', () => {
    // Mock getBoundingClientRect
    const mockRect = {
      top: 100,
      bottom: 150,
      left: 200,
      right: 250,
      width: 50,
      height: 50,
      x: 200,
      y: 100,
      toJSON: () => ({}),
    } as DOMRect;
    
    const mockGetBoundingClientRect = jest.fn(() => mockRect);
    Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
    
    renderWithTheme(<FIFOTooltip />);
    
    const helpButton = screen.getByRole('button');
    expect(helpButton).toBeInTheDocument();
  });
});

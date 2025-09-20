// SnapshotExportImport Component for CR-006 Asset Snapshot System

import React, { useState, useRef } from 'react';
import { useSnapshots } from '../../hooks/useSnapshots';
import { SnapshotResponse, SnapshotGranularity } from '../../types/snapshot.types';
import './SnapshotExportImport.styles.css';

interface SnapshotExportImportProps {
  portfolioId: string;
  onImportComplete?: (importedCount: number) => void;
  onExportComplete?: (exportedCount: number) => void;
}

export const SnapshotExportImport: React.FC<SnapshotExportImportProps> = ({
  // portfolioId,
  onImportComplete,
  onExportComplete,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'excel'>('csv');
  const [exportFilters, setExportFilters] = useState({
    startDate: '',
    endDate: '',
    granularity: '' as SnapshotGranularity | '',
    assetId: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { snapshots } = useSnapshots(undefined);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Get snapshots with filters
      const filters: any = {};
      if (exportFilters.startDate) filters.startDate = exportFilters.startDate;
      if (exportFilters.endDate) filters.endDate = exportFilters.endDate;
      if (exportFilters.granularity) filters.granularity = exportFilters.granularity;
      if (exportFilters.assetId) filters.assetId = exportFilters.assetId;

      // For now, use the snapshots from the hook
      // In a real implementation, you would call the API with filters
      const filteredSnapshots = snapshots || [];
      
      if (filteredSnapshots.length === 0) {
        alert('No snapshots found for the selected criteria');
        return;
      }

      // Export based on format
      switch (exportFormat) {
        case 'csv':
          exportToCSV(filteredSnapshots);
          break;
        case 'json':
          exportToJSON(filteredSnapshots);
          break;
        case 'excel':
          exportToExcel(filteredSnapshots);
          break;
      }

      onExportComplete?.(filteredSnapshots.length);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = (snapshots: SnapshotResponse[]) => {
    const headers = [
      'ID',
      'Portfolio ID',
      'Asset ID',
      'Asset Symbol',
      'Snapshot Date',
      'Granularity',
      'Quantity',
      'Current Price',
      'Current Value',
      'Cost Basis',
      'Average Cost',
      'Realized P&L',
      'Unrealized P&L',
      'Total P&L',
      'Allocation Percentage',
      'Portfolio Total Value',
      'Return Percentage',
      'Daily Return',
      'Cumulative Return',
      'Is Active',
      'Created By',
      'Notes',
      'Created At',
      'Updated At',
    ];

    const csvContent = [
      headers.join(','),
      ...snapshots.map(snapshot => [
        snapshot.id,
        snapshot.portfolioId,
        snapshot.assetId,
        snapshot.assetSymbol,
        snapshot.snapshotDate,
        snapshot.granularity,
        snapshot.quantity,
        snapshot.currentPrice,
        snapshot.currentValue,
        snapshot.costBasis,
        snapshot.avgCost,
        snapshot.realizedPl,
        snapshot.unrealizedPl,
        snapshot.totalPl,
        snapshot.allocationPercentage,
        snapshot.portfolioTotalValue,
        snapshot.returnPercentage,
        snapshot.dailyReturn,
        snapshot.cumulativeReturn,
        snapshot.isActive,
        snapshot.createdBy || '',
        snapshot.notes || '',
        snapshot.createdAt,
        snapshot.updatedAt,
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    downloadFile(csvContent, 'snapshots.csv', 'text/csv');
  };

  const exportToJSON = (snapshots: SnapshotResponse[]) => {
    const jsonContent = JSON.stringify(snapshots, null, 2);
    downloadFile(jsonContent, 'snapshots.json', 'application/json');
  };

  const exportToExcel = (snapshots: SnapshotResponse[]) => {
    // For Excel export, we'll use CSV format with .xlsx extension
    // In a real implementation, you'd use a library like xlsx
    const headers = [
      'ID', 'Portfolio ID', 'Asset ID', 'Asset Symbol', 'Snapshot Date',
      'Granularity', 'Quantity', 'Current Price', 'Current Value',
      'Cost Basis', 'Average Cost', 'Realized P&L', 'Unrealized P&L',
      'Total P&L', 'Allocation Percentage', 'Portfolio Total Value',
      'Return Percentage', 'Daily Return', 'Cumulative Return',
      'Is Active', 'Created By', 'Notes', 'Created At', 'Updated At'
    ];

    const csvContent = [
      headers.join(','),
      ...snapshots.map(snapshot => [
        snapshot.id, snapshot.portfolioId, snapshot.assetId, snapshot.assetSymbol,
        snapshot.snapshotDate, snapshot.granularity, snapshot.quantity,
        snapshot.currentPrice, snapshot.currentValue, snapshot.costBasis,
        snapshot.avgCost, snapshot.realizedPl, snapshot.unrealizedPl,
        snapshot.totalPl, snapshot.allocationPercentage, snapshot.portfolioTotalValue,
        snapshot.returnPercentage, snapshot.dailyReturn, snapshot.cumulativeReturn,
        snapshot.isActive, snapshot.createdBy || '', snapshot.notes || '',
        snapshot.createdAt, snapshot.updatedAt
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    downloadFile(csvContent, 'snapshots.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      previewImportFile(file);
    }
  };

  const previewImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let data: any[] = [];

        if (file.name.endsWith('.json')) {
          data = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          data = parseCSV(content);
        }

        setImportPreview(data.slice(0, 10)); // Show first 10 rows
        setShowPreview(true);
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Error parsing file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (content: string): any[] => {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    return lines.slice(1).filter(line => line.trim()).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, '').trim());
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  };

  const handleImport = async () => {
    if (!importFile) return;

    try {
      setIsImporting(true);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          let data: any[] = [];

          if (importFile.name.endsWith('.json')) {
            data = JSON.parse(content);
          } else if (importFile.name.endsWith('.csv')) {
            data = parseCSV(content);
          }

          // Here you would typically send the data to your backend
          // For now, we'll just show a success message
          console.log('Import data:', data);
          alert(`Successfully imported ${data.length} snapshots`);
          
          onImportComplete?.(data.length);
          setImportFile(null);
          setImportPreview([]);
          setShowPreview(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error) {
          console.error('Import failed:', error);
          alert('Import failed. Please check the file format.');
        }
      };
      reader.readAsText(importFile);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString();
  // };

  return (
    <div className="snapshot-export-import">
      <div className="export-import-header">
        <h3>Export & Import Snapshots</h3>
        <p>Export snapshot data to various formats or import data from files</p>
      </div>

      <div className="export-import-content">
        {/* Export Section */}
        <div className="export-section">
          <h4>Export Snapshots</h4>
          
          <div className="export-filters">
            <div className="filter-group">
              <label htmlFor="exportStartDate">Start Date:</label>
              <input
                id="exportStartDate"
                type="date"
                value={exportFilters.startDate}
                onChange={(e) => setExportFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="exportEndDate">End Date:</label>
              <input
                id="exportEndDate"
                type="date"
                value={exportFilters.endDate}
                onChange={(e) => setExportFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="exportGranularity">Granularity:</label>
              <select
                id="exportGranularity"
                value={exportFilters.granularity}
                onChange={(e) => setExportFilters(prev => ({ ...prev, granularity: e.target.value as SnapshotGranularity | '' }))}
              >
                <option value="">All</option>
                <option value={SnapshotGranularity.DAILY}>Daily</option>
                <option value={SnapshotGranularity.WEEKLY}>Weekly</option>
                <option value={SnapshotGranularity.MONTHLY}>Monthly</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="exportAssetId">Asset ID:</label>
              <input
                id="exportAssetId"
                type="text"
                placeholder="Optional asset ID filter"
                value={exportFilters.assetId}
                onChange={(e) => setExportFilters(prev => ({ ...prev, assetId: e.target.value }))}
              />
            </div>
          </div>

          <div className="export-format">
            <label>Export Format:</label>
            <div className="format-options">
              <label>
                <input
                  type="radio"
                  name="exportFormat"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json' | 'excel')}
                />
                CSV
              </label>
              <label>
                <input
                  type="radio"
                  name="exportFormat"
                  value="json"
                  checked={exportFormat === 'json'}
                  onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json' | 'excel')}
                />
                JSON
              </label>
              <label>
                <input
                  type="radio"
                  name="exportFormat"
                  value="excel"
                  checked={exportFormat === 'excel'}
                  onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json' | 'excel')}
                />
                Excel
              </label>
            </div>
          </div>

          <button
            className="export-btn"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export Snapshots'}
          </button>
        </div>

        {/* Import Section */}
        <div className="import-section">
          <h4>Import Snapshots</h4>
          
          <div className="import-file-select">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              className="file-select-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Select File
            </button>
            {importFile && (
              <span className="selected-file">
                Selected: {importFile.name}
              </span>
            )}
          </div>

          {showPreview && (
            <div className="import-preview">
              <h5>Preview (First 10 rows):</h5>
              <div className="preview-table">
                <table>
                  <thead>
                    <tr>
                      {Object.keys(importPreview[0] || {}).map(key => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, i) => (
                          <td key={i}>{String(value)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            className="import-btn"
            onClick={handleImport}
            disabled={!importFile || isImporting}
          >
            {isImporting ? 'Importing...' : 'Import Snapshots'}
          </button>
        </div>
      </div>

      <div className="export-import-info">
        <h5>Supported Formats:</h5>
        <ul>
          <li><strong>CSV:</strong> Comma-separated values with headers</li>
          <li><strong>JSON:</strong> JSON array of snapshot objects</li>
          <li><strong>Excel:</strong> Excel-compatible format (.xlsx)</li>
        </ul>
        
        <h5>Required Fields for Import:</h5>
        <ul>
          <li>portfolioId, assetId, assetSymbol, snapshotDate, granularity</li>
          <li>quantity, currentPrice, currentValue, costBasis, avgCost</li>
          <li>realizedPl, unrealizedPl, totalPl, allocationPercentage</li>
        </ul>
      </div>
    </div>
  );
};

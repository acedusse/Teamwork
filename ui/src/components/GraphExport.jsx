import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Download,
  Image,
  TableChart,
  Code,
  PictureAsPdf,
  Share,
  ContentCopy
} from '@mui/icons-material';

/**
 * GraphExport component provides export functionality for dependency graphs
 *
 * Props:
 *   tasks: Array of task objects
 *   cyRef: Reference to the Cytoscape instance
 *   analysisData: Analysis results (critical path, blocked tasks, etc.)
 */
export default function GraphExport({
  tasks = [],
  cyRef,
  analysisData = {}
}) {
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [exportDialog, setExportDialog] = useState(false);
  const [exportType, setExportType] = useState('');
  const [exportOptions, setExportOptions] = useState({
    filename: 'dependency-graph',
    format: 'png',
    includeAnalysis: true,
    includeFilters: false
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const exportFormats = [
    { value: 'png', label: 'PNG Image', icon: <Image /> },
    { value: 'jpg', label: 'JPEG Image', icon: <Image /> },
    { value: 'svg', label: 'SVG Vector', icon: <Code /> },
    { value: 'pdf', label: 'PDF Print-friendly', icon: <PictureAsPdf /> },
    { value: 'json', label: 'JSON Data', icon: <TableChart /> },
    { value: 'csv', label: 'CSV Data', icon: <TableChart /> }
  ];

  // Export graph as image
  const exportAsImage = (format = 'png') => {
    if (!cyRef?.current) {
      showSnackbar('Graph not available for export', 'error');
      return;
    }

    try {
      const cy = cyRef.current;
      const options = {
        output: 'blob',
        bg: '#ffffff',
        full: true,
        scale: 2
      };

      let blob;
      if (format === 'png') {
        blob = cy.png(options);
      } else if (format === 'jpg') {
        blob = cy.jpg(options);
      } else if (format === 'svg') {
        const svgStr = cy.svg({ scale: 2, full: true });
        blob = new Blob([svgStr], { type: 'image/svg+xml' });
      }

      if (blob) {
        downloadBlob(blob, `${exportOptions.filename}.${format}`);
        showSnackbar(`Graph exported as ${format.toUpperCase()}`, 'success');
      }
    } catch (error) {
      console.error('Export error:', error);
      showSnackbar('Failed to export graph', 'error');
    }
  };

  // Export data as JSON
  const exportAsJSON = () => {
    try {
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          taskCount: tasks.length,
          version: '1.0'
        },
        tasks: tasks,
        analysis: exportOptions.includeAnalysis ? analysisData : undefined
      };

      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      downloadBlob(blob, `${exportOptions.filename}.json`);
      showSnackbar('Data exported as JSON', 'success');
    } catch (error) {
      console.error('JSON export error:', error);
      showSnackbar('Failed to export JSON data', 'error');
    }
  };

  // Export data as CSV
  const exportAsCSV = () => {
    try {
      const headers = ['ID', 'Title', 'Status', 'Priority', 'Dependencies', 'Description'];
      const csvRows = [headers.join(',')];

      tasks.forEach(task => {
        const row = [
          task.id || '',
          `"${(task.title || '').replace(/"/g, '""')}"`,
          task.status || '',
          task.priority || '',
          `"${(task.dependencies || []).join(', ')}"`,
          `"${(task.description || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvStr = csvRows.join('\n');
      const blob = new Blob([csvStr], { type: 'text/csv' });
      downloadBlob(blob, `${exportOptions.filename}.csv`);
      showSnackbar('Data exported as CSV', 'success');
    } catch (error) {
      console.error('CSV export error:', error);
      showSnackbar('Failed to export CSV data', 'error');
    }
  };

  // Export as print-friendly PDF view
  const exportAsPDF = () => {
    if (!cyRef?.current) {
      showSnackbar('Graph not available for export', 'error');
      return;
    }

    try {
      const cy = cyRef.current;
      
      // Create a print-friendly version
      const printWindow = window.open('', '_blank');
      const svgContent = cy.svg({ 
        scale: 1.5, 
        full: true, 
        bg: '#ffffff',
        // Optimize for print
        colorScheme: 'light'
      });
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Dependency Graph - ${exportOptions.filename}</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              .graph-container { 
                width: 100%; 
                height: 100vh;
                page-break-inside: avoid;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #ccc;
              padding-bottom: 10px;
            }
            .graph-container {
              text-align: center;
              margin: 20px 0;
            }
            .metadata {
              font-size: 12px;
              color: #666;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Task Dependency Graph</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Total Tasks: ${tasks.length}</p>
          </div>
          <div class="graph-container">
            ${svgContent}
          </div>
          <div class="metadata">
            <p><strong>Export Options:</strong> ${exportOptions.filename}</p>
            ${exportOptions.includeAnalysis && analysisData.criticalPath ? 
              `<p><strong>Critical Path Length:</strong> ${analysisData.criticalPath.length} tasks</p>` : ''
            }
            ${analysisData.blockedTasks?.length ? 
              `<p><strong>Blocked Tasks:</strong> ${analysisData.blockedTasks.length}</p>` : ''
            }
          </div>
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()">Print</button>
            <button onclick="window.close()">Close</button>
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      showSnackbar('Print-friendly view opened in new window', 'success');
    } catch (error) {
      console.error('PDF export error:', error);
      showSnackbar('Failed to create print-friendly view', 'error');
    }
  };

  // Generate shareable link (mock implementation)
  const generateShareableLink = () => {
    try {
      const shareData = {
        tasks: tasks,
        analysis: analysisData,
        timestamp: Date.now()
      };
      
      // In a real implementation, this would upload to a service
      const encodedData = btoa(JSON.stringify(shareData));
      const shareUrl = `${window.location.origin}/shared-graph?data=${encodedData}`;
      
      navigator.clipboard.writeText(shareUrl).then(() => {
        showSnackbar('Shareable link copied to clipboard', 'success');
      }).catch(() => {
        showSnackbar('Failed to copy link to clipboard', 'error');
      });
    } catch (error) {
      console.error('Share link error:', error);
      showSnackbar('Failed to generate shareable link', 'error');
    }
  };

  // Copy graph data to clipboard
  const copyToClipboard = () => {
    try {
      const clipboardData = {
        tasks: tasks,
        analysis: analysisData
      };
      
      navigator.clipboard.writeText(JSON.stringify(clipboardData, null, 2)).then(() => {
        showSnackbar('Graph data copied to clipboard', 'success');
      }).catch(() => {
        showSnackbar('Failed to copy to clipboard', 'error');
      });
    } catch (error) {
      console.error('Clipboard error:', error);
      showSnackbar('Failed to copy to clipboard', 'error');
    }
  };

  // Download blob as file
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Show snackbar message
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Handle export menu
  const handleExportClick = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExportSelect = (type) => {
    setExportType(type);
    setExportDialog(true);
    handleExportMenuClose();
  };

  // Handle export execution
  const executeExport = () => {
    switch (exportType) {
      case 'image':
        exportAsImage(exportOptions.format);
        break;
      case 'json':
        exportAsJSON();
        break;
      case 'csv':
        exportAsCSV();
        break;
      case 'pdf':
        exportAsPDF();
        break;
      case 'share':
        generateShareableLink();
        break;
      case 'clipboard':
        copyToClipboard();
        break;
      default:
        showSnackbar('Unknown export type', 'error');
    }
    setExportDialog(false);
  };

  return (
    <Box>
      {/* Export Button */}
      <ButtonGroup variant="outlined" size="small">
        <Button
          startIcon={<Download />}
          onClick={handleExportClick}
          disabled={!tasks || tasks.length === 0}
        >
          Export
        </Button>
        <Button
          startIcon={<Share />}
          onClick={() => handleExportSelect('share')}
          disabled={!tasks || tasks.length === 0}
        >
          Share
        </Button>
        <Button
          startIcon={<ContentCopy />}
          onClick={() => handleExportSelect('clipboard')}
          disabled={!tasks || tasks.length === 0}
        >
          Copy
        </Button>
      </ButtonGroup>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={handleExportMenuClose}
      >
        <MenuItem onClick={() => handleExportSelect('image')}>
          <Image sx={{ mr: 1 }} />
          Export as Image
        </MenuItem>
        <MenuItem onClick={() => handleExportSelect('json')}>
          <TableChart sx={{ mr: 1 }} />
          Export as JSON
        </MenuItem>
        <MenuItem onClick={() => handleExportSelect('csv')}>
          <TableChart sx={{ mr: 1 }} />
          Export as CSV
        </MenuItem>
        <MenuItem onClick={() => handleExportSelect('pdf')}>
          <PictureAsPdf sx={{ mr: 1 }} />
          Print-friendly View
        </MenuItem>
      </Menu>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Export Options
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Filename"
              value={exportOptions.filename}
              onChange={(e) => setExportOptions(prev => ({ ...prev, filename: e.target.value }))}
              fullWidth
            />

            {exportType === 'image' && (
              <FormControl fullWidth>
                <InputLabel>Format</InputLabel>
                <Select
                  value={exportOptions.format}
                  label="Format"
                  onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value }))}
                >
                  <MenuItem value="png">PNG Image</MenuItem>
                  <MenuItem value="jpg">JPEG Image</MenuItem>
                  <MenuItem value="svg">SVG Vector</MenuItem>
                </Select>
              </FormControl>
            )}

                        {(exportType === 'json' || exportType === 'share' || exportType === 'pdf') && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Include in export:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={exportOptions.includeAnalysis}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeAnalysis: e.target.checked
                      }))}
                    />
                    {' '}Analysis results (critical path, blocked tasks, etc.)
                  </label>
                </Box>
              </Box>
            )}

            {exportType === 'share' && (
              <Alert severity="info">
                This will generate a shareable link that others can use to view the dependency graph.
                The link will be copied to your clipboard.
              </Alert>
            )}

            {exportType === 'pdf' && (
              <Alert severity="info">
                Opens a print-friendly view in a new window optimized for printing or PDF generation.
              </Alert>
            )}

            {exportType === 'clipboard' && (
              <Alert severity="info">
                This will copy the graph data as JSON to your clipboard for pasting into other applications.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>
            Cancel
          </Button>
          <Button onClick={executeExport} variant="contained">
            Export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        message={snackbar.message}
      />
    </Box>
  );
} 
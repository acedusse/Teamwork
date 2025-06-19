import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Checkbox,
  TextField,
  Grid,
  Chip,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import {
  GetApp,
  PictureAsPdf,
  TableChart,
  Email,
  Settings,
  Preview,
  Close,
  ExpandMore,
  Description,
  Assessment,
  Group,
  Schedule,
  CheckCircle,
  Warning,
  Info
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';
import PropTypes from 'prop-types';

const RetrospectiveExporter = ({
  retrospectiveData,
  actionItems,
  metrics,
  onClose,
  open = false
}) => {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [reportTemplate, setReportTemplate] = useState('comprehensive');
  const [includeVoting, setIncludeVoting] = useState(true);
  const [includeActionItems, setIncludeActionItems] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeDiscussion, setIncludeDiscussion] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  // Report templates configuration
  const reportTemplates = {
    comprehensive: {
      name: 'Comprehensive Report',
      description: 'Full retrospective with all sections and detailed analysis',
      sections: ['summary', 'items', 'voting', 'actionItems', 'metrics', 'recommendations']
    },
    summary: {
      name: 'Executive Summary',
      description: 'High-level overview with key insights and action items',
      sections: ['summary', 'topItems', 'actionItems', 'keyMetrics']
    },
    actionFocused: {
      name: 'Action-Focused Report',
      description: 'Emphasizes action items and next steps',
      sections: ['summary', 'actionItems', 'priorities', 'timeline']
    },
    metrics: {
      name: 'Metrics & Analytics',
      description: 'Data-driven report with charts and trend analysis',
      sections: ['metrics', 'trends', 'insights', 'recommendations']
    },
    custom: {
      name: 'Custom Report',
      description: 'Select specific sections to include',
      sections: []
    }
  };

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportStatus(null);

    try {
      if (exportFormat === 'pdf') {
        await exportToPDF();
      } else if (exportFormat === 'csv') {
        await exportToCSV();
      }
      
      setExportStatus({ type: 'success', message: 'Export completed successfully!' });
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus({ type: 'error', message: `Export failed: ${error.message}` });
    } finally {
      setIsExporting(false);
    }
  }, [exportFormat, reportTemplate, includeVoting, includeActionItems, includeMetrics]);

  const exportToPDF = useCallback(async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Helper function to add page break if needed
    const checkPageBreak = (requiredHeight) => {
      if (yPosition + requiredHeight > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
    };

    // Title and Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    const title = customTitle || `Retrospective Report - ${retrospectiveData?.templateName || 'Standard'}`;
    pdf.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Executive Summary
    if (reportTemplates[reportTemplate].sections.includes('summary')) {
      checkPageBreak(30);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Executive Summary', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const summaryText = generateExecutiveSummary();
      const summaryLines = pdf.splitTextToSize(summaryText, pageWidth - 40);
      pdf.text(summaryLines, 20, yPosition);
      yPosition += summaryLines.length * 5 + 15;
    }

    // Retrospective Items
    if (reportTemplates[reportTemplate].sections.includes('items') && retrospectiveData?.items) {
      Object.entries(retrospectiveData.items).forEach(([columnName, items]) => {
        if (items.length > 0) {
          checkPageBreak(20);
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(columnName, 20, yPosition);
          yPosition += 10;

          items.forEach((item, index) => {
            checkPageBreak(15);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            
            const itemText = `• ${item.text}`;
            const itemLines = pdf.splitTextToSize(itemText, pageWidth - 40);
            pdf.text(itemLines, 25, yPosition);
            yPosition += itemLines.length * 4;

            if (includeVoting && item.votes > 0) {
              pdf.setFont('helvetica', 'italic');
              pdf.text(`  Votes: ${item.votes}`, 30, yPosition);
              yPosition += 4;
            }
            yPosition += 3;
          });
          yPosition += 10;
        }
      });
    }

    // Action Items
    if (includeActionItems && actionItems?.length > 0) {
      checkPageBreak(30);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Action Items', 20, yPosition);
      yPosition += 15;

      // Create table for action items
      const actionItemsData = actionItems.map(item => [
        item.title,
        item.assignee?.name || 'Unassigned',
        item.priority,
        item.status,
        item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No due date'
      ]);

      pdf.autoTable({
        head: [['Title', 'Assignee', 'Priority', 'Status', 'Due Date']],
        body: actionItemsData,
        startY: yPosition,
        theme: 'grid',
        headStyles: { fillColor: [63, 81, 181] },
        margin: { left: 20, right: 20 }
      });

      yPosition = pdf.lastAutoTable.finalY + 15;
    }

    // Metrics
    if (includeMetrics && metrics) {
      checkPageBreak(30);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Improvement Metrics', 20, yPosition);
      yPosition += 15;

      const metricsData = Object.entries(metrics).map(([key, value]) => [
        key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        typeof value === 'number' ? value.toFixed(2) : value.toString()
      ]);

      pdf.autoTable({
        head: [['Metric', 'Value']],
        body: metricsData,
        startY: yPosition,
        theme: 'grid',
        headStyles: { fillColor: [76, 175, 80] },
        margin: { left: 20, right: 20 }
      });

      yPosition = pdf.lastAutoTable.finalY + 15;
    }

    // Recommendations
    if (reportTemplates[reportTemplate].sections.includes('recommendations')) {
      checkPageBreak(30);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Recommendations', 20, yPosition);
      yPosition += 10;

      const recommendations = generateRecommendations();
      recommendations.forEach((rec, index) => {
        checkPageBreak(15);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const recText = `${index + 1}. ${rec}`;
        const recLines = pdf.splitTextToSize(recText, pageWidth - 40);
        pdf.text(recLines, 20, yPosition);
        yPosition += recLines.length * 5 + 5;
      });
    }

    // Footer
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10, { align: 'right' });
      pdf.text('Generated by Teamwork Dashboard', 20, pageHeight - 10);
    }

    // Save the PDF
    const fileName = `retrospective-report-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  }, [retrospectiveData, actionItems, metrics, reportTemplate, includeVoting, includeActionItems, includeMetrics, customTitle]);

  const exportToCSV = useCallback(async () => {
    const csvData = [];

    // Retrospective Items
    if (retrospectiveData?.items) {
      csvData.push(['Section', 'Item', 'Author', 'Votes', 'Date Added']);
      Object.entries(retrospectiveData.items).forEach(([columnName, items]) => {
        items.forEach(item => {
          csvData.push([
            columnName,
            item.text,
            item.author || 'Anonymous',
            item.votes || 0,
            item.dateAdded || new Date().toISOString()
          ]);
        });
      });
    }

    // Add separator
    csvData.push([]);
    csvData.push(['Action Items']);
    csvData.push(['Title', 'Description', 'Assignee', 'Priority', 'Status', 'Due Date', 'Created Date']);

    // Action Items
    if (actionItems?.length > 0) {
      actionItems.forEach(item => {
        csvData.push([
          item.title,
          item.description || '',
          item.assignee?.name || 'Unassigned',
          item.priority,
          item.status,
          item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '',
          item.createdDate ? new Date(item.createdDate).toLocaleDateString() : ''
        ]);
      });
    }

    // Add separator
    csvData.push([]);
    csvData.push(['Metrics']);
    csvData.push(['Metric', 'Value', 'Unit']);

    // Metrics
    if (metrics) {
      Object.entries(metrics).forEach(([key, value]) => {
        csvData.push([
          key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          typeof value === 'number' ? value.toFixed(2) : value.toString(),
          typeof value === 'number' ? (key.includes('Rate') ? '%' : 'count') : ''
        ]);
      });
    }

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `retrospective-data-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [retrospectiveData, actionItems, metrics]);

  const generateExecutiveSummary = useCallback(() => {
    const totalItems = retrospectiveData?.items ? 
      Object.values(retrospectiveData.items).reduce((sum, items) => sum + items.length, 0) : 0;
    const totalVotes = retrospectiveData?.items ? 
      Object.values(retrospectiveData.items).reduce((sum, items) => 
        sum + items.reduce((itemSum, item) => itemSum + (item.votes || 0), 0), 0) : 0;
    const totalActionItems = actionItems?.length || 0;
    const completedActionItems = actionItems?.filter(item => item.status === 'Done').length || 0;

    return `This retrospective generated ${totalItems} insights across all categories, with ${totalVotes} total votes cast by the team. ${totalActionItems} action items were created, with ${completedActionItems} already completed. The team demonstrated strong engagement and identified key areas for improvement in the upcoming iteration.`;
  }, [retrospectiveData, actionItems]);

  const generateRecommendations = useCallback(() => {
    const recommendations = [];
    
    if (actionItems?.length > 5) {
      recommendations.push('Consider prioritizing action items to focus on the most impactful improvements');
    }
    
    if (retrospectiveData?.items) {
      const stopItems = retrospectiveData.items['Stop']?.length || 0;
      if (stopItems > 3) {
        recommendations.push('High number of "Stop" items suggests process refinement opportunities');
      }
    }
    
    recommendations.push('Schedule follow-up on action items within 2 weeks');
    recommendations.push('Consider implementing a regular check-in process for continuous improvement');
    
    return recommendations;
  }, [retrospectiveData, actionItems]);

  const handleEmailShare = useCallback(() => {
    const subject = encodeURIComponent(`Retrospective Report - ${new Date().toLocaleDateString()}`);
    const body = encodeURIComponent(`Please find attached the retrospective report generated on ${new Date().toLocaleDateString()}.\n\nBest regards,\nTeamwork Dashboard`);
    const recipients = emailRecipients.split(',').map(email => email.trim()).join(',');
    
    window.open(`mailto:${recipients}?subject=${subject}&body=${body}`);
  }, [emailRecipients]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            Export Retrospective Report
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Export Format Selection */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <GetApp sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Export Format
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                  >
                    <FormControlLabel
                      value="pdf"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PictureAsPdf sx={{ mr: 1, color: 'error.main' }} />
                          PDF Report
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="csv"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TableChart sx={{ mr: 1, color: 'success.main' }} />
                          CSV Data Export
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          {/* Report Template Selection */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Report Template
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={reportTemplate}
                    onChange={(e) => setReportTemplate(e.target.value)}
                    disabled={exportFormat === 'csv'}
                  >
                    {Object.entries(reportTemplates).map(([key, template]) => (
                      <MenuItem key={key} value={key}>
                        <Box>
                          <Typography variant="body1">{template.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {template.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          {/* Content Selection */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Content Selection
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={includeVoting}
                          onChange={(e) => setIncludeVoting(e.target.checked)}
                        />
                      }
                      label="Include Voting Results"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={includeActionItems}
                          onChange={(e) => setIncludeActionItems(e.target.checked)}
                        />
                      }
                      label="Include Action Items"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={includeMetrics}
                          onChange={(e) => setIncludeMetrics(e.target.checked)}
                        />
                      }
                      label="Include Improvement Metrics"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={includeDiscussion}
                          onChange={(e) => setIncludeDiscussion(e.target.checked)}
                        />
                      }
                      label="Include Discussion Notes"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Customization Options */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">
                  <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Advanced Options
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Custom Report Title"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Enter custom title for the report"
                      helperText="Leave empty to use default title"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Recipients"
                      value={emailRecipients}
                      onChange={(e) => setEmailRecipients(e.target.value)}
                      placeholder="email1@example.com, email2@example.com"
                      helperText="Comma-separated email addresses for sharing"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Export Status */}
          {exportStatus && (
            <Grid item xs={12}>
              <Alert severity={exportStatus.type} sx={{ mb: 2 }}>
                {exportStatus.message}
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'space-between' }}>
          <Box>
            {emailRecipients && (
              <Button
                variant="outlined"
                startIcon={<Email />}
                onClick={handleEmailShare}
                disabled={isExporting}
              >
                Share via Email
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onClose} disabled={isExporting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleExport}
              disabled={isExporting}
              startIcon={isExporting ? <CircularProgress size={20} /> : <GetApp />}
            >
              {isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

RetrospectiveExporter.propTypes = {
  retrospectiveData: PropTypes.shape({
    templateName: PropTypes.string,
    items: PropTypes.object
  }),
  actionItems: PropTypes.array,
  metrics: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool
};

RetrospectiveExporter.defaultProps = {
  retrospectiveData: null,
  actionItems: [],
  metrics: {},
  open: false
};

export default RetrospectiveExporter; 
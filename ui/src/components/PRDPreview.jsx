import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Stack, 
  Divider, 
  IconButton, 
  Tooltip,
  Alert,
  Skeleton
} from '@mui/material';
import { 
  Visibility as PreviewIcon,
  Code as CodeIcon,
  Article as ArticleIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  TextFields as TxtIcon,
  FullscreenExit as CollapseIcon,
  Fullscreen as ExpandIcon
} from '@mui/icons-material';

const getFileTypeIcon = (fileName) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return <PdfIcon color="error" />;
    case 'doc':
    case 'docx':
      return <DocIcon color="primary" />;
    case 'md':
      return <ArticleIcon color="info" />;
    case 'txt':
      return <TxtIcon color="action" />;
    default:
      return <CodeIcon color="secondary" />;
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileTypeLabel = (fileName, mimeType) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (mimeType?.includes('pdf')) return 'PDF Document';
  if (mimeType?.includes('word') || ['doc', 'docx'].includes(extension)) return 'Word Document';
  if (extension === 'md') return 'Markdown';
  if (extension === 'txt') return 'Text File';
  return 'Document';
};

// Simple markdown parser for basic formatting
const parseMarkdown = (text) => {
  if (!text) return '';
  
  return text
    // Headers
    .replace(/^### (.*$)/gim, '<h3 style="color: #1976d2; margin: 16px 0 8px 0; font-weight: 600;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="color: #1976d2; margin: 20px 0 12px 0; font-weight: 600;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="color: #1976d2; margin: 24px 0 16px 0; font-weight: 700;">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^\* (.*$)/gim, '<li style="margin: 4px 0;">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li style="margin: 4px 0; list-style-type: decimal;">$1</li>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; margin: 12px 0;"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>')
    // Line breaks
    .replace(/\n/g, '<br/>');
};

export default function PRDPreview({ file, content, loading = false, error = null }) {
  const [expanded, setExpanded] = useState(false);
  const [fileContent, setFileContent] = useState('');
  const [contentError, setContentError] = useState(null);

  useEffect(() => {
    if (content) {
      setFileContent(content);
      setContentError(null);
    } else if (file && !content && !loading) {
      // Try to read file content if possible
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          setFileContent(text);
          setContentError(null);
        } catch (err) {
          setContentError('Unable to read file content');
        }
      };
      reader.onerror = () => {
        setContentError('Error reading file');
      };
      
      if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        setContentError('Preview not available for this file type');
      }
    }
  }, [file, content, loading]);

  if (!file && !loading) return null;

  const isMarkdown = file?.name.endsWith('.md') || file?.type === 'text/markdown';
  const canPreview = file?.type.startsWith('text/') || file?.name.endsWith('.md') || file?.name.endsWith('.txt');

  return (
    <Box sx={{ mt: 2 }}>
      <Paper 
        elevation={2} 
        sx={{ 
          p: 0,
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          ...(expanded && {
            position: 'fixed',
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
            zIndex: 1300,
            m: 0,
            display: 'flex',
            flexDirection: 'column'
          })
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: 2, 
          bgcolor: 'grey.50', 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            {loading ? (
              <Skeleton variant="circular" width={24} height={24} />
            ) : (
              getFileTypeIcon(file?.name || '')
            )}
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {loading ? (
                <Skeleton variant="text" width="60%" />
              ) : (
                <Typography variant="h6" noWrap>
                  PRD Preview
                </Typography>
              )}
              
              {loading ? (
                <Skeleton variant="text" width="40%" />
              ) : (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {file?.name} • {formatFileSize(file?.size || 0)}
                </Typography>
              )}
            </Box>

            {!loading && (
              <Stack direction="row" spacing={1}>
                <Chip 
                  label={getFileTypeLabel(file?.name || '', file?.type)}
                  size="small"
                  color={canPreview ? 'success' : 'default'}
                  variant="outlined"
                />
                {isMarkdown && (
                  <Chip 
                    label="MD"
                    size="small"
                    color="info"
                    variant="filled"
                  />
                )}
              </Stack>
            )}
          </Box>

          {!loading && canPreview && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={expanded ? 'Collapse view' : 'Expand view'}>
                <IconButton 
                  size="small" 
                  onClick={() => setExpanded(!expanded)}
                  sx={{ ml: 1 }}
                >
                  {expanded ? <CollapseIcon /> : <ExpandIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        {/* Content */}
        <Box sx={{ 
          p: 2, 
          flex: expanded ? 1 : 'none',
          overflow: expanded ? 'auto' : 'visible',
          maxHeight: expanded ? 'none' : '400px'
        }}>
          {loading ? (
            <Box>
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="rectangular" height={120} sx={{ mt: 2 }} />
            </Box>
          ) : error ? (
            <Alert severity="error">
              {error}
            </Alert>
          ) : contentError ? (
            <Alert severity="warning" icon={<PreviewIcon />}>
              {contentError}
            </Alert>
          ) : !canPreview ? (
            <Alert severity="info" icon={<PreviewIcon />}>
              Preview is not available for this file type. You can still upload and process the file.
            </Alert>
          ) : fileContent ? (
            <Box>
              {isMarkdown ? (
                <Box 
                  sx={{ 
                    '& h1, & h2, & h3': { mt: 2, mb: 1 },
                    '& p': { mb: 1 },
                    '& ul, & ol': { pl: 2 },
                    '& pre': { 
                      bgcolor: 'grey.100', 
                      p: 2, 
                      borderRadius: 1,
                      overflow: 'auto'
                    },
                    lineHeight: 1.6
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: parseMarkdown(fileContent) 
                  }}
                />
              ) : (
                <Box
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: 'text.primary',
                    bgcolor: 'grey.50',
                    p: 2,
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'grey.200',
                    maxHeight: expanded ? 'none' : '300px',
                    overflow: 'auto'
                  }}
                >
                  {fileContent}
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No content to preview
            </Typography>
          )}
        </Box>

        {/* Footer with file stats */}
        {!loading && file && (
          <>
            <Divider />
            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Stack direction="row" spacing={3}>
                <Typography variant="caption" color="text.secondary">
                  <strong>Size:</strong> {formatFileSize(file.size)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  <strong>Type:</strong> {file.type || 'Unknown'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  <strong>Last Modified:</strong> {new Date(file.lastModified).toLocaleString()}
                </Typography>
                {fileContent && (
                  <Typography variant="caption" color="text.secondary">
                    <strong>Characters:</strong> {fileContent.length.toLocaleString()}
                  </Typography>
                )}
              </Stack>
            </Box>
          </>
        )}
      </Paper>

      {/* Backdrop for expanded view */}
      {expanded && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1299
          }}
          onClick={() => setExpanded(false)}
        />
      )}
    </Box>
  );
} 
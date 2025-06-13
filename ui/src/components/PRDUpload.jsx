import React, { useRef, useState, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Alert, 
  LinearProgress, 
  Chip,
  Stack,
  CircularProgress
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { uploadPRD, processPRD } from '../api/prdService';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.md',
];

const FILE_EXTENSIONS = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'text/plain': 'TXT',
  'text/markdown': 'MD'
};

const MAX_SIZE = 50 * 1024; // 50KB

export default function PRDUpload({ onFileSelect, onProcessingComplete, onError }) {
  const inputRef = useRef();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle', 'uploading', 'processing', 'complete', 'error'

  const validateFile = useCallback((file) => {
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    const isValidType = ACCEPTED_TYPES.some(type => 
      file.type === type || file.name.toLowerCase().endsWith(type.replace('.', ''))
    );

    if (!isValidType) {
      return { 
        valid: false, 
        error: 'Unsupported file type. Please upload PDF, DOC, DOCX, TXT, or MD files.' 
      };
    }

    if (file.size > MAX_SIZE) {
      return { 
        valid: false, 
        error: `File is too large. Maximum size is ${(MAX_SIZE / 1024).toFixed(0)}KB, but file is ${(file.size / 1024).toFixed(1)}KB.` 
      };
    }

    if (file.size === 0) {
      return { 
        valid: false, 
        error: 'File appears to be empty. Please select a valid document.' 
      };
    }

    return { valid: true };
  }, []);

  const handleFile = useCallback(async (file) => {
    setError('');
    const validation = validateFile(file);
    
    if (!validation.valid) {
      setError(validation.error);
      setUploadStatus('error');
      if (onError) onError(validation.error);
      return;
    }

    setFile(file);
    setUploadStatus('uploading');
    if (onFileSelect) onFileSelect(file);
    await uploadAndProcessFile(file);
  }, [validateFile, onFileSelect]);

  const uploadAndProcessFile = async (file) => {
    setUploadProgress(0);
    setProcessing(true);
    
    try {
      // Simulate upload progress
      setUploadStatus('uploading');
      for (let i = 0; i <= 30; i += 5) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const uploadResponse = await uploadPRD(file);
      setUploadProgress(40);
      
      // Transition to processing phase
      setUploadStatus('processing');
      for (let i = 40; i <= 90; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const processResponse = await processPRD(uploadResponse.fileId);
      setUploadProgress(100);
      setUploadStatus('complete');
      setProcessing(false);
      
      if (onProcessingComplete) {
        onProcessingComplete({
          file,
          uploadResponse,
          processResponse
        });
      }
    } catch (err) {
      const errorMsg = 'Error uploading or processing file: ' + (err.response?.data?.message || err.message);
      setError(errorMsg);
      setUploadStatus('error');
      setProcessing(false);
      if (onError) onError(errorMsg);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 1) {
      setError('Please upload only one file at a time.');
      return;
    }
    
    const droppedFile = files[0];
    handleFile(droppedFile);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleInputChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    handleFile(selectedFile);
  }, [handleFile]);

  const resetUpload = () => {
    setFile(null);
    setError('');
    setUploadProgress(0);
    setProcessing(false);
    setUploadStatus('idle');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'complete':
        return <CheckIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'uploading':
      case 'processing':
        return <CircularProgress size={24} />;
      default:
        return <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />;
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'complete':
        return 'success.main';
      case 'error':
        return 'error.main';
      case 'uploading':
      case 'processing':
        return 'primary.main';
      default:
        return dragActive ? 'primary.main' : 'grey.400';
    }
  };

  return (
    <Box>
      <Paper
        elevation={dragActive ? 6 : 2}
        sx={{
          p: 4,
          textAlign: 'center',
          border: `2px ${dragActive ? 'solid' : 'dashed'} ${getStatusColor()}`,
          backgroundColor: dragActive ? 'action.hover' : 'background.paper',
          cursor: uploadStatus === 'uploading' || uploadStatus === 'processing' ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease-in-out',
          position: 'relative',
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !processing && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          style={{ display: 'none' }}
          onChange={handleInputChange}
          disabled={processing}
        />
        
        {getStatusIcon()}
        
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          {uploadStatus === 'idle' && 'Drag & drop your PRD file here, or click to select'}
          {uploadStatus === 'uploading' && 'Uploading file...'}
          {uploadStatus === 'processing' && 'Processing PRD content...'}
          {uploadStatus === 'complete' && 'Upload and processing complete!'}
          {uploadStatus === 'error' && 'Upload failed'}
        </Typography>
        
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          {['PDF', 'DOC', 'DOCX', 'TXT', 'MD'].map((type) => (
            <Chip 
              key={type} 
              label={type} 
              size="small" 
              variant="outlined"
              color={uploadStatus === 'complete' ? 'success' : 'default'}
            />
          ))}
        </Stack>
        
        <Typography variant="body2" color="text.secondary">
          Maximum file size: {(MAX_SIZE / 1024).toFixed(0)}KB
        </Typography>

        {file && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1, width: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <FileIcon color="primary" />
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(file.size / 1024).toFixed(1)} KB • {FILE_EXTENSIONS[file.type] || 'Unknown'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {processing && (
          <Box sx={{ mt: 2, width: '100%' }}>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                }
              }} 
            />
            <Typography variant="body2" sx={{ mt: 1 }} color="primary">
              {uploadStatus === 'uploading' ? 'Uploading' : 'Processing'}: {uploadProgress}%
            </Typography>
          </Box>
        )}
      </Paper>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mt: 2 }}
          action={
            <Button size="small" onClick={resetUpload}>
              Try Again
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button 
          variant="contained" 
          onClick={() => inputRef.current?.click()}
          disabled={processing}
          startIcon={<CloudUploadIcon />}
        >
          Choose File
        </Button>
        
        {file && uploadStatus !== 'idle' && (
          <Button 
            variant="outlined" 
            onClick={resetUpload}
            disabled={processing}
          >
            Upload Another File
          </Button>
        )}
      </Box>
    </Box>
  );
} 
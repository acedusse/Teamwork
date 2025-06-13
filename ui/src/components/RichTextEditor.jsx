import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Box, Typography, FormHelperText } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled wrapper for the Quill editor
const StyledQuillWrapper = styled(Box)(({ theme, error }) => ({
  '& .ql-container': {
    borderBottomLeftRadius: theme.shape.borderRadius,
    borderBottomRightRadius: theme.shape.borderRadius,
    border: error ? `1px solid ${theme.palette.error.main}` : `1px solid ${theme.palette.divider}`,
    borderTop: 'none',
    fontSize: '14px',
    fontFamily: theme.typography.fontFamily,
  },
  '& .ql-toolbar': {
    borderTopLeftRadius: theme.shape.borderRadius,
    borderTopRightRadius: theme.shape.borderRadius,
    border: error ? `1px solid ${theme.palette.error.main}` : `1px solid ${theme.palette.divider}`,
    borderBottom: 'none',
    backgroundColor: theme.palette.background.default,
  },
  '& .ql-editor': {
    minHeight: '120px',
    maxHeight: '300px',
    overflow: 'auto',
    '&.ql-blank::before': {
      color: theme.palette.text.disabled,
      fontStyle: 'italic',
    },
  },
  '& .ql-editor p': {
    margin: '0 0 8px 0',
  },
  '& .ql-editor ul, & .ql-editor ol': {
    paddingLeft: '1.5em',
  },
  '& .ql-editor blockquote': {
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    paddingLeft: '16px',
    margin: '8px 0',
    fontStyle: 'italic',
    color: theme.palette.text.secondary,
  },
  '& .ql-editor code': {
    backgroundColor: theme.palette.action.hover,
    padding: '2px 4px',
    borderRadius: '4px',
    fontFamily: 'monospace',
  },
  '& .ql-editor pre': {
    backgroundColor: theme.palette.action.hover,
    padding: '12px',
    borderRadius: '4px',
    overflow: 'auto',
    fontFamily: 'monospace',
  },
}));

export default function RichTextEditor({
  value = '',
  onChange = null,
  placeholder = 'Enter text...',
  error = false,
  helperText = '',
  label = '',
  disabled = false,
  minHeight = 120,
  maxHeight = 300,
  ...props
}) {
  // Quill modules configuration
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      ['link'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    }
  }), []);

  // Quill formats
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'blockquote', 'code-block',
    'link',
    'color', 'background',
    'align'
  ];

  const handleChange = (content, delta, source, editor) => {
    if (onChange) {
      // Get plain text for validation
      const text = editor.getText();
      // Get HTML content
      const html = editor.getHTML();
      
      onChange(html, text);
    }
  };

  return (
    <Box {...props}>
      {label && (
        <Typography 
          variant="body2" 
          component="label" 
          sx={{ 
            mb: 1, 
            display: 'block',
            fontWeight: 500,
            color: error ? 'error.main' : 'text.primary'
          }}
        >
          {label}
        </Typography>
      )}
      
      <StyledQuillWrapper error={error}>
        <ReactQuill
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={disabled}
          style={{
            '--ql-editor-min-height': `${minHeight}px`,
            '--ql-editor-max-height': `${maxHeight}px`,
          }}
        />
      </StyledQuillWrapper>
      
      {helperText && (
        <FormHelperText error={error} sx={{ mt: 0.5, mx: 1.75 }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
}

// Utility function to strip HTML tags for plain text
export const stripHtml = (html) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

// Utility function to check if content is empty
export const isEmptyContent = (html) => {
  if (!html) return true;
  const text = stripHtml(html).trim();
  return text.length === 0;
}; 
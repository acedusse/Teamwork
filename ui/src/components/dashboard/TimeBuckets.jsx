import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  useTheme,
  useMediaQuery,
  Alert
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  Schedule,
  DateRange,
  CalendarToday
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import StoryCard from './StoryCard';

// Time horizon configurations
const TIME_HORIZON_CONFIG = {
  year: {
    title: 'Year View',
    icon: <CalendarToday />,
    buckets: [
      { id: 'q1', label: 'Q1', period: 'Jan-Mar', capacity: 100 },
      { id: 'q2', label: 'Q2', period: 'Apr-Jun', capacity: 100 },
      { id: 'q3', label: 'Q3', period: 'Jul-Sep', capacity: 100 },
      { id: 'q4', label: 'Q4', period: 'Oct-Dec', capacity: 100 }
    ],
    gridColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
  },
  quarter: {
    title: 'Quarter View', 
    icon: <DateRange />,
    buckets: [
      { id: 'month1', label: 'Month 1', period: 'Weeks 1-4', capacity: 35 },
      { id: 'month2', label: 'Month 2', period: 'Weeks 5-8', capacity: 35 },
      { id: 'month3', label: 'Month 3', period: 'Weeks 9-12', capacity: 35 }
    ],
    gridColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
  },
  month: {
    title: 'Month View',
    icon: <Schedule />,
    buckets: [
      { id: 'week1', label: 'Week 1', period: 'Days 1-7', capacity: 8 },
      { id: 'week2', label: 'Week 2', period: 'Days 8-14', capacity: 8 },
      { id: 'week3', label: 'Week 3', period: 'Days 15-21', capacity: 8 },
      { id: 'week4', label: 'Week 4', period: 'Days 22-28', capacity: 8 }
    ],
    gridColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
  }
};

// Individual bucket component
const TimeBucket = ({ 
  bucket, 
  stories = [], 
  onDrop, 
  isDropTarget = false,
  theme
}) => {
  const currentLoad = useMemo(() => {
    return stories.reduce((total, story) => total + (story.effort || 0), 0);
  }, [stories]);

  const capacityPercentage = (currentLoad / bucket.capacity) * 100;
  const isOverCapacity = capacityPercentage > 100;
  const isNearCapacity = capacityPercentage > 80 && capacityPercentage <= 100;

  const getCapacityColor = () => {
    if (isOverCapacity) return theme.palette.error.main;
    if (isNearCapacity) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const getCapacityIcon = () => {
    if (isOverCapacity) return <Warning color="error" />;
    if (isNearCapacity) return <Warning color="warning" />;
    return <CheckCircle color="success" />;
  };

  return (
    <Paper
      elevation={isDropTarget ? 4 : 2}
      sx={{
        p: 2,
        minHeight: 300,
        display: 'flex',
        flexDirection: 'column',
        border: isDropTarget ? `2px dashed ${theme.palette.primary.main}` : '1px solid',
        borderColor: isDropTarget ? theme.palette.primary.main : theme.palette.divider,
        backgroundColor: isDropTarget ? theme.palette.action.hover : 'inherit',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          elevation: 3,
          borderColor: theme.palette.primary.light
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDrop) {
          const storyData = JSON.parse(e.dataTransfer.getData('application/json'));
          onDrop(bucket.id, storyData);
        }
      }}
    >
      {/* Bucket Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" component="h3" gutterBottom>
          {bucket.label}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {bucket.period}
        </Typography>
        
        {/* Capacity Indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {getCapacityIcon()}
          <Typography variant="body2" color="text.secondary">
            {currentLoad} / {bucket.capacity} points
          </Typography>
        </Box>
        
        <LinearProgress
          variant="determinate"
          value={Math.min(capacityPercentage, 100)}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.palette.grey[200],
            '& .MuiLinearProgress-bar': {
              backgroundColor: getCapacityColor(),
              borderRadius: 4
            }
          }}
        />
        
        {/* Overflow Warning */}
        {isOverCapacity && (
          <Alert 
            severity="error" 
            size="small" 
            sx={{ mt: 1 }}
            icon={<Warning fontSize="small" />}
          >
            Over capacity by {currentLoad - bucket.capacity} points
          </Alert>
        )}
        
        {isNearCapacity && (
          <Alert 
            severity="warning" 
            size="small" 
            sx={{ mt: 1 }}
            icon={<Warning fontSize="small" />}
          >
            Near capacity limit
          </Alert>
        )}
      </Box>

      {/* Stories Container */}
      <Box 
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          minHeight: 150,
          p: 1,
          backgroundColor: theme.palette.grey[50],
          borderRadius: 1,
          border: `1px dashed ${theme.palette.grey[300]}`
        }}
      >
        {stories.length === 0 ? (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              textAlign: 'center', 
              mt: 2,
              fontStyle: 'italic'
            }}
          >
            Drop stories here
          </Typography>
        ) : (
          stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              compact
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify(story));
                e.dataTransfer.effectAllowed = 'move';
              }}
              sx={{
                cursor: 'grab',
                '&:active': {
                  cursor: 'grabbing'
                }
              }}
            />
          ))
        )}
      </Box>
    </Paper>
  );
};

// Main TimeBuckets component
const TimeBuckets = ({ 
  timeHorizon = 'quarter',
  stories = [],
  bucketConfig = null,
  bucketData = {},
  onStoryMove,
  className = '',
  ...props 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Validate timeHorizon
  if (!['year', 'quarter', 'month'].includes(timeHorizon)) {
    throw new Error(`Invalid timeHorizon: ${timeHorizon}. Must be one of: year, quarter, month`);
  }

  // Validate bucketConfig if provided
  if (bucketConfig && !bucketConfig[timeHorizon]) {
    throw new Error(`Missing configuration for timeHorizon: ${timeHorizon}`);
  }

  // Use bucketConfig if provided, otherwise fall back to TIME_HORIZON_CONFIG
  let config;
  if (bucketConfig && bucketConfig[timeHorizon]) {
    const horizonConfig = bucketConfig[timeHorizon];
    config = {
      ...TIME_HORIZON_CONFIG[timeHorizon],
      buckets: horizonConfig.buckets.map((bucketLabel, index) => ({
        id: bucketLabel,
        label: bucketLabel,
        period: TIME_HORIZON_CONFIG[timeHorizon]?.buckets[index]?.period || '',
        capacity: horizonConfig.capacity
      }))
    };
  } else {
    config = TIME_HORIZON_CONFIG[timeHorizon] || TIME_HORIZON_CONFIG.quarter;
  }

  // Process stories into bucket data if stories array is provided
  let processedBucketData = bucketData;
  if (stories.length > 0 && Object.keys(bucketData).length === 0) {
    processedBucketData = {};
    config.buckets.forEach(bucket => {
      processedBucketData[bucket.id] = stories.filter(story => story.bucket === bucket.id);
    });
  }
  
  // Responsive grid columns
  const getGridColumns = () => {
    if (isMobile) return '1fr';
    if (isTablet && config.buckets.length > 2) return 'repeat(2, 1fr)';
    return config.gridColumns;
  };

  const handleStoryDrop = (bucketId, story) => {
    if (onStoryMove) {
      onStoryMove(story, bucketId);
    }
  };

  return (
    <Box
      className={className}
      sx={{
        width: '100%',
        ...props.sx
      }}
      {...props}
    >
      {/* Time Horizon Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        {config.icon}
        <Typography variant="h5" component="h2">
          {config.title}
        </Typography>
      </Box>

      {/* Buckets Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: getGridColumns(),
          gap: 2,
          '@media (max-width: 600px)': {
            gridTemplateColumns: '1fr',
            gap: 1
          }
        }}
      >
        {config.buckets.map((bucket) => (
          <TimeBucket
            key={bucket.id}
            bucket={bucket}
            stories={processedBucketData[bucket.id] || []}
            onDrop={handleStoryDrop}
            theme={theme}
          />
        ))}
      </Box>

      {/* Summary Statistics */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          {config.title} Summary
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Typography variant="body2">
            Total Buckets: {config.buckets.length}
          </Typography>
          <Typography variant="body2">
            Total Capacity: {config.buckets.reduce((sum, b) => sum + b.capacity, 0)} points
          </Typography>
          <Typography variant="body2">
            Stories Allocated: {Object.values(processedBucketData).flat().length}
          </Typography>
          <Typography variant="body2">
            Current Load: {Object.values(processedBucketData).flat().reduce((sum, story) => sum + (story.effort || 0), 0)} points
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

TimeBuckets.propTypes = {
  timeHorizon: PropTypes.oneOf(['year', 'quarter', 'month']).isRequired,
  stories: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    effort: PropTypes.number,
    priority: PropTypes.string,
    assignee: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    bucket: PropTypes.string
  })),
  bucketConfig: PropTypes.objectOf(PropTypes.shape({
    buckets: PropTypes.arrayOf(PropTypes.string).isRequired,
    capacity: PropTypes.number.isRequired
  })),
  bucketData: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    effort: PropTypes.number,
    priority: PropTypes.string,
    assignee: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string)
  }))),
  onStoryMove: PropTypes.func,
  className: PropTypes.string,
  sx: PropTypes.object
};

TimeBucket.propTypes = {
  bucket: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    period: PropTypes.string.isRequired,
    capacity: PropTypes.number.isRequired
  }).isRequired,
  stories: PropTypes.array,
  onDrop: PropTypes.func,
  isDropTarget: PropTypes.bool,
  theme: PropTypes.object.isRequired
};

export default TimeBuckets; 
import React from 'react';
import PropTypes from 'prop-types';
import { useDroppable } from '@dnd-kit/core';
import { Paper, Box, Typography, LinearProgress } from '@mui/material';
import DraggableStoryCard from './DraggableStoryCard';

const DroppableBucket = ({ 
  bucket, 
  children, 
  showProgress = true,
  ...props 
}) => {
  const {
    isOver,
    setNodeRef
  } = useDroppable({
    id: bucket.id,
    data: {
      type: 'bucket',
      bucket: bucket
    }
  });

  const style = {
    backgroundColor: isOver ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
    borderColor: isOver ? '#1976d2' : 'rgba(0, 0, 0, 0.12)',
    borderWidth: isOver ? '2px' : '1px',
    borderStyle: 'dashed',
    transition: 'all 0.2s ease-in-out'
  };

  const currentLoad = bucket.stories ? bucket.stories.reduce((sum, story) => sum + (story.effort || 0), 0) : 0;
  const capacity = bucket.capacity || 20;
  const loadPercentage = Math.min((currentLoad / capacity) * 100, 100);
  const isOverCapacity = currentLoad > capacity;

  return (
    <Paper
      ref={setNodeRef}
      elevation={isOver ? 4 : 1}
      sx={{
        p: 2,
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        ...style
      }}
      {...props}
    >
      {/* Bucket Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" component="h3" gutterBottom>
          {bucket.title}
        </Typography>
        
        {showProgress && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Capacity: {currentLoad} / {capacity}
              {isOverCapacity && (
                <Typography component="span" color="error" sx={{ ml: 1 }}>
                  (Over capacity!)
                </Typography>
              )}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={loadPercentage}
              color={isOverCapacity ? 'error' : loadPercentage > 80 ? 'warning' : 'primary'}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </Box>

      {/* Stories */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {bucket.stories && bucket.stories.length > 0 ? (
          bucket.stories.map((story) => (
            <DraggableStoryCard
              key={story.id}
              story={story}
              compact={true}
            />
          ))
        ) : (
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              fontStyle: 'italic',
              minHeight: 100,
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: isOver ? 'action.hover' : 'transparent'
            }}
          >
            {isOver ? 'Drop story here' : 'Drop stories here...'}
          </Box>
        )}
      </Box>

      {children}
    </Paper>
  );
};

DroppableBucket.propTypes = {
  bucket: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    capacity: PropTypes.number,
    stories: PropTypes.arrayOf(PropTypes.object)
  }).isRequired,
  children: PropTypes.node,
  showProgress: PropTypes.bool
};

export default DroppableBucket; 
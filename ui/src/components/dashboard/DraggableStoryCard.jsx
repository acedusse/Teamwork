import React from 'react';
import PropTypes from 'prop-types';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import StoryCard from './StoryCard';

const DraggableStoryCard = ({ 
  story, 
  disabled = false,
  ...props 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: story.id.toString(),
    disabled: disabled,
    data: {
      type: 'story',
      story: story
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: disabled ? 'default' : 'grab'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <StoryCard
        story={story}
        isDragging={isDragging}
        {...props}
      />
    </div>
  );
};

DraggableStoryCard.propTypes = {
  story: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    effort: PropTypes.number,
    priority: PropTypes.string,
    assignee: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    status: PropTypes.string
  }).isRequired,
  disabled: PropTypes.bool
};

export default DraggableStoryCard; 
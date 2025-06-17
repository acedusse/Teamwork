import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../common/Modal';
import Button from '../common/Button';

/**
 * MultiStepModal - Modal for multi-step workflows (wizard-style)
 * Pass an array of steps, each with a title and content (React node or function)
 */
const MultiStepModal = ({ open, onClose, steps, onFinish, initialStep = 0 }) => {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const step = steps[currentStep] || {};
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (!isLast) setCurrentStep(s => s + 1);
    else if (onFinish) onFinish();
  };
  const handleBack = () => {
    if (!isFirst) setCurrentStep(s => s - 1);
  };

  return (
    <Modal open={open} onClose={onClose} title={step.title || 'Multi-Step Modal'}>
      <div style={{ minHeight: 120 }}>
        {typeof step.content === 'function' ? step.content() : step.content}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 30 }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        {!isFirst && (
          <Button variant="secondary" onClick={handleBack}>
            Back
          </Button>
        )}
        <Button onClick={handleNext}>
          {isLast ? 'Finish' : 'Next'}
        </Button>
      </div>
      <div style={{ marginTop: 18, textAlign: 'center', color: '#aaa', fontSize: 13 }}>
        Step {currentStep + 1} of {steps.length}
      </div>
    </Modal>
  );
};

MultiStepModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      content: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
    })
  ).isRequired,
  onFinish: PropTypes.func,
  initialStep: PropTypes.number,
};

export default MultiStepModal;

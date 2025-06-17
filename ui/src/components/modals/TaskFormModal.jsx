import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../common/Modal'; // Assumes a generic Modal component exists
import Button from '../common/Button'; // Assumes a generic Button component exists

/**
 * TaskFormModal - Modal for pulling a new task from the backlog and assigning it to an agent
 * Adapted from ai_dev_planning_workflow.html's #taskModal
 */
const TaskFormModal = ({ open, onClose, availableTasks = [], availableAgents = [], onPullTask }) => {
  const [selectedTask, setSelectedTask] = useState(availableTasks[0] || '');
  const [selectedAgent, setSelectedAgent] = useState(availableAgents[0] || '');

  const handlePullTask = () => {
    if (selectedTask && selectedAgent) {
      onPullTask(selectedTask, selectedAgent);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="🎯 Pull New Task">
      <p style={{ color: '#666', marginBottom: 20 }}>
        Select a task from the backlog to pull into your workflow
      </p>
      <div style={{ margin: '20px 0' }}>
        <label style={{ display: 'block', marginBottom: 10 }}>Available Tasks:</label>
        <select
          style={{ width: '100%', padding: 10, border: '2px solid #e9ecef', borderRadius: 8 }}
          value={selectedTask}
          onChange={e => setSelectedTask(e.target.value)}
        >
          {availableTasks.length === 0 ? (
            <option disabled>No tasks available</option>
          ) : (
            availableTasks.map((task, idx) => (
              <option key={idx} value={task}>
                {task}
              </option>
            ))
          )}
        </select>
      </div>
      <div style={{ margin: '20px 0' }}>
        <label style={{ display: 'block', marginBottom: 10 }}>Assign to Agent:</label>
        <select
          style={{ width: '100%', padding: 10, border: '2px solid #e9ecef', borderRadius: 8 }}
          value={selectedAgent}
          onChange={e => setSelectedAgent(e.target.value)}
        >
          {availableAgents.length === 0 ? (
            <option disabled>No agents available</option>
          ) : (
            availableAgents.map((agent, idx) => (
              <option key={idx} value={agent.value} disabled={agent.disabled}>
                {agent.label}
              </option>
            ))
          )}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 30 }}>
        <Button onClick={handlePullTask} disabled={!selectedTask || !selectedAgent}>
          ⬇ Pull Task
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

TaskFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  availableTasks: PropTypes.arrayOf(PropTypes.string),
  availableAgents: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
    })
  ),
  onPullTask: PropTypes.func.isRequired,
};

export default TaskFormModal;

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../common/Modal';
import Button from '../common/Button';

/**
 * SubtaskFormModal - Modal for creating a new subtask and optionally assigning it to an agent
 */
const SubtaskFormModal = ({ open, onClose, onCreateSubtask, availableAgents = [] }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(availableAgents[0] || '');

  const handleCreate = () => {
    if (title.trim()) {
      onCreateSubtask({ title, description, assignedTo: selectedAgent });
      setTitle('');
      setDescription('');
      setSelectedAgent(availableAgents[0] || '');
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="➕ Add Subtask">
      <div style={{ margin: '20px 0' }}>
        <label style={{ display: 'block', marginBottom: 10 }}>Subtask Title:</label>
        <input
          type="text"
          style={{ width: '100%', padding: 10, border: '2px solid #e9ecef', borderRadius: 8 }}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Enter subtask title"
        />
      </div>
      <div style={{ margin: '20px 0' }}>
        <label style={{ display: 'block', marginBottom: 10 }}>Description:</label>
        <textarea
          style={{ width: '100%', padding: 10, border: '2px solid #e9ecef', borderRadius: 8, minHeight: 60 }}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Add details (optional)"
        />
      </div>
      <div style={{ margin: '20px 0' }}>
        <label style={{ display: 'block', marginBottom: 10 }}>Assign to Agent:</label>
        <select
          style={{ width: '100%', padding: 10, border: '2px solid #e9ecef', borderRadius: 8 }}
          value={selectedAgent}
          onChange={e => setSelectedAgent(e.target.value)}
        >
          {availableAgents.length === 0 ? (
            <option value="" disabled>No agents available</option>
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
        <Button onClick={handleCreate} disabled={!title.trim()}>
          ➕ Create Subtask
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

SubtaskFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreateSubtask: PropTypes.func.isRequired,
  availableAgents: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
    })
  ),
};

export default SubtaskFormModal;

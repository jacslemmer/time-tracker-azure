import { useState, useEffect } from 'react';
import { Project } from '../types';

interface ProjectFormProps {
  project?: Project;
  onSave: (data: {
    name: string;
    clientName: string;
    hourlyRate: number;
    budget: number;
  }) => void;
  onClose: () => void;
}

export const ProjectForm = ({ project, onSave, onClose }: ProjectFormProps) => {
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [budget, setBudget] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setClientName(project.client_name);
      setHourlyRate(project.hourly_rate.toString());
      setBudget(project.budget.toString());
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !hourlyRate || !budget) {
      alert('Please fill in all required fields');
      return;
    }

    onSave({
      name,
      clientName,
      hourlyRate: parseFloat(hourlyRate),
      budget: parseFloat(budget),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{project ? 'Edit Project' : 'New Project'}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Client Name (optional)</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name"
            />
          </div>

          <div className="form-group">
            <label>Project Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="form-group">
            <label>Hourly Rate (R) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group">
            <label>Budget (R) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="action-buttons">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {project ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

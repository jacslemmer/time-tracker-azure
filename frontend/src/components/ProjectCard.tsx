import { useState, useEffect } from 'react';
import { Project } from '../types';
import { formatTime, formatHours, formatCurrency, getBudgetStatus } from '../utils/timeFormat';
import * as api from '../services/api';

interface ProjectCardProps {
  project: Project;
  onUpdate: () => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onViewEntries: (project: Project) => void;
  onAddManual: (project: Project) => void;
}

export const ProjectCard = ({
  project,
  onUpdate,
  onEdit,
  onDelete,
  onViewEntries,
  onAddManual,
}: ProjectCardProps) => {
  const [currentSeconds, setCurrentSeconds] = useState(project.total_seconds);

  useEffect(() => {
    if (project.is_running && project.start_time) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - project.start_time!) / 1000);
        setCurrentSeconds(project.total_seconds + elapsed);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCurrentSeconds(project.total_seconds);
    }
  }, [project.is_running, project.start_time, project.total_seconds]);

  const handleTimer = async () => {
    try {
      if (project.is_running) {
        await api.stopTimer(project.id);
      } else {
        await api.startTimer(project.id);
      }
      onUpdate();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Timer action failed');
    }
  };

  const totalHours = currentSeconds / 3600;
  const hourlyRate = typeof project.hourly_rate === 'string' ? parseFloat(project.hourly_rate) : project.hourly_rate;
  const billing = totalHours * hourlyRate;
  const budgetStatus = getBudgetStatus(billing, project.budget);

  return (
    <div className="card project-card">
      <div className="project-header">
        <div className="project-info">
          {project.client_name && <div className="project-client">{project.client_name}</div>}
          <h3>{project.name}</h3>
        </div>
        <div className="project-actions">
          <button className="btn btn-tiny btn-secondary" onClick={() => onEdit(project)}>
            Edit
          </button>
          <button className="btn btn-tiny btn-danger" onClick={() => onDelete(project)}>
            Delete
          </button>
        </div>
      </div>

      <div className="timer-display">{formatTime(currentSeconds)}</div>

      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">Total Hours</div>
          <div className="stat-value">{formatHours(currentSeconds)}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Hourly Rate</div>
          <div className="stat-value">{formatCurrency(project.hourly_rate)}</div>
        </div>
      </div>

      <div className={`budget-alert ${budgetStatus}`}>
        <div className="stat-label">Billing</div>
        <div className="stat-value">
          {formatCurrency(billing)} / {formatCurrency(project.budget)}
        </div>
      </div>

      <div className="action-buttons">
        <button
          className={`btn ${project.is_running ? 'btn-danger' : 'btn-success'}`}
          onClick={handleTimer}
        >
          {project.is_running ? 'Stop' : 'Start'}
        </button>
        <button className="btn btn-secondary" onClick={() => onAddManual(project)}>
          Add Hours
        </button>
        <button className="btn btn-primary" onClick={() => onViewEntries(project)}>
          View Entries
        </button>
      </div>
    </div>
  );
};

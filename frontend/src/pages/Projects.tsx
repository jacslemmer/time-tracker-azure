import { useState, useEffect } from 'react';
import { Project } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectForm } from '../components/ProjectForm';
import * as api from '../services/api';

export const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [showManualEntry, setShowManualEntry] = useState<Project | undefined>();
  const [manualHours, setManualHours] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (data: any) => {
    try {
      await api.createProject(data);
      setShowForm(false);
      loadProjects();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create project');
    }
  };

  const handleUpdateProject = async (data: any) => {
    if (!editingProject) return;

    try {
      await api.updateProject(editingProject.id, data);
      setShowForm(false);
      setEditingProject(undefined);
      loadProjects();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update project');
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm('Are you sure you want to delete this project? All time entries will be lost.')) {
      return;
    }

    try {
      await api.deleteProject(project.id);
      loadProjects();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete project');
    }
  };

  const handleAddManualEntry = async () => {
    if (!showManualEntry) return;

    const hours = parseFloat(manualHours);
    if (isNaN(hours) || hours < 0.01) {
      alert('Please enter a valid number of hours (minimum 0.01)');
      return;
    }

    try {
      await api.addManualEntry(showManualEntry.id, hours);
      setShowManualEntry(undefined);
      setManualHours('');
      loadProjects();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add manual entry');
    }
  };

  const handleEdit = (project: Project) => {
    if (project.is_running) {
      alert('Cannot edit while timer is running');
      return;
    }
    setEditingProject(project);
    setShowForm(true);
  };

  if (loading) {
    return <div className="loading">Loading projects...</div>;
  }

  return (
    <>
      <div className="container">
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + New Project
        </button>

        {projects.length === 0 ? (
          <div className="empty-state">
            <h2>No projects yet</h2>
            <p>Create your first project to start tracking time</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onUpdate={loadProjects}
                onEdit={handleEdit}
                onDelete={handleDeleteProject}
                onViewEntries={() => {}}
                onAddManual={setShowManualEntry}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ProjectForm
          project={editingProject}
          onSave={editingProject ? handleUpdateProject : handleCreateProject}
          onClose={() => {
            setShowForm(false);
            setEditingProject(undefined);
          }}
        />
      )}

      {showManualEntry && (
        <div className="modal-overlay" onClick={() => setShowManualEntry(undefined)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Manual Hours</h2>
              <button className="close-btn" onClick={() => setShowManualEntry(undefined)}>
                ×
              </button>
            </div>

            <div className="form-group">
              <label>Hours</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={manualHours}
                onChange={(e) => setManualHours(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="action-buttons">
              <button className="btn btn-secondary" onClick={() => setShowManualEntry(undefined)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddManualEntry}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

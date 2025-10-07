import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Login } from './pages/Login';
import { Projects } from './pages/Projects';
import { Reports } from './pages/Reports';
import './styles/App.css';

function App() {
  const { isAuthenticated, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'projects' | 'reports'>('projects');

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>⏱️ Time Tracker</h1>
        <p>Welcome, {user?.email}</p>
        <button className="btn btn-secondary btn-small" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Projects
        </button>
        <button
          className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
      </div>

      {activeTab === 'projects' ? <Projects /> : <Reports />}
    </div>
  );
}

export default App;

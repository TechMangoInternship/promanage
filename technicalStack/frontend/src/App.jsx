import React, { useState, useEffect } from 'react';
import TechnicalStackGrid from './components/TechnicalStackGrid';

const getInitialTheme = () => {
  try { return localStorage.getItem('rg-theme') || 'dark'; } catch { return 'dark'; }
};

function App() {
  const params = new URLSearchParams(window.location.search);
  const projectName = params.get('projectName') || null;
  const version = params.get('version') || null;
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('rg-theme', theme); } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <div className="rg-page">
      <header className="rg-header">
        <div className="rg-header-inner">
          <div className="rg-title-block">
            <span className="rg-eyebrow">TECHNICAL STACK</span>
            <h1 className="rg-title">Technical Stack</h1>
            {projectName && <p className="rg-subtitle">{projectName} · {version || 'Unnamed'}</p>}
          </div>
          <div className="rg-header-actions">
            <button className="rg-theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      </header>
      <main className="rg-main">
        <TechnicalStackGrid projectName={projectName} version={version} />
        {projectName && (
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <a
              href={`http://localhost:3000?projectName=${encodeURIComponent(projectName)}&version=${encodeURIComponent(version || '')}`}
              className="rg-btn rg-btn-primary"
              style={{ textDecoration: 'none', display: 'inline-flex' }}
            >
              ← Return to Project Page
            </a>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

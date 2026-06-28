import React, { useState, useEffect, useRef, useCallback } from 'react';
import featureApi from '../services/featureApi';
import './Grid.css';

const INITIAL_COLUMNS = [
  { key: 'platform', label: 'Platform', type: 'input' },
  { key: 'module', label: 'Module', type: 'input' },
  { key: 'subModule', label: 'Sub Module', type: 'input' },
  { key: 'question', label: 'Question', type: 'textarea' },
  { key: 'answer', label: 'Answer', type: 'textarea' },
  { key: 'effortsHours', label: 'Efforts/Hours', type: 'input' }
];

export default function FeatureGrid({ projectName, version }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [error, setError] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [toast, setToast] = useState(null);
  const menuRef = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const data = await featureApi.getAll(projectName, version);
      setRows(data);
      setError(null);
    } catch (err) {
      setError('Failed to load grid data. Is the backend running?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectName, version]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setContextMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAddRow = async () => {
    try {
      const payload = {
        projectName,
        version,
        platform: '',
        module: '',
        subModule: '',
        question: '',
        answer: '',
        effortsHours: ''
      };
      const newRow = await featureApi.create(payload);
      setRows(prev => [...prev, newRow]);
      showToast('Row added');
    } catch {
      showToast('Failed to add row', 'error');
    }
  };

  const handleInsertAfter = async (afterIndex) => {
    setContextMenu(null);
    try {
      const payload = {
        projectName,
        version,
        platform: '',
        module: '',
        subModule: '',
        question: '',
        answer: '',
        effortsHours: ''
      };
      await featureApi.create(payload);
      const data = await featureApi.getAll(projectName, version);
      setRows(data);
      showToast('Row inserted');
    } catch {
      showToast('Failed to insert row', 'error');
    }
  };

  const handleInsertBefore = (rowIndex) => handleInsertAfter(rowIndex - 1);

  const handleUpdateRow = async (id, field, value) => {
    setSaving(prev => ({ ...prev, [id]: true }));
    try {
      const updatedRow = await featureApi.update(id, { [field]: value });
      setRows(prev => prev.map(row => (row._id === id ? updatedRow : row)));
    } catch {
      showToast('Save failed', 'error');
      fetchRows();
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleDeleteRow = async (id) => {
    setContextMenu(null);
    if (!window.confirm('Delete this row?')) return;
    try {
      await featureApi.remove(id);
      setRows(prev => prev.filter(row => row._id !== id));
      showToast('Row deleted');
    } catch {
      showToast('Failed to delete row', 'error');
    }
  };

  const handleRowRightClick = (e, rowIndex) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, rowIndex });
  };

  if (loading) {
    return (
      <div className="rg-loading">
        <div className="rg-spinner" />
        <span>Connecting to database…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rg-error">
        <span className="rg-error-icon">!</span>
        <p>{error}</p>
        <button onClick={fetchRows}>Retry</button>
      </div>
    );
  }

  return (
    <>
      <div className="rg-table-wrap">
        <table className="rg-table">
          <thead>
            <tr>
              <th className="rg-th" style={{ width: 44, textAlign: 'center' }}>#</th>
              {INITIAL_COLUMNS.map(col => (
                <th key={col.key} className="rg-th">
                  {col.label}
                </th>
              ))}
              <th className="rg-th rg-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={INITIAL_COLUMNS.length + 2} className="rg-empty">
                  <div className="rg-empty-inner">
                    <span className="rg-empty-icon" />
                    <p>No features found.</p>
                    <button className="rg-btn rg-btn-primary" onClick={handleAddRow}>
                      Add first row
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row._id}
                  className={`rg-row ${saving[row._id] ? 'rg-row--saving' : ''}`}
                  onContextMenu={(e) => handleRowRightClick(e, index)}
                >
                  <td className="rg-td rg-row-num">{index + 1}</td>
                  {INITIAL_COLUMNS.map(col => (
                    <td key={`${row._id}-${col.key}`} className="rg-td">
                      <GridCell
                        value={row[col.key] || ''}
                        rowId={row._id}
                        field={col.key}
                        type={col.type}
                        onUpdate={handleUpdateRow}
                      />
                    </td>
                  ))}
                  <td className="rg-td rg-td-actions">
                    <div className="rg-actions">
                      <button
                        className="rg-icon-btn rg-icon-btn--insert"
                        title="Insert row below"
                        onClick={() => handleInsertAfter(index)}
                      >
                        +
                      </button>
                      <button
                        className="rg-icon-btn rg-icon-btn--delete"
                        title="Delete row"
                        onClick={() => handleDeleteRow(row._id)}
                      >
                        X
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="rg-bottom-bar">
          <button className="rg-add-row-btn" onClick={handleAddRow}>
            <span>+</span> Add row
          </button>
        </div>
      )}

      {contextMenu && (
        <div
          className="rg-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          ref={menuRef}
        >
          <button onClick={() => handleInsertBefore(contextMenu.rowIndex)}>
            Insert row above
          </button>
          <button onClick={() => handleInsertAfter(contextMenu.rowIndex)}>
            Insert row below
          </button>
          <div className="rg-menu-divider" />
          <button
            className="rg-menu-danger"
            onClick={() => handleDeleteRow(rows[contextMenu.rowIndex]._id)}
          >
            Delete row
          </button>
        </div>
      )}

      {toast && (
        <div className={`rg-toast rg-toast--${toast.type}`}>{toast.msg}</div>
      )}
    </>
  );
}

function GridCell({ value, field, rowId, type, onUpdate }) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (localValue !== value) {
      onUpdate(rowId, field, localValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.target.blur();
    }
    if (e.key === 'Escape') {
      setLocalValue(value);
      e.target.blur();
    }
  };

  if (type === 'textarea') {
    return (
      <textarea
        className="rg-cell-textarea"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="—"
      />
    );
  }

  return (
    <input
      className="rg-input"
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="—"
    />
  );
}

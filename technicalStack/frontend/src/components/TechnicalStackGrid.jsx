import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { gridService } from '../services/api';

const DEFAULT_GRID_NAME = 'Technical Stack';

const INITIAL_COLUMNS = [
  'Technical Stack',
  'Version',
  'Description',
  'Proficiency'
];

const TechnicalStackGrid = ({ projectName, version }) => {
  const GRID_NAME = (projectName && version)
    ? `${DEFAULT_GRID_NAME} - ${projectName}/${version}`
    : DEFAULT_GRID_NAME;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    fetchRows();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setContextMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const data = await gridService.getRows(GRID_NAME);
      setRows(data);
      setError(null);
    } catch (err) {
      setError('Failed to load grid data. Is the backend running?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleAddRow = async () => {
    try {
      const emptyData = INITIAL_COLUMNS.reduce((acc, col) => {
        acc[col] = '';
        return acc;
      }, {});
      const newRow = await gridService.addRow(GRID_NAME, emptyData);
      setRows(prev => [...prev, newRow]);
      showToast('Row added');
    } catch {
      showToast('Failed to add row', 'error');
    }
  };

  const handleCellBlur = async (id, col, value) => {
    const prevVal = rows.find(r => r._id === id)?.data?.[col] || '';
    if (value === prevVal) return;
    try {
      const updatedData = { ...rows.find(r => r._id === id).data, [col]: value };
      const updatedRow = await gridService.updateRow(id, updatedData);
      setRows(prev => prev.map(row => (row._id === id ? updatedRow : row)));
      showToast('Saved');
    } catch {
      showToast('Save failed', 'error');
      fetchRows();
    }
  };

  const handleDeleteRow = async (id) => {
    setContextMenu(null);
    if (!window.confirm('Delete this row?')) return;
    try {
      await gridService.deleteRow(id);
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

  const handleInsertAfter = async (afterIndex) => {
    setContextMenu(null);
    try {
      const emptyData = INITIAL_COLUMNS.reduce((acc, col) => {
        acc[col] = '';
        return acc;
      }, {});
      await gridService.addRow(GRID_NAME, emptyData);
      const data = await gridService.getRows(GRID_NAME);
      setRows(data);
      showToast('Row inserted');
    } catch {
      showToast('Failed to insert row', 'error');
    }
  };

  const handleInsertBefore = (rowIndex) => handleInsertAfter(rowIndex - 1);

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
              {INITIAL_COLUMNS.map(col => (
                <th key={col} className="rg-th">{col}</th>
              ))}
              <th className="rg-th rg-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={INITIAL_COLUMNS.length + 1} className="rg-empty">
                  <div className="rg-empty-inner">
                    <span className="rg-empty-icon" />
                    <p>Grid is empty.</p>
                    <button className="rg-btn rg-btn-primary" onClick={handleAddRow}>
                      Add first row
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr
                  key={row._id}
                  className="rg-row"
                  onContextMenu={(e) => handleRowRightClick(e, rowIndex)}
                >
                  {INITIAL_COLUMNS.map(col => (
                    <td key={`${row._id}-${col}`} className="rg-td">
                      <input
                        className="rg-input"
                        type="text"
                        defaultValue={row.data?.[col] || ''}
                        placeholder="—"
                        onBlur={(e) => handleCellBlur(row._id, col, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="rg-td rg-td-actions">
                    <div className="rg-actions">
                      <button
                        className="rg-icon-btn rg-icon-btn--insert"
                        title="Insert row below"
                        onClick={() => handleInsertAfter(rowIndex)}
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
};

export default TechnicalStackGrid;

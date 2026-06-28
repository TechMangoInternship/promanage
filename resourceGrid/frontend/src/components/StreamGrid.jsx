import React, { useState, useEffect, useRef, useCallback } from 'react';
import streamApi from '../services/streamApi';
import './Grid.css';

export default function StreamGrid({ projectName, version }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [error, setError] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [toast, setToast] = useState(null);
  const [totalFeatureHours, setTotalFeatureHours] = useState(0);
  const menuRef = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const fetchTotalHours = useCallback(async () => {
    const total = await streamApi.fetchTotalFeatureHours(projectName, version);
    setTotalFeatureHours(total);
  }, [projectName, version]);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      // Seed default rows first
      await streamApi.seed(projectName, version);
      const data = await streamApi.getAll(projectName, version);
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
    fetchTotalHours();
  }, [fetchRows, fetchTotalHours]);

  // Refresh total hours periodically (every 30s) to pick up Feature Grid changes
  useEffect(() => {
    const interval = setInterval(fetchTotalHours, 30000);
    return () => clearInterval(interval);
  }, [fetchTotalHours]);

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
        streamName: '',
        percentage: 0
      };
      const newRow = await streamApi.create(payload);
      setRows(prev => [...prev, newRow]);
      showToast('Stream added');
    } catch {
      showToast('Failed to add stream', 'error');
    }
  };

  const handleUpdateRow = async (id, field, value) => {
    setSaving(prev => ({ ...prev, [id]: true }));
    try {
      const updatedRow = await streamApi.update(id, { [field]: value });
      setRows(prev => prev.map(row => (row._id === id ? updatedRow : row)));
    } catch (err) {
      const msg = err.response?.data?.message || 'Save failed';
      showToast(msg, 'error');
      fetchRows();
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleDeleteRow = async (id) => {
    setContextMenu(null);
    if (!window.confirm('Delete this stream?')) return;
    try {
      await streamApi.remove(id);
      setRows(prev => prev.filter(row => row._id !== id));
      showToast('Stream deleted');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete stream';
      showToast(msg, 'error');
    }
  };

  const handleRowRightClick = (e, rowIndex) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, rowIndex });
  };

  const computeValue = (percentage) => {
    const pct = parseFloat(percentage) || 0;
    return ((pct / 100) * totalFeatureHours).toFixed(2);
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
      {/* Total Feature Hours summary */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 18px',
        marginBottom: 16,
        background: 'var(--glass)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-md)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>
        <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
          Total Feature Hours:
        </span>
        <span style={{
          fontSize: 16,
          fontWeight: 700,
          background: 'var(--accent-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {totalFeatureHours}
        </span>
        <button
          onClick={fetchTotalHours}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            color: 'var(--text-2)',
            fontSize: 12,
            fontWeight: 500,
            padding: '4px 12px',
            cursor: 'pointer',
            fontFamily: 'var(--font)',
            transition: 'all var(--t-fast)',
          }}
          title="Refresh total feature hours"
        >
          ↻ Refresh
        </button>
      </div>

      <div className="rg-table-wrap">
        <table className="rg-table">
          <thead>
            <tr>
              <th className="rg-th" style={{ width: 44, textAlign: 'center' }}>#</th>
              <th className="rg-th">Streams</th>
              <th className="rg-th" style={{ width: 130 }}>Percentage</th>
              <th className="rg-th" style={{ width: 130 }}>Value</th>
              <th className="rg-th rg-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="rg-empty">
                  <div className="rg-empty-inner">
                    <span className="rg-empty-icon" />
                    <p>No streams found.</p>
                    <button className="rg-btn rg-btn-primary" onClick={handleAddRow}>
                      Add first stream
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

                  {/* Stream Name */}
                  <td className="rg-td">
                    {row.isDefault ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '0 12px',
                        height: 34,
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text)',
                        opacity: 0.85,
                      }}>
                        {row.streamName}
                        <span style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          padding: '2px 6px',
                          borderRadius: 'var(--r-sm)',
                          background: 'var(--accent-glow)',
                          color: 'var(--accent)',
                          textTransform: 'uppercase',
                        }}>
                          Default
                        </span>
                      </span>
                    ) : (
                      <GridCell
                        value={row.streamName || ''}
                        rowId={row._id}
                        field="streamName"
                        type="input"
                        onUpdate={handleUpdateRow}
                      />
                    )}
                  </td>

                  {/* Percentage */}
                  <td className="rg-td">
                    <PercentageCell
                      value={row.percentage}
                      rowId={row._id}
                      onUpdate={handleUpdateRow}
                    />
                  </td>

                  {/* Value (computed, read-only) */}
                  <td className="rg-td">
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0 12px',
                      height: 34,
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-accent)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {computeValue(row.percentage)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="rg-td rg-td-actions">
                    <div className="rg-actions">
                      {!row.isDefault && (
                        <button
                          className="rg-icon-btn rg-icon-btn--delete"
                          title="Delete stream"
                          onClick={() => handleDeleteRow(row._id)}
                        >
                          X
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="rg-bottom-bar">
        <button className="rg-add-row-btn" onClick={handleAddRow}>
          <span>+</span> Add stream
        </button>
      </div>

      {contextMenu && (
        <div
          className="rg-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          ref={menuRef}
        >
          {!rows[contextMenu.rowIndex]?.isDefault && (
            <>
              <button
                className="rg-menu-danger"
                onClick={() => handleDeleteRow(rows[contextMenu.rowIndex]._id)}
              >
                Delete stream
              </button>
            </>
          )}
          {rows[contextMenu.rowIndex]?.isDefault && (
            <button disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}>
              Default streams cannot be deleted
            </button>
          )}
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

  return (
    <input
      className="rg-input"
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="Stream name…"
    />
  );
}

function PercentageCell({ value, rowId, onUpdate }) {
  const [localValue, setLocalValue] = useState(value ?? 0);

  useEffect(() => {
    setLocalValue(value ?? 0);
  }, [value]);

  const handleBlur = () => {
    const parsed = parseFloat(localValue) || 0;
    if (parsed !== (value ?? 0)) {
      onUpdate(rowId, 'percentage', parsed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur();
    }
    if (e.key === 'Escape') {
      setLocalValue(value ?? 0);
      e.target.blur();
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <input
        className="rg-input"
        type="number"
        min="0"
        max="100"
        step="0.01"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{ textAlign: 'right' }}
        placeholder="0"
      />
      <span style={{ color: 'var(--text-3)', fontSize: 13, fontWeight: 500 }}>%</span>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { useGrid } from '../../hooks/useGrid';
import gridApi from '../../api/gridApi';
import './Grid.css';

export default function Grid({ projectName, version }) {
  const {
    grid,
    rows,
    loading,
    error,
    savingRows,
    addRow,
    updateRow,
    deleteRow,
    retry,
    toasts,
    dismissToast,
  } = useGrid(projectName, version);

  const [contextMenu, setContextMenu] = useState(null);
  const [shareModal, setShareModal] = useState(null); // { links: [{query, shareUrl}], loading: bool }
  const [copiedIndex, setCopiedIndex] = useState(null);
  const menuRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setContextMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (shareModal && modalRef.current && !modalRef.current.contains(e.target))
        setShareModal(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [shareModal]);

  const handleRowRightClick = (e, rowIndex) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, rowIndex });
  };

  const handleDelete = (id) => {
    setContextMenu(null);
    if (!window.confirm('Delete this row?')) return;
    deleteRow(id);
  };

  const handleInsertAfter = (rowIndex) => {
    setContextMenu(null);
    addRow();
  };

  const handleInsertBefore = (rowIndex) => {
    setContextMenu(null);
    addRow();
  };

  const [shareUrl, setShareUrl] = useState(null);

  const handleGenerateLinks = async () => {
    if (!grid) return;
    setShareModal({ links: [], loading: true });
    try {
      const gridId = grid._id;
      const result = await gridApi.generateLinks(gridId);
      const data = result.data || {};
      setShareModal({ links: [], loading: false, singleUrl: data.shareUrl || null, queryCount: data.queryCount || 0 });
      setShareUrl(data.shareUrl || null);
    } catch (err) {
      setShareModal({ links: [], loading: false, error: err.message });
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedIndex(0);
      setTimeout(() => setCopiedIndex(null), 2000);
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedIndex(0);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  if (loading) {
    return (
      <div className="rg-loading">
        <div className="rg-spinner" />
        <span>Connecting to database…</span>
      </div>
    );
  }

  if (error && !grid) {
    return (
      <div className="rg-error">
        <span className="rg-error-icon">!</span>
        <p>{error}</p>
        <button onClick={retry}>Retry</button>
      </div>
    );
  }

  const columns = grid?.columns || [];

  return (
    <>
      <div className="rg-toolbar">
        <button className="rg-btn rg-btn-secondary rg-btn-share" onClick={handleGenerateLinks} disabled={!grid || rows.length === 0}>
          Generate Links
        </button>
      </div>

      <div className="rg-table-wrap">
        <table className="rg-table">
          <thead>
            <tr>
              <th className="rg-th" style={{ width: 44, textAlign: 'center' }}>#</th>
              {columns.map((col) => (
                <th key={col.key} className="rg-th">{col.label}</th>
              ))}
              <th className="rg-th rg-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="rg-empty">
                  <div className="rg-empty-inner">
                    <span className="rg-empty-icon" />
                    <p>No rows yet.</p>
                    <button className="rg-btn rg-btn-primary" onClick={addRow}>
                      Add first row
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const isSaving = savingRows.has(row._id);
                return (
                  <tr
                    key={row._id}
                    className={`rg-row ${isSaving ? 'rg-row--saving' : ''}`}
                    onContextMenu={(e) => handleRowRightClick(e, index)}
                  >
                    <td className="rg-td rg-row-num">{index + 1}</td>
                    {columns.map((col) => (
                      <td key={col.key} className="rg-td">
                        <GridCell
                          value={row.data?.[col.key] || ''}
                          rowId={row._id}
                          field={col.key}
                          onUpdate={updateRow}
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
                          onClick={() => handleDelete(row._id)}
                        >
                          X
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="rg-bottom-bar">
          <button className="rg-add-row-btn" onClick={addRow}>
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
            onClick={() => handleDelete(rows[contextMenu.rowIndex]._id)}
          >
            Delete row
          </button>
        </div>
      )}

      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rg-toast rg-toast--${t.type}`}
              onClick={() => dismissToast(t.id)}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}

      {/* ── Share Links Modal ───────────────────────────────────── */}
      {shareModal && (
        <div className="rg-modal-overlay">
          <div className="rg-modal" ref={modalRef}>
            <div className="rg-modal-header">
              <h2 className="rg-modal-title">Share Link</h2>
              <button className="rg-modal-close" onClick={() => setShareModal(null)}>X</button>
            </div>
            <div className="rg-modal-body">
              {shareModal.loading ? (
                <div className="rg-modal-loading">
                  <div className="rg-spinner" />
                  <span>Generating link…</span>
                </div>
              ) : shareModal.error ? (
                <div className="rg-modal-error">{shareModal.error}</div>
              ) : !shareModal.singleUrl ? (
                <div className="rg-modal-empty">No questions found to generate a link. Add rows with queries first.</div>
              ) : (
                <div className="rg-share-list">
                  <div className="rg-share-item">
                    <div className="rg-share-query">
                      <span className="rg-share-num">Link</span>
                      <span className="rg-share-text">Share this link to let others answer <strong>{shareModal.queryCount}</strong> question{shareModal.queryCount !== 1 ? 's' : ''}. All answers will auto-update in this grid.</span>
                    </div>
                    <div className="rg-share-url-row">
                      <input className="rg-input rg-share-input" type="text" value={shareModal.singleUrl} readOnly onClick={(e) => e.target.select()} />
                      <button
                        className={`rg-btn rg-btn-copy ${copiedIndex === 0 ? 'rg-btn-copied' : ''}`}
                        onClick={handleCopy}
                      >
                        {copiedIndex === 0 ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="rg-modal-footer">
              <button className="rg-btn rg-btn-primary" onClick={() => setShareModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function GridCell({ value, field, rowId, onUpdate }) {
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

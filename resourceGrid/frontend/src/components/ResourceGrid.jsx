import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  getAllResources,
  createResource,
  insertResource,
  updateCell,
  deleteResource,
} from "../services/api";
import { exportResources } from "../services/exportService";
import "./ResourceGrid.css";

const COLS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const FEATURES_API = "http://localhost:5006/api/features";

function getTotalHours(row) {
  let total = 0;
  for (let c = 1; c <= 12; c++) {
    const col = String(c);
    const val = row.columns?.[col];
    const num = parseFloat(val);
    if (!isNaN(num)) total += num;
  }
  return total;
}

function getCost(row) {
  const rate = parseFloat(row.rate) || 0;
  return getTotalHours(row) * rate;
}

export default function ResourceGrid({ projectName, version }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [error, setError] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [exportMenu, setExportMenu] = useState(false);
  const [toast, setToast] = useState(null);
  const [hoursValue, setHoursValue] = useState("");
  const [exporting, setExporting] = useState(false);
  const menuRef = useRef(null);
  const exportMenuRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getAllResources(projectName, version);
      setRows(data);
      // Fetch features to calculate total hours
      if (projectName && version) {
        try {
          const featuresRes = await axios.get(FEATURES_API, { params: { projectName, version } });
          const features = featuresRes.data;
          const total = features.reduce((sum, f) => {
            const hrs = parseFloat(f.effortsHours);
            return sum + (isNaN(hrs) ? 0 : hrs);
          }, 0);
          setHoursValue(total > 0 ? String(total) : "");
        } catch {
          // Features fetch failed silently
        }
      }
    }
    catch { setError("Failed to load data. Is the backend running?"); }
    finally { setLoading(false); }
  }, [projectName, version]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setContextMenu(null);
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) setExportMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };

  const handleAddRow = async () => {
    try { const { data } = await createResource({ resourceName: "", columns: {}, projectName, version }); setRows((prev) => [...prev, data]); showToast("Row added"); }
    catch { showToast("Failed to add row", "error"); }
  };

  const handleInsertAfter = async (afterIndex) => {
    setContextMenu(null);
    try { await insertResource({ afterIndex, resourceName: "", columns: {}, projectName, version }); const updated = await getAllResources(projectName, version); setRows(updated.data); showToast("Row inserted"); }
    catch { showToast("Failed to insert row", "error"); }
  };

  const handleInsertBefore = (rowIndex) => { setContextMenu(null); handleInsertAfter(rowIndex - 1); };

  const handleDeleteRow = async (id) => {
    setContextMenu(null);
    if (!window.confirm("Delete this row?")) return;
    try { await deleteResource(id); setRows((prev) => prev.filter((r) => r._id !== id)); showToast("Row deleted"); }
    catch { showToast("Failed to delete row", "error"); }
  };

  const handleCellBlur = async (id, col, value) => {
    setSaving((prev) => ({ ...prev, [id]: true }));
    try {
      await updateCell(id, col, value);
      setRows((prev) => prev.map((r) => {
        if (r._id !== id) return r;
        if (col === "resourceName") return { ...r, resourceName: value };
        if (col === "rate") return { ...r, rate: value };
        return { ...r, columns: { ...r.columns, [col]: value } };
      }));
    } catch { showToast("Save failed", "error"); }
    finally { setSaving((prev) => ({ ...prev, [id]: false })); }
  };

  const handleRowRightClick = (e, rowIndex) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, rowIndex }); };

  const getCellValue = (row, col) => {
    if (!row.columns) return "";
    if (typeof row.columns === "object" && !Array.isArray(row.columns)) return row.columns[col] ?? "";
    return "";
  };

  const handleExport = async (format) => {
    setExportMenu(false);
    setExporting(true);
    showToast("Exporting…");
    try {
      await exportResources(format, rows, projectName, version);
      showToast("Export complete!");
    } catch (err) {
      showToast("Export failed: " + (err.message || "Unknown error"), "error");
    }
    finally { setExporting(false); }
  };

  const totalHoursSum = rows.reduce((sum, r) => sum + getTotalHours(r), 0);
  const totalCostSum = rows.reduce((sum, r) => sum + getCost(r), 0);

  if (loading) return (<div className="rg-loading"><div className="rg-spinner" /><span>Connecting to database…</span></div>);
  if (error) return (<div className="rg-error"><span className="rg-error-icon">!</span><p>{error}</p><button onClick={loadData}>Retry</button></div>);

  return (
      <>
        <div className="rg-summary-row">
          <div className="rg-summary-item">
            <label className="rg-summary-label">Total Hours (from Features)</label>
            <input className="rg-input rg-summary-input" type="text" value={hoursValue} readOnly placeholder="—" />
          </div>
          <div className="rg-summary-item">
            <label className="rg-summary-label">Total Resource Hours</label>
            <span className="rg-summary-value">{totalHoursSum > 0 ? totalHoursSum.toFixed(1) : "—"}</span>
          </div>
          <div className="rg-summary-item">
            <label className="rg-summary-label">Total Cost</label>
            <span className="rg-summary-value rg-summary-value--cost">{totalCostSum > 0 ? `$${totalCostSum.toFixed(2)}` : "—"}</span>
          </div>
        </div>

        <div className="rg-table-wrap" style={{ marginTop: 12 }}>
          <table className="rg-table">
            <thead>
              <tr>
                <th className="rg-th rg-th-resource" style={{ width: 170 }}><span>Resource Name</span></th>
                {COLS.map((c) => (<th key={c} className="rg-th rg-th-col"><span>{c}</span></th>))}
                <th className="rg-th rg-th-total"><span>Total Hrs</span></th>
                <th className="rg-th rg-th-rate"><span>Rate</span></th>
                <th className="rg-th rg-th-cost"><span>Cost</span></th>
                <th className="rg-th rg-th-actions" style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={17} className="rg-empty"><div className="rg-empty-inner"><span className="rg-empty-icon" /><p>No resources yet.</p><button className="rg-btn rg-btn-primary" onClick={handleAddRow}>Add first resource</button></div></td></tr>
              ) : (
                rows.map((row, rowIndex) => {
                  const totalHrs = getTotalHours(row);
                  const cost = getCost(row);
                  return (
                  <tr key={row._id} className={`rg-row ${saving[row._id] ? "rg-row--saving" : ""}`} onContextMenu={(e) => handleRowRightClick(e, rowIndex)}>
                    <td className="rg-td rg-td-resource"><input className="rg-input rg-input-resource" type="text" defaultValue={row.resourceName || ""} placeholder="Resource name…" onBlur={(e) => handleCellBlur(row._id, "resourceName", e.target.value)} /></td>
                    {COLS.map((col) => (<td key={col} className="rg-td"><input className="rg-input" type="text" defaultValue={getCellValue(row, col)} placeholder="—" onBlur={(e) => handleCellBlur(row._id, col, e.target.value)} /></td>))}
                    <td className="rg-td rg-td-total"><span className={`rg-cell-total ${totalHrs > 0 ? "rg-cell-total--has" : ""}`}>{totalHrs > 0 ? totalHrs.toFixed(1) : "—"}</span></td>
                    <td className="rg-td rg-td-rate"><input className="rg-input rg-input-rate" type="text" defaultValue={row.rate || ""} placeholder="$/hr" onBlur={(e) => handleCellBlur(row._id, "rate", e.target.value)} /></td>
                    <td className="rg-td rg-td-cost"><span className={`rg-cell-cost ${cost > 0 ? "rg-cell-cost--has" : ""}`}>{cost > 0 ? `$${cost.toFixed(2)}` : "—"}</span></td>
                    <td className="rg-td rg-td-actions">
                      <div className="rg-actions">
                        <button className="rg-icon-btn rg-icon-btn--insert" title="Insert row below" onClick={() => handleInsertAfter(rowIndex)}>+</button>
                        <button className="rg-icon-btn rg-icon-btn--delete" title="Delete row" onClick={() => handleDeleteRow(row._id)}>X</button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {rows.length > 0 && (<div className="rg-bottom-bar"><button className="rg-add-row-btn" onClick={handleAddRow}><span>+</span> Add row</button></div>)}
      {contextMenu && (<div className="rg-context-menu" style={{ top: contextMenu.y, left: contextMenu.x }} ref={menuRef}>
        <button onClick={() => handleInsertBefore(contextMenu.rowIndex)}>Insert row above</button>
        <button onClick={() => handleInsertAfter(contextMenu.rowIndex)}>Insert row below</button>
        <div className="rg-menu-divider" />
        <button className="rg-menu-danger" onClick={() => handleDeleteRow(rows[contextMenu.rowIndex]._id)}>Delete row</button>
      </div>)}

      {/* Export button in the App header would show it; here we render it inside the component */}
      <div className="rg-export-dropdown" ref={exportMenuRef}>
        <button className="rg-btn rg-btn-primary rg-export-trigger" onClick={() => setExportMenu((prev) => !prev)} disabled={exporting}>
          <span className="rg-btn-icon">{exporting ? "⏳" : "⬇"}</span> {exporting ? "Exporting…" : "Export"}
        </button>
        {exportMenu && (
          <div className="rg-export-menu">
            <button className="rg-export-option" onClick={() => handleExport("word-existing")}>
              <span className="rg-export-icon">📄</span>
              <span className="rg-export-label">Word</span>
              <span className="rg-export-badge">Existing</span>
            </button>
            <button className="rg-export-option" onClick={() => handleExport("word-new")}>
              <span className="rg-export-icon">📄</span>
              <span className="rg-export-label">Word</span>
              <span className="rg-export-badge">New</span>
            </button>
            <button className="rg-export-option" onClick={() => handleExport("excel")}>
              <span className="rg-export-icon">📊</span>
              <span className="rg-export-label">Excel</span>
            </button>
            <button className="rg-export-option" onClick={() => handleExport("pdf")}>
              <span className="rg-export-icon">📕</span>
              <span className="rg-export-label">PDF</span>
            </button>
          </div>
        )}
      </div>

      {toast && <div className={`rg-toast rg-toast--${toast.type}`}>{toast.msg}</div>}
    </>
  );
}

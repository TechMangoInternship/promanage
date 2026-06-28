import { useState, useEffect, useCallback, useRef } from 'react';
import gridApi from '../api/gridApi';

/**
 * Custom hook for managing grid state and CRUD operations.
 * Provides auto-save with debounce, optimistic updates, and search.
 */
export function useGrid(projectName, version) {
  const getGridName = () => {
    if (projectName && version) {
      return `Queries and Responses - ${projectName}/${version}`;
    }
    return undefined; // use default
  };
  const [grid, setGrid] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingRows, setSavingRows] = useState(new Set());
  const [toasts, setToasts] = useState([]);

  const debounceTimers = useRef({});
  const gridIdRef = useRef(null);

  // Add a toast notification
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initialize: seed grid and fetch data
  const initGrid = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Seed version-scoped grid (idempotent)
      const seedResult = await gridApi.seedGrid(getGridName());
      const gridId = seedResult.data._id;
      gridIdRef.current = gridId;

      // Fetch grid with rows
      const result = await gridApi.getGrid(gridId);
      setGrid(result.data.grid);
      setRows(result.data.rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initGrid();
    return () => {
      // Cleanup debounce timers
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, [initGrid]);

  // Search/filter rows
  const fetchRows = useCallback(async (search = '') => {
    if (!gridIdRef.current) return;
    try {
      const result = await gridApi.getRows(gridIdRef.current, { search });
      setRows(result.data.rows);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Debounced search
  const handleSearch = useCallback(
    (term) => {
      setSearchTerm(term);
      if (debounceTimers.current.search) {
        clearTimeout(debounceTimers.current.search);
      }
      debounceTimers.current.search = setTimeout(() => {
        fetchRows(term);
      }, 300);
    },
    [fetchRows]
  );

  // Add a new row
  const addRow = useCallback(async () => {
    if (!gridIdRef.current) return;
    try {
      const result = await gridApi.createRow(gridIdRef.current);
      setRows((prev) => [...prev, result.data]);
      addToast('Row added');
    } catch (err) {
      setError(err.message);
      addToast('Failed to add row', 'error');
    }
  }, [addToast]);

  // Update a row with debounced auto-save
  const updateRow = useCallback(
    (rowId, field, value) => {
      // Optimistic update
      setRows((prev) =>
        prev.map((row) =>
          row._id === rowId
            ? { ...row, data: { ...row.data, [field]: value } }
            : row
        )
      );

      // Debounce the API call
      if (debounceTimers.current[rowId]) {
        clearTimeout(debounceTimers.current[rowId]);
      }

      debounceTimers.current[rowId] = setTimeout(async () => {
        try {
          setSavingRows((prev) => new Set(prev).add(rowId));
          await gridApi.updateRow(rowId, { [field]: value });
          addToast('Auto-saved');
        } catch (err) {
          // Rollback: refetch all rows
          addToast('Save failed — retrying…', 'error');
          if (gridIdRef.current) {
            const result = await gridApi.getGrid(gridIdRef.current);
            setRows(result.data.rows);
          }
        } finally {
          setSavingRows((prev) => {
            const next = new Set(prev);
            next.delete(rowId);
            return next;
          });
        }
      }, 500);
    },
    [addToast]
  );

  // Delete a row
  const deleteRow = useCallback(
    async (rowId) => {
      // Optimistic removal
      const previousRows = rows;
      setRows((prev) => prev.filter((row) => row._id !== rowId));

      try {
        await gridApi.deleteRow(rowId);
        addToast('Row deleted');
      } catch (err) {
        // Rollback
        setRows(previousRows);
        addToast('Failed to delete row', 'error');
      }
    },
    [rows, addToast]
  );

  // Retry on error
  const retry = useCallback(() => {
    setError(null);
    initGrid();
  }, [initGrid]);

  return {
    grid,
    rows,
    loading,
    error,
    searchTerm,
    savingRows,
    toasts,
    addRow,
    updateRow,
    deleteRow,
    handleSearch,
    retry,
    dismissToast,
  };
}

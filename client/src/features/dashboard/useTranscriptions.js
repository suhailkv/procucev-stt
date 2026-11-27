import { useCallback, useEffect, useState } from 'react';
import { transcriptionsApi } from '../../lib/api.js';

const LIMIT = 10;

export function useTranscriptions(refreshKey) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await transcriptionsApi.list({ q: debounced, page, limit: LIMIT }));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debounced, page]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const create = async (body) => {
    await transcriptionsApi.create({ ...body, source: 'manual' });
    setPage(1);
    await load();
  };
  const update = async (id, body) => {
    await transcriptionsApi.update(id, body);
    await load();
  };
  const remove = async (id) => {
    try {
      await transcriptionsApi.remove(id);
      // Deleted the last item on this page: go back one page.
      if (data.items.length === 1 && page > 1) setPage(page - 1);
      else await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return { query, setQuery, page, setPage, data, loading, error, create, update, remove };
}

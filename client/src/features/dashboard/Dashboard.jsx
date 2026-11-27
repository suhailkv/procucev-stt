import { useState } from 'react';
import EditorDialog from './EditorDialog.jsx';
import TranscriptionCard from './TranscriptionCard.jsx';
import { useTranscriptions } from './useTranscriptions.js';

export default function Dashboard({ refreshKey }) {
  const t = useTranscriptions(refreshKey);
  const [editing, setEditing] = useState(null);
  const { items, total, totalPages } = t.data;

  return (
    <section className="dashboard">
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search transcriptions…"
          value={t.query}
          onChange={(e) => t.setQuery(e.target.value)}
          aria-label="Search transcriptions"
        />
        <button type="button" className="btn primary" onClick={() => setEditing({})}>
          + New
        </button>
      </div>

      <p className="count">
        {t.loading ? 'Loading…' : `${total} transcription${total === 1 ? '' : 's'}`}
      </p>
      {t.error && <p className="banner error">{t.error}</p>}

      {!t.loading && items.length === 0 && (
        <div className="empty">
          {t.query ? 'No transcriptions match your search.' : 'No transcriptions yet — record one or add it manually.'}
        </div>
      )}

      <div className="cards">
        {items.map((item) => (
          <TranscriptionCard key={item.id} item={item} onEdit={setEditing} onDelete={(i) => t.remove(i.id)} />
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="pager" aria-label="Pagination">
          <button type="button" className="btn ghost" disabled={t.page <= 1} onClick={() => t.setPage(t.page - 1)}>
            ← Prev
          </button>
          <span>
            Page {t.page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn ghost"
            disabled={t.page >= totalPages}
            onClick={() => t.setPage(t.page + 1)}
          >
            Next →
          </button>
        </nav>
      )}

      {editing && (
        <EditorDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(body) => (editing.id ? t.update(editing.id, body) : t.create(body))}
        />
      )}
    </section>
  );
}

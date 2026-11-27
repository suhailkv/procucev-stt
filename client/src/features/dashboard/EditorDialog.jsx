import { useEffect, useRef, useState } from 'react';

export default function EditorDialog({ initial, onSubmit, onClose }) {
  const ref = useRef(null);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(initial?.id);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = { content };
      if (title.trim() || isEdit) data.title = title;
      await onSubmit(data);
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <dialog ref={ref} className="editor" onClose={onClose}>
      <form onSubmit={submit}>
        <h2>{isEdit ? 'Edit transcription' : 'New transcription'}</h2>
        <label>
          Title {!isEdit && <small>(optional — taken from the text if empty)</small>}
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
        </label>
        <label>
          Text
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} required />
        </label>
        {error && <p className="banner error">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </dialog>
  );
}

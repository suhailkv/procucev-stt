import ConfirmButton from '../../components/ConfirmButton.jsx';
import SpeakButton from '../../components/SpeakButton.jsx';
import { formatDate, formatDuration, languageLabel } from '../../lib/format.js';

export default function TranscriptionCard({ item, onEdit, onDelete }) {
  return (
    <article className="card">
      <header>
        <h3>{item.title}</h3>
        <span className={`tag ${item.source}`}>{item.source === 'live' ? 'Recorded' : 'Typed'}</span>
      </header>
      <p className="card-content">{item.content}</p>
      <footer>
        <span className="meta">
          {formatDate(item.createdAt)} · {languageLabel(item.language)}
          {item.durationMs != null && ` · ${formatDuration(item.durationMs)}`}
        </span>
        <div className="card-actions">
          <SpeakButton text={item.content} />
          <button type="button" className="btn ghost" onClick={() => onEdit(item)}>
            Edit
          </button>
          <ConfirmButton onConfirm={() => onDelete(item)} confirmLabel="Delete?">
            Delete
          </ConfirmButton>
        </div>
      </footer>
    </article>
  );
}

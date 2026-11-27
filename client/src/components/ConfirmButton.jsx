import { useEffect, useState } from 'react';

export default function ConfirmButton({ onConfirm, children, confirmLabel = 'Confirm?' }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return undefined;
    const id = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(id);
  }, [armed]);

  return (
    <button
      type="button"
      className={`btn ${armed ? 'danger' : 'ghost'}`}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}

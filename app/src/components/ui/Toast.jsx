import { useStore } from '../../store';

export default function ToastContainer() {
  const toasts = useStore(s => s.toasts);
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'ok' && <span>✓</span>}
          {t.type === 'err' && <span>✕</span>}
          {t.type === 'info' && <span>ℹ</span>}
          {t.message}
        </div>
      ))}
    </div>
  );
}

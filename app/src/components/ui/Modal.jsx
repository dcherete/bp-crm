import { useEffect } from 'react';

export default function Modal({ title, size = '', onClose, footer, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal${size ? ' modal-' + size : ''}`}>
        <div className="modal-hd">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="modal-bd">{children}</div>
        {footer && <div className="modal-ft">{footer}</div>}
      </div>
    </div>
  );
}

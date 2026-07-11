import { useState } from 'react';
import { useStore } from '../../../../store';
import Modal from '../../../../components/ui/Modal';
import { Empty } from '../../../../components/ui/Loading';

const fdate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '';

function TemplateForm({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [subject, setSubject] = useState(initial?.subject || '');
  const [body, setBody] = useState(initial?.body || '');
  const [preview, setPreview] = useState(false);

  return (
    <Modal
      title={initial ? 'Editar Template' : 'Novo Template'}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => {
            if (!name) return;
            onSave({ name, subject, body, updatedAt: new Date().toISOString() });
          }}>Salvar</button>
        </>
      }
    >
      <div className="form-group">
        <label>Nome do template *</label>
        <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Boas-vindas Premium" />
      </div>
      <div className="form-group">
        <label>Assunto</label>
        <input className="form-control" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ex: Bem-vindo à Brasil Paralelo!" />
      </div>
      <div className="form-group">
        <label>Corpo (HTML ou texto)</label>
        <textarea className="form-control" value={body} onChange={e => setBody(e.target.value)}
          style={{ minHeight: 140 }} placeholder="<p>Olá {{subscriber.firstName}},</p>" />
        <button className="btn btn-ghost btn-sm mt-4" style={{ alignSelf: 'flex-end' }} onClick={() => setPreview(p => !p)}>
          👁 {preview ? 'Fechar' : 'Pré-visualizar'}
        </button>
      </div>
      {preview && (
        <div className="card mt-4">
          <div className="card-hd" style={{ fontSize: 12, color: 'var(--muted)' }}>
            <span>📧 Pré-visualização</span>
            {subject && <span style={{ fontStyle: 'italic' }}>{subject}</span>}
          </div>
          <div className="card-body" dangerouslySetInnerHTML={{ __html: body || '<em style="color:var(--muted)">Vazio</em>' }} />
        </div>
      )}
    </Modal>
  );
}

export default function TemplatesTab() {
  const { templates, saveTemplates } = useStore();
  const [editing, setEditing] = useState(null); // null | 'new' | index

  const handleSave = (data) => {
    if (editing === 'new') {
      saveTemplates([...templates, { ...data, createdAt: new Date().toISOString() }]);
    } else {
      saveTemplates(templates.map((t, i) => i === editing ? { ...t, ...data } : t));
    }
    setEditing(null);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
          Novo Template
        </button>
      </div>

      {templates.length === 0 ? (
        <Empty
          icon={<svg width="48" height="48" viewBox="0 0 44 44" fill="none"><rect x="6" y="6" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="1.8"/><path d="M13 15h18M13 22h14M13 29h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          title="Nenhum template"
          desc="Crie templates para reutilizar em campanhas."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {templates.map((t, i) => (
            <div key={i} className="card">
              <div className="card-body">
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{t.name}</div>
                {t.subject && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, fontStyle: 'italic' }}>{t.subject}</div>}
                <div style={{ fontSize: 11, color: 'var(--muted)', maxHeight: 48, overflow: 'hidden', marginBottom: 12 }}>
                  {t.body?.replace(/<[^>]+>/g, ' ').trim().slice(0, 120) || '—'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{fdate(t.createdAt)}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditing(i)}>Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => {
                      if (confirm(`Remover "${t.name}"?`)) saveTemplates(templates.filter((_, j) => j !== i));
                    }}>✕</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <TemplateForm
          initial={editing !== 'new' ? templates[editing] : null}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

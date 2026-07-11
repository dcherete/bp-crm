import { useState } from 'react';
import { useStore } from '../../store';
import Modal from '../../components/ui/Modal';

export default function ConfigModal({ onClose }) {
  const { cfg, saveCfg, toast } = useStore();
  const [form, setForm] = useState({ ...cfg });
  const patch = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = () => {
    saveCfg(form);
    toast('Configurações salvas', 'ok');
    onClose();
  };

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.7px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
        {title}
      </div>
      {children}
    </div>
  );

  return (
    <Modal title="Configurações" size="lg" onClose={onClose} footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}>Salvar</button>
      </>
    }>
      <Section title="Novu">
        <div className="form-group">
          <label>API URL</label>
          <input className="form-control" value={form.apiUrl || ''} onChange={patch('apiUrl')} placeholder="http://localhost:3000" />
        </div>
        <div className="form-group">
          <label>API Key</label>
          <input className="form-control" value={form.apiKey || ''} onChange={patch('apiKey')} placeholder="ba45b4..." type="password" />
        </div>
      </Section>

      <Section title="PostHog">
        <div className="form-group">
          <label>Host</label>
          <input className="form-control" value={form.phHost || ''} onChange={patch('phHost')} placeholder="https://us.posthog.com" />
        </div>
        <div className="form-group">
          <label>Project Token (captura de eventos)</label>
          <input className="form-control" value={form.phToken || ''} onChange={patch('phToken')} placeholder="phc_..." />
        </div>
        <div className="form-group">
          <label>Personal API Key (leitura de dados)</label>
          <input className="form-control" value={form.phApiKey || ''} onChange={patch('phApiKey')} placeholder="phx_..." type="password" />
          <div className="form-hint">Necessário para listar cohorts e criar audiências.</div>
        </div>
        <div className="form-group">
          <label>Project ID</label>
          <input className="form-control" value={form.phProjectId || ''} onChange={patch('phProjectId')} placeholder="12345" />
        </div>
      </Section>
    </Modal>
  );
}

import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Modal from '../../components/ui/Modal';
import { Loading, Empty } from '../../components/ui/Loading';
import { posthog } from '../../api/posthog';
import { novu } from '../../api/novu';
import { useStore } from '../../store';
import DynamicSegmentBuilder from './DynamicSegmentBuilder';

const fdate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

function NewSegModal({ onClose, onCreated }) {
  const { cfg, toast } = useStore();
  const hasPH = !!(cfg.phApiKey && cfg.phProjectId);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [key, setKey] = useState('');
  const [keyManual, setKeyManual] = useState(false);
  const [saving, setSaving] = useState(false);

  const slug = (s) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleNameChange = (v) => {
    setName(v);
    if (!keyManual) setKey(slug(v));
  };

  const save = async () => {
    if (!name) { toast('Nome é obrigatório', 'err'); return; }
    setSaving(true);
    if (hasPH) {
      try {
        await posthog.createCohort(name, desc);
        toast('Cohort criado no PostHog!', 'ok');
        onCreated();
        onClose();
      } catch (e) { toast('Erro PostHog: ' + e.message, 'err'); }
    } else {
      try {
        await novu.post('/v1/topics', { key: key || slug(name), name });
        toast('Segmento Novu criado!', 'ok');
        onCreated();
        onClose();
      } catch (e) { toast('Erro Novu: ' + e.message, 'err'); }
    }
    setSaving(false);
  };

  return (
    <Modal title="Novo Segmento" onClose={onClose} footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Criando...' : 'Criar'}</button>
      </>
    }>
      <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 12, border: '1px solid',
        background: hasPH ? 'rgba(22,163,74,.07)' : 'var(--yel-lt)',
        borderColor: hasPH ? 'rgba(22,163,74,.2)' : 'var(--yel-bd)',
        color: hasPH ? 'var(--green)' : 'var(--yellow)' }}>
        {hasPH
          ? 'Será criado como Cohort estático no PostHog — visível em Cohorts → Saved.'
          : 'PostHog não configurado — será criado como Novu Topic.'}
      </div>
      <div className="form-group">
        <label>Nome *</label>
        <input className="form-control" value={name} onChange={e => handleNameChange(e.target.value)}
          placeholder="Ex: Leads Premium, Inativos 30d..." autoFocus />
      </div>
      <div className="form-group">
        <label>Descrição <span className="text-muted" style={{ fontWeight: 400 }}>(opcional)</span></label>
        <input className="form-control" value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="Ex: Clientes que compraram nos últimos 90 dias" />
      </div>
      {!hasPH && (
        <div className="form-group">
          <label>Chave única (Novu)</label>
          <input className="form-control" value={key} onChange={e => { setKey(e.target.value); setKeyManual(true); }}
            placeholder="gerada-automaticamente" />
          <div className="form-hint">Identificador interno sem espaços.</div>
        </div>
      )}
    </Modal>
  );
}

export default function SegmentosPage() {
  const { cfg, toast } = useStore();
  const hasPH = !!(cfg.phApiKey && cfg.phProjectId);
  const [phCohorts, setPhCohorts] = useState([]);
  const [novuTopics, setNovuTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSeg, setNewSeg] = useState(false);
  const [dynBuilder, setDynBuilder] = useState(false);

  const load = async () => {
    setLoading(true);
    let cohorts = [], topics = [];
    if (hasPH) {
      try {
        const r = await posthog.listCohorts();
        cohorts = r.results || [];
      } catch {}
    }
    try {
      const r = await novu.get('/v1/topics?page=0&pageSize=50');
      topics = r.data || [];
    } catch {}
    setPhCohorts(cohorts);
    setNovuTopics(topics);
    setLoading(false);
  };

  useEffect(() => { load(); }, [hasPH]);

  const deleteCohort = async (id, name) => {
    if (!confirm(`Remover cohort "${name}" do PostHog?`)) return;
    try { await posthog.deleteCohort(id); toast('Cohort removido', 'ok'); load(); }
    catch (e) { toast('Erro: ' + e.message, 'err'); }
  };

  const syncToNovu = async (cohortId, cohortName) => {
    toast('Buscando pessoas do cohort...', 'info');
    try {
      const r = await posthog.getCohortPersons(cohortId);
      const ids = (r.results || []).map(p => p.distinct_ids?.[0]).filter(Boolean);
      if (!ids.length) { toast('Cohort vazio', 'err'); return; }
      const key = 'ph-cohort-' + cohortId;
      try { await novu.post('/v1/topics', { key, name: cohortName }); } catch {}
      for (let i = 0; i < ids.length; i += 100) {
        await novu.post(`/v1/topics/${key}/subscribers`, { subscribers: ids.slice(i, i + 100) });
      }
      toast(`${ids.length} pessoas sincronizadas para Novu!`, 'ok');
      load();
    } catch (e) { toast('Erro: ' + e.message, 'err'); }
  };

  const deleteTopic = async (key, name) => {
    if (!confirm(`Remover segmento "${name}"?`)) return;
    try { await novu.delete(`/v1/topics/${key}`); toast('Removido', 'ok'); load(); }
    catch (e) { toast('Erro: ' + e.message, 'err'); }
  };

  const actions = (
    <>
      {hasPH && (
        <button className="btn btn-secondary" onClick={() => setDynBuilder(true)}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M12 1l3 3M15 1l-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          Segmento Dinâmico
        </button>
      )}
      <button className="btn btn-primary" onClick={() => setNewSeg(true)}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
        Novo Segmento
      </button>
    </>
  );

  return (
    <Layout title="Segmentos" actions={actions}>
      {/* Status bar */}
      <div style={{ padding: '12px 16px', borderRadius: 12, marginBottom: 22, fontSize: 12, border: '1px solid', display: 'flex', alignItems: 'center', gap: 10,
        background: hasPH ? 'rgba(22,163,74,.07)' : 'var(--yel-lt)',
        borderColor: hasPH ? 'rgba(22,163,74,.2)' : 'var(--yel-bd)',
        color: hasPH ? 'var(--green)' : 'var(--yellow)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
        <span style={{ fontWeight: 600 }}>{hasPH ? 'PostHog conectado' : 'PostHog não configurado'}</span>
        <span style={{ color: 'var(--muted)' }}>
          {hasPH
            ? '— Segmentos criados aqui aparecem nos Cohorts do PostHog automaticamente.'
            : '— Configure a API Key em Configurações para criar cohorts no PostHog.'}
        </span>
      </div>

      {loading ? <Loading /> : (
        <>
          {/* PostHog Cohorts */}
          {hasPH && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.7px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                PostHog Cohorts ({phCohorts.length})
              </div>
              {phCohorts.length === 0 ? (
                <Empty
                  icon={<svg width="40" height="40" viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="15" stroke="currentColor" strokeWidth="2"/><path d="M14 22h16M22 14v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
                  title="Nenhum cohort no PostHog"
                  desc="Clique em Novo Segmento para criar o primeiro."
                />
              ) : (
                <div className="seg-grid" style={{ marginBottom: 28 }}>
                  {phCohorts.map(c => (
                    <div key={c.id} className="card">
                      <div className="card-body">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ fontWeight: 700 }}>{c.name}</div>
                          <span className={`badge ${c.is_static ? 'badge-gray' : 'badge-purple'}`}>{c.is_static ? 'Estático' : 'Dinâmico'}</span>
                        </div>
                        {c.description && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{c.description}</div>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple)' }}>
                            {(c.count || 0).toLocaleString('pt-BR')} <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 11 }}>pessoas</span>
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{fdate(c.created_at)}</span>
                        </div>
                        <div className="seg-actions">
                          <a href={`${cfg.phHost}/cohorts/${c.id}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">Ver no PostHog ↗</a>
                          <button className="btn btn-secondary btn-sm" onClick={() => syncToNovu(c.id, c.name)}>Sincronizar Novu</button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteCohort(c.id, c.name)}>✕</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Novu Topics */}
          {novuTopics.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.7px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                Novu Topics ({novuTopics.length})
              </div>
              <div className="seg-grid">
                {novuTopics.map(s => (
                  <div key={s.key} className="card">
                    <div className="card-body">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ fontWeight: 700 }}>{s.name}</div>
                        <span className="badge badge-blue">Novu</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14 }}>
                        <code>{s.key}</code> · {fdate(s.createdAt)}
                      </div>
                      <div className="seg-actions">
                        <button className="btn btn-danger btn-sm" onClick={() => deleteTopic(s.key, s.name)}>Remover</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!phCohorts.length && !novuTopics.length && (
            <Empty
              icon={<svg width="48" height="48" viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="15" stroke="currentColor" strokeWidth="2"/><path d="M14 22h16M22 14v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
              title="Nenhum segmento"
              desc="Crie segmentos para organizar sua base e disparar campanhas direcionadas."
            />
          )}
        </>
      )}

      {newSeg && <NewSegModal onClose={() => setNewSeg(false)} onCreated={load} />}
      {dynBuilder && <DynamicSegmentBuilder onClose={() => setDynBuilder(false)} onCreated={load} />}
    </Layout>
  );
}

import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/layout/Layout';
import Modal from '../../components/ui/Modal';
import { Loading, Empty } from '../../components/ui/Loading';
import { novu } from '../../api/novu';
import { useStore } from '../../store';

const fdate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
const avatar = (s) => ((s.firstName?.[0] || s.email?.[0] || s.subscriberId?.[0] || '?').toUpperCase());

// ── Add Single Subscriber ────────────────────────────────────
function AddSubscriberModal({ onClose, onSaved }) {
  const { toast } = useStore();
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const patch = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    const email = form.email.trim();
    if (!email) { toast('Email é obrigatório', 'err'); return; }
    // Use email as subscriberId — matches PostHog distinct_id pattern
    const body = { subscriberId: email, email };
    if (form.firstName.trim()) body.firstName = form.firstName.trim();
    if (form.lastName.trim())  body.lastName  = form.lastName.trim();
    if (form.phone.trim())     body.phone     = form.phone.trim();
    setSaving(true);
    try {
      await novu.post('/v1/subscribers', body);
      toast(`${email} adicionado!`, 'ok');
      onSaved();
      onClose();
    } catch (e) {
      let msg = e.message;
      try { const j = JSON.parse(e.message); msg = j.message || JSON.stringify(j); } catch {}
      toast('Erro: ' + msg, 'err');
    }
    setSaving(false);
  };

  return (
    <Modal title="Adicionar Subscriber" onClose={onClose} footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Adicionar'}</button>
      </>
    }>
      <div style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 12px', background: 'rgba(59,130,246,.07)', border: '1px solid rgba(59,130,246,.15)', borderRadius: 8, marginBottom: 14 }}>
        O email é usado como ID único — o mesmo que o PostHog usa como <code>distinct_id</code>.
      </div>
      <div className="form-group">
        <label>Email *</label>
        <input className="form-control" type="email" value={form.email} onChange={patch('email')}
          placeholder="joao@exemplo.com" autoFocus />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Nome</label>
          <input className="form-control" value={form.firstName} onChange={patch('firstName')} placeholder="João" />
        </div>
        <div className="form-group">
          <label>Sobrenome</label>
          <input className="form-control" value={form.lastName} onChange={patch('lastName')} placeholder="Silva" />
        </div>
      </div>
      <div className="form-group">
        <label>Telefone</label>
        <input className="form-control" value={form.phone} onChange={patch('phone')} placeholder="+5511999999999" />
      </div>
    </Modal>
  );
}

// ── Bulk Import ──────────────────────────────────────────────
function BulkImportModal({ onClose, onSaved }) {
  const { toast } = useStore();
  const [text, setText] = useState('');
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(null);

  const parseCSV = (raw) => {
    const lines = raw.trim().split('\n').filter(Boolean);
    if (!lines.length) return [];
    // detect header
    const first = lines[0].toLowerCase();
    const hasHeader = first.includes('email') || first.includes('id') || first.includes('nome');
    const dataLines = hasHeader ? lines.slice(1) : lines;
    return dataLines.map(line => {
      const cols = line.split(/[,;\t]/).map(c => c.trim().replace(/^"|"$/g, ''));
      // Always use email as subscriberId — matches PostHog distinct_id pattern
      if (cols.length === 1) {
        const email = cols[0].includes('@') ? cols[0] : '';
        return { subscriberId: email || cols[0], email };
      }
      // Find email column: prefer col that has @, otherwise assume col[1]
      const emailCol = cols.find(c => c.includes('@')) || cols[1] || '';
      return { subscriberId: emailCol, email: emailCol, firstName: cols[2] || '', lastName: cols[3] || '', phone: cols[4] || '' };
    }).filter(r => r.email);
  };

  const handleTextChange = (v) => {
    setText(v);
    setPreview(parseCSV(v).slice(0, 5));
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleTextChange(ev.target.result);
    reader.readAsText(file);
  };

  const doImport = async () => {
    const rows = parseCSV(text);
    if (!rows.length) { toast('Nenhum dado para importar', 'err'); return; }
    setImporting(true);
    let ok = 0, fail = 0;
    for (let i = 0; i < rows.length; i++) {
      setProgress({ done: i, total: rows.length });
      const r = rows[i];
      try {
        await novu.post('/v1/subscribers', {
          subscriberId: r.subscriberId || r.email,
          email: r.email || undefined,
          firstName: r.firstName || undefined,
          lastName: r.lastName || undefined,
          phone: r.phone || undefined,
        });
        ok++;
      } catch { fail++; }
    }
    setProgress(null);
    toast(`Importados: ${ok} ✓  ${fail > 0 ? `${fail} erros` : ''}`, ok > 0 ? 'ok' : 'err');
    onSaved();
    onClose();
    setImporting(false);
  };

  return (
    <Modal title="Importar Lista de Subscribers" size="lg" onClose={onClose} footer={
      <>
        <button className="btn btn-secondary" onClick={onClose} disabled={importing}>Cancelar</button>
        <button className="btn btn-primary" onClick={doImport} disabled={importing || !text.trim()}>
          {importing ? `Importando ${progress ? `${progress.done}/${progress.total}` : ''}...` : `Importar ${parseCSV(text).length || ''}`}
        </button>
      </>
    }>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.6 }}>
        Cole emails abaixo ou faça upload de um CSV. O email é usado como ID único.
        <br/>• Uma coluna: apenas emails
        <br/>• Múltiplas colunas: <code>email, nome, sobrenome, telefone</code>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
          📁 Upload CSV
          <input type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={handleFile} />
        </label>
      </div>

      <div className="form-group">
        <label>Cole aqui (CSV, emails separados por linha ou vírgula)</label>
        <textarea className="form-control" style={{ minHeight: 160, fontFamily: 'monospace', fontSize: 12 }}
          value={text} onChange={e => handleTextChange(e.target.value)}
          placeholder={`joao@email.com\nmaria@email.com\n\nou com colunas:\nemail,nome,sobrenome\njoao@email.com,João,Silva`} />
      </div>

      {preview.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
            Preview ({parseCSV(text).length} registros)
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>ID</th><th>Email</th><th>Nome</th></tr></thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={i}>
                      <td><code style={{ fontSize: 11 }}>{r.subscriberId}</code></td>
                      <td style={{ fontSize: 12 }}>{r.email || '—'}</td>
                      <td style={{ fontSize: 12 }}>{[r.firstName, r.lastName].filter(Boolean).join(' ') || '—'}</td>
                    </tr>
                  ))}
                  {parseCSV(text).length > 5 && (
                    <tr><td colSpan={3} style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>+ {parseCSV(text).length - 5} mais...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Trigger to Subscriber ────────────────────────────────────
function TriggerModal({ subscriber, onClose }) {
  const { toast, cfg } = useStore();
  const [workflows, setWorkflows] = useState([]);
  const [form, setForm] = useState({ workflow: cfg.defaultWorkflowId || '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const patch = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    novu.get('/v2/workflows?limit=50').catch(() => novu.get('/v1/workflows?limit=50'))
      .then(r => setWorkflows(r.data?.workflows || r.workflows || r.data || []))
      .catch(() => {});
  }, []);

  const send = async () => {
    if (!form.workflow) { toast('Selecione um workflow', 'err'); return; }
    setSending(true);
    try {
      await novu.post('/v1/events/trigger', {
        name: form.workflow,
        to: { subscriberId: subscriber.subscriberId },
        payload: { subject: form.subject, body: form.body },
      });
      toast(`Enviado para ${subscriber.email || subscriber.subscriberId}!`, 'ok');
      onClose();
    } catch (e) { toast('Erro: ' + e.message, 'err'); }
    setSending(false);
  };

  const name = [subscriber.firstName, subscriber.lastName].filter(Boolean).join(' ') || subscriber.email || subscriber.subscriberId;

  return (
    <Modal title={`Acionar: ${name}`} size="lg" onClose={onClose} footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={send} disabled={sending}>{sending ? 'Enviando...' : '🚀 Enviar'}</button>
      </>
    }>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,.04)', borderRadius: 10, marginBottom: 18 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--red-lt)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>
          {avatar(subscriber)}
        </div>
        <div>
          <div style={{ fontWeight: 700 }}>{name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{subscriber.email} · <code style={{ fontSize: 11 }}>{subscriber.subscriberId}</code></div>
        </div>
      </div>

      <div className="form-group">
        <label>Workflow *</label>
        <select className="form-control" value={form.workflow} onChange={patch('workflow')}>
          <option value="">Selecione...</option>
          {workflows.map(w => {
            const id = w.workflowId || w.identifier || w._id;
            return <option key={id} value={id}>{id === cfg.defaultWorkflowId ? '⭐ ' : ''}{w.name}</option>;
          })}
        </select>
      </div>
      <div className="form-group">
        <label>Assunto</label>
        <input className="form-control" value={form.subject} onChange={patch('subject')} placeholder="Assunto do email" />
      </div>
      <div className="form-group">
        <label>Mensagem</label>
        <textarea className="form-control" style={{ minHeight: 100 }} value={form.body} onChange={patch('body')}
          placeholder="<p>Olá {{subscriber.firstName}},</p>" />
      </div>
    </Modal>
  );
}

// ── Add to Segment ───────────────────────────────────────────
function AddToSegmentModal({ subscriber, onClose }) {
  const { toast } = useStore();
  const [segments, setSegments] = useState([]);
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    novu.get('/v1/topics?page=0&pageSize=50').then(r => setSegments(r.data || [])).catch(() => {});
  }, []);

  const save = async () => {
    if (!selected) { toast('Selecione um segmento', 'err'); return; }
    setSaving(true);
    try {
      await novu.post(`/v1/topics/${selected}/subscribers`, { subscribers: [subscriber.subscriberId] });
      toast('Adicionado ao segmento!', 'ok');
      onClose();
    } catch (e) { toast('Erro: ' + e.message, 'err'); }
    setSaving(false);
  };

  const name = [subscriber.firstName, subscriber.lastName].filter(Boolean).join(' ') || subscriber.email || subscriber.subscriberId;

  return (
    <Modal title={`Adicionar ao segmento: ${name}`} onClose={onClose} footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Adicionando...' : 'Adicionar'}</button>
      </>
    }>
      <div className="form-group">
        <label>Segmento (Novu Topic)</label>
        <select className="form-control" value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">Selecione...</option>
          {segments.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
        </select>
      </div>
    </Modal>
  );
}

// ── Detail Drawer ────────────────────────────────────────────
function SubscriberDetail({ subscriber, onClose, onTrigger, onAddSeg }) {
  const name = [subscriber.firstName, subscriber.lastName].filter(Boolean).join(' ') || '—';
  return (
    <Modal title="Subscriber" onClose={onClose} footer={
      <>
        <button className="btn btn-secondary" onClick={onAddSeg}>+ Segmento</button>
        <button className="btn btn-primary" onClick={onTrigger}>🚀 Acionar</button>
      </>
    }>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--red-lt)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20 }}>
          {avatar(subscriber)}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{name}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{subscriber.email || '—'}</div>
        </div>
      </div>

      {[
        ['Subscriber ID', <code style={{ fontSize: 12 }}>{subscriber.subscriberId}</code>],
        ['Email', subscriber.email || '—'],
        ['Nome', name],
        ['Telefone', subscriber.phone || '—'],
        ['Criado em', fdate(subscriber.createdAt)],
        ['Atualizado em', fdate(subscriber.updatedAt)],
      ].map(([k, v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
          <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{k}</span>
          <span>{v}</span>
        </div>
      ))}

      {subscriber.data && Object.keys(subscriber.data).length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Propriedades customizadas</div>
          {Object.entries(subscriber.data).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
              <span style={{ color: 'var(--muted)' }}>{k}</span>
              <span>{String(v)}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ── Main Page ────────────────────────────────────────────────
const PAGE_SIZE = 20;

export default function SubscribersPage() {
  const { toast, cfg } = useStore();
  const [allSubscribers, setAllSubscribers] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState('');

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [triggerSub, setTriggerSub] = useState(null);
  const [segSub, setSegSub] = useState(null);
  const [detailSub, setDetailSub] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    if (!cfg.apiKey) {
      setLoadError('API Key não configurada. Vá em Configurações e insira a chave do Novu.');
      setLoading(false);
      return;
    }
    try {
      // Fetch all pages (Novu max limit=100 per request)
      let all = [], p = 0, hasMore = true;
      while (hasMore) {
        const r = await novu.get(`/v1/subscribers?limit=100&page=${p}`);
        const batch = r.data || [];
        all = [...all, ...batch];
        hasMore = r.hasMore && batch.length === 100;
        p++;
        if (p > 20) break; // safety cap at 2000 subscribers
      }
      setAllSubscribers(all);
    } catch (e) {
      setAllSubscribers([]);
      let msg = e.message;
      try { const j = JSON.parse(e.message); msg = j.message || msg; } catch {}
      setLoadError('Erro ao carregar: ' + msg);
    }
    setLoading(false);
  }, [cfg.apiKey]);

  useEffect(() => { load(); }, [cfg.apiKey]);

  // Client-side filter + pagination
  const q = search.toLowerCase().trim();
  const filtered = q
    ? allSubscribers.filter(s =>
        (s.email || '').toLowerCase().includes(q) ||
        (s.subscriberId || '').toLowerCase().includes(q) ||
        (s.firstName || '').toLowerCase().includes(q) ||
        (s.lastName || '').toLowerCase().includes(q)
      )
    : allSubscribers;

  const total = filtered.length;
  const subscribers = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearch = (v) => {
    setSearch(v);
    setPage(0);
  };

  const deleteSub = async (sub) => {
    if (!confirm(`Remover subscriber "${sub.email || sub.subscriberId}"?`)) return;
    try {
      await novu.delete(`/v1/subscribers/${sub.subscriberId}`);
      toast('Subscriber removido', 'ok');
      load();
    } catch (e) { toast('Erro: ' + e.message, 'err'); }
  };

  const goPage = (p) => { setPage(p); };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const actions = (
    <>
      <button className="btn btn-secondary" onClick={() => setBulkModal(true)}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M4 7l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 13h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        Importar Lista
      </button>
      <button className="btn btn-primary" onClick={() => setAddModal(true)}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
        Adicionar
      </button>
    </>
  );

  return (
    <Layout title={`Subscribers ${total > 0 ? `(${total.toLocaleString('pt-BR')})` : ''}`} actions={actions}>
      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <input className="form-control" style={{ maxWidth: 320 }} placeholder="Buscar por email..."
          value={search} onChange={e => handleSearch(e.target.value)} />
      </div>

      {loadError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 10, marginBottom: 18, color: 'var(--red)' }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.6"/><path d="M10 6v4M10 13.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <span style={{ flex: 1, fontSize: 13 }}>{loadError}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => window.__openSettings?.()}>Configurações</button>
          <button className="btn btn-secondary btn-sm" onClick={load}>Tentar novamente</button>
        </div>
      )}

      {loading ? <Loading /> : !loadError && subscribers.length === 0 ? (
        <Empty
          icon={<svg width="48" height="48" viewBox="0 0 44 44" fill="none"><circle cx="22" cy="14" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M6 38c0-8.8 7.2-16 16-16s16 7.2 16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
          title="Nenhum subscriber"
          desc="Adicione subscribers manualmente ou importe uma lista."
        />
      ) : (
        <>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Subscriber</th>
                    <th>Email</th>
                    <th>ID</th>
                    <th>Criado em</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map(s => {
                    const name = [s.firstName, s.lastName].filter(Boolean).join(' ');
                    return (
                      <tr key={s.subscriberId} style={{ cursor: 'pointer' }}>
                        <td onClick={() => setDetailSub(s)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--red-lt)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                              {avatar(s)}
                            </div>
                            <span style={{ fontWeight: 600 }}>{name || <span style={{ color: 'var(--muted)' }}>Sem nome</span>}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--muted)' }} onClick={() => setDetailSub(s)}>
                          {s.email || '—'}
                        </td>
                        <td onClick={() => setDetailSub(s)}>
                          <code style={{ fontSize: 11 }}>{s.subscriberId}</code>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }} onClick={() => setDetailSub(s)}>
                          {fdate(s.createdAt)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setTriggerSub(s)} title="Acionar">
                              🚀
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setSegSub(s)} title="Adicionar ao segmento">
                              + Seg
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteSub(s)} title="Remover">✕</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => goPage(page - 1)} disabled={page === 0}>← Anterior</button>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Página {page + 1} de {totalPages}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => goPage(page + 1)} disabled={page >= totalPages - 1}>Próxima →</button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {addModal  && <AddSubscriberModal onClose={() => setAddModal(false)} onSaved={() => { setSearch(''); setPage(0); setTimeout(load, 800); }} />}
      {bulkModal && <BulkImportModal onClose={() => setBulkModal(false)} onSaved={() => { setSearch(''); setPage(0); setTimeout(load, 800); }} />}
      {triggerSub && <TriggerModal subscriber={triggerSub} onClose={() => setTriggerSub(null)} />}
      {segSub    && <AddToSegmentModal subscriber={segSub} onClose={() => setSegSub(null)} />}
      {detailSub && (
        <SubscriberDetail
          subscriber={detailSub}
          onClose={() => setDetailSub(null)}
          onTrigger={() => { setDetailSub(null); setTriggerSub(detailSub); }}
          onAddSeg={() => { setDetailSub(null); setSegSub(detailSub); }}
        />
      )}
    </Layout>
  );
}

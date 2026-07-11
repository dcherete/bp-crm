import { useState, useEffect, useCallback } from 'react';
import Modal from '../../../components/ui/Modal';
import { useStore } from '../../../store';
import { novu } from '../../../api/novu';
import { posthog } from '../../../api/posthog';

const STEPS = ['Destinatários', 'Design', 'Envio'];

function WizardSteps({ current }) {
  return (
    <div className="wizard-steps">
      {STEPS.map((label, i) => {
        const state = i + 1 < current ? 'done' : i + 1 === current ? 'active' : '';
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div className={`wstep ${state}`}>
              <div className="wnum">{i + 1 < current ? '✓' : i + 1}</div>
              <span>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="wline" />}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Recipients ───────────────────────────────────────
function StepRecipients({ data, onChange, onNext, onClose }) {
  const { cfg } = useStore();
  const hasPH = !!(cfg.phApiKey && cfg.phProjectId);
  const [novuSegs, setNovuSegs] = useState([]);
  const [phCohorts, setPhCohorts] = useState([]);
  const [audTotal, setAudTotal] = useState(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    novu.get('/v1/topics?page=0&pageSize=50').then(r => setNovuSegs(r.data || [])).catch(() => {});
    if (hasPH) {
      posthog.listCohorts()
        .then(r => setPhCohorts((r.results || []).map(c => ({ key: 'ph_' + c.id, id: c.id, name: c.name, count: c.count || 0, type: 'posthog' }))))
        .catch(() => {});
    }
  }, [hasPH]);

  const allLists = [
    ...novuSegs.map(s => ({ key: s.key, name: s.name, type: 'novu', count: 0 })),
    ...phCohorts,
  ];

  const toggleKey = (field, key) => {
    const prev = data[field] || [];
    onChange({ [field]: prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key] });
  };

  const calcAudience = async () => {
    setCalculating(true);
    const incl = data.includeKeys?.length ? allLists.filter(l => data.includeKeys.includes(l.key)) : allLists;
    const excl = allLists.filter(l => (data.excludeKeys || []).includes(l.key));
    let total = 0;
    for (const l of incl) {
      if (l.type === 'posthog') { total += l.count || 0; }
      else { try { const r = await novu.get(`/v1/topics/${l.key}/subscribers?limit=1`); total += r.totalCount || 0; } catch {} }
    }
    for (const l of excl) {
      if (l.type === 'posthog') { total = Math.max(0, total - (l.count || 0)); }
      else { try { const r = await novu.get(`/v1/topics/${l.key}/subscribers?limit=1`); total = Math.max(0, total - (r.totalCount || 0)); } catch {} }
    }
    setAudTotal(total);
    onChange({ _audTotal: total });
    setCalculating(false);
  };

  const ListSection = ({ title, field }) => (
    <div className="form-group">
      <label style={{ fontSize: 10, letterSpacing: '.7px', textTransform: 'uppercase' }}>{title}</label>
      <div className="recip-list">
        {allLists.length === 0 ? (
          <div style={{ padding: '14px 12px', fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
            Nenhum segmento disponível
          </div>
        ) : allLists.map(l => (
          <label key={l.key} className="recip-item" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={(data[field] || []).includes(l.key)}
              onChange={() => toggleKey(field, l.key)} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="recip-name">{l.name}</div>
              <div className="recip-sub">{l.type === 'posthog' ? 'Cohort PostHog' : 'Segmento Novu'}</div>
            </div>
            <span className={`badge ${l.type === 'posthog' ? 'badge-purple' : 'badge-blue'}`}>
              {l.type === 'posthog' ? 'PostHog' : 'Novu'}
            </span>
            {l.count > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginLeft: 8 }}>{l.count.toLocaleString('pt-BR')}</span>}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* PostHog status */}
        <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 12, border: '1px solid', display: 'flex', alignItems: 'center', gap: 8,
          background: hasPH ? 'rgba(22,163,74,.07)' : 'var(--yel-lt)',
          borderColor: hasPH ? 'rgba(22,163,74,.2)' : 'var(--yel-bd)',
          color: hasPH ? 'var(--green)' : 'var(--yellow)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
          {hasPH ? `PostHog conectado — ${phCohorts.length} cohort(s) disponíveis` : 'PostHog não configurado — configure em Configurações'}
        </div>

        <div className="form-group">
          <label>Nome da campanha *</label>
          <input className="form-control" value={data.name || ''} onChange={e => onChange({ name: e.target.value })}
            placeholder="Ex: Black Friday — Leads Premium" autoFocus />
        </div>

        <ListSection title="Selecionar listas de destinatários" field="includeKeys" />
        <ListSection title="Excluir listas" field="excludeKeys" />

        <div className="form-group">
          <label>Excluir tags <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(separadas por vírgula)</span></label>
          <input className="form-control" value={data.exclTags || ''} onChange={e => onChange({ exclTags: e.target.value })}
            placeholder="ex: cancelado, inadimplente" />
        </div>
      </div>

      {/* Audience gauge */}
      <div style={{ width: 200, flexShrink: 0 }}>
        <div className="audience-card">
          <div className="audience-lbl">Target Audience</div>
          <svg viewBox="0 0 120 68" width="130" height="74" style={{ overflow: 'visible', display: 'block', margin: '0 auto 4px' }}>
            <path d="M 14 62 A 46 46 0 0 1 106 62" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="12" strokeLinecap="round"/>
            <path d="M 14 62 A 46 46 0 0 1 106 62" fill="none" stroke="var(--blue)" strokeWidth="12" strokeLinecap="round"
              strokeDasharray="144.51"
              strokeDashoffset={audTotal != null ? 144.51 * (1 - Math.min(1, audTotal / Math.max(audTotal, 1))) : 144.51}
              style={{ transition: 'stroke-dashoffset .5s ease' }}/>
          </svg>
          <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, marginBottom: 4 }}>
            {audTotal != null ? audTotal.toLocaleString('pt-BR') : '—'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.5px', fontWeight: 600, marginBottom: 14 }}>AUDIÊNCIA ESTIMADA</div>
          <button className="btn btn-secondary" style={{ width: '100%', fontSize: 12 }} onClick={calcAudience} disabled={calculating}>
            {calculating ? 'Calculando...' : 'Calcular Audiência'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Design ───────────────────────────────────────────
function StepDesign({ data, onChange }) {
  const [workflows, setWorkflows] = useState([]);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    novu.get('/v2/workflows?limit=50').catch(() => novu.get('/v1/workflows?limit=50'))
      .then(r => {
        const wfs = r.data?.workflows || r.workflows || r.data || [];
        setWorkflows(wfs);
        // Auto-select default workflow if not already set
        if (!data.workflow) {
          const { cfg } = useStore.getState();
          if (cfg.defaultWorkflowId) {
            onChange({ workflow: cfg.defaultWorkflowId });
          } else if (wfs.length === 1) {
            const id = wfs[0].workflowId || wfs[0].identifier || wfs[0]._id;
            onChange({ workflow: id });
          }
        }
      })
      .catch(() => {});
  }, []);

  const { cfg: storeCfg } = useStore();

  return (
    <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="form-row">
          <div className="form-group">
            <label>De: Nome</label>
            <input className="form-control" value={data.fromName || ''} onChange={e => onChange({ fromName: e.target.value })} placeholder="Brasil Paralelo" />
          </div>
          <div className="form-group">
            <label>De: Email</label>
            <input className="form-control" type="email" value={data.fromEmail || ''} onChange={e => onChange({ fromEmail: e.target.value })} placeholder="nao-responda@brasilparalelo.com.br" />
          </div>
        </div>
        <div className="form-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            <label style={{ marginBottom: 0 }}>Workflow</label>
            {storeCfg.defaultWorkflowId && data.workflow === storeCfg.defaultWorkflowId && (
              <span className="badge badge-red" style={{ fontSize: 10 }}>⭐ Padrão</span>
            )}
          </div>
          <select className="form-control" value={data.workflow || ''} onChange={e => onChange({ workflow: e.target.value })}>
            <option value="">Selecione...</option>
            {workflows.map(w => {
              const id = w.workflowId || w.identifier || w._id;
              const isDefault = id === storeCfg.defaultWorkflowId;
              return <option key={id} value={id}>{isDefault ? '⭐ ' : ''}{w.name}</option>;
            })}
          </select>
          {!data.workflow && (
            <div className="form-hint" style={{ color: 'var(--yellow)' }}>
              Sem workflow padrão? <a href="/workflows" onClick={e => { e.preventDefault(); window.location.href='/workflows'; }} style={{ color: 'var(--blue)', fontWeight: 600 }}>Criar em Workflows →</a>
            </div>
          )}
        </div>
        <div className="form-group">
          <label>Assunto *</label>
          <input className="form-control" value={data.subject || ''} onChange={e => onChange({ subject: e.target.value })} placeholder="Ex: Novidade exclusiva para você!" />
        </div>
        <div className="form-group">
          <label>Corpo do email <span className="text-muted text-sm">(HTML ou texto)</span></label>
          <textarea className="form-control" style={{ minHeight: 130 }} value={data.body || ''} onChange={e => onChange({ body: e.target.value })}
            placeholder="<p>Olá {{subscriber.firstName}},</p>" />
          <button className="btn btn-ghost btn-sm mt-4" style={{ alignSelf: 'flex-end' }} onClick={() => setPreview(p => !p)}>
            👁 {preview ? 'Fechar' : 'Pré-visualizar'}
          </button>
        </div>
        {preview && (
          <div className="card mt-4">
            <div className="card-hd" style={{ fontSize: 12 }}>
              <span>📧 Preview</span>
              {data.subject && <span style={{ fontStyle: 'italic', color: 'var(--muted)' }}>{data.subject}</span>}
            </div>
            <div className="card-body" dangerouslySetInnerHTML={{ __html: data.body || '' }} />
          </div>
        )}
      </div>

      {/* Audience summary */}
      <div style={{ width: 200, flexShrink: 0 }}>
        <div className="audience-card" style={{ textAlign: 'left' }}>
          <div className="audience-lbl" style={{ marginBottom: 12 }}>Audiência</div>
          {data._audTotal != null && (
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--blue)', marginBottom: 4 }}>
              {data._audTotal.toLocaleString('pt-BR')}
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}> pessoas</span>
            </div>
          )}
          {(data.includeKeys || []).length > 0 ? (
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              <strong style={{ color: 'var(--text)' }}>Incluídas:</strong><br/>
              {(data.includeKeys || []).map(k => <div key={k}>• {k}</div>)}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Todos os contatos</div>
          )}
          {(data.excludeKeys || []).length > 0 && (
            <div style={{ fontSize: 11, color: '#ef4444', marginTop: 8 }}>
              <strong>Excluídas:</strong><br/>
              {(data.excludeKeys || []).map(k => <div key={k}>• {k}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Envio ────────────────────────────────────────────
function StepEnvio({ data, onChange }) {
  // Separate Novu topics from PostHog cohorts in the selection
  const novuKeys = (data.includeKeys || []).filter(k => !k.startsWith('ph_'));
  const phKeys   = (data.includeKeys || []).filter(k => k.startsWith('ph_'));
  const hasNoNovu = novuKeys.length === 0;

  return (
    <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="form-row">
          <div className="form-group">
            <label>Tipo</label>
            <select className="form-control" value={data.type || 'single'} onChange={e => onChange({ type: e.target.value })}>
              <option value="single">Único (Single)</option>
              <option value="recurring">Recorrente</option>
              <option value="experiment">Experimento (A/B)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Tags <span className="text-muted" style={{ fontWeight: 400 }}>(vírgula)</span></label>
            <input className="form-control" value={data.tags || ''} onChange={e => onChange({ tags: e.target.value })} placeholder="black-friday, leads" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Envio</label>
            <select className="form-control" value={data.sendMode || 'now'} onChange={e => onChange({ sendMode: e.target.value })}>
              <option value="now">Imediato</option>
              <option value="scheduled">Agendar</option>
            </select>
          </div>
          {data.sendMode === 'scheduled' && (
            <div className="form-group">
              <label>Data / hora</label>
              <input className="form-control" type="datetime-local" value={data.sendDate || ''} onChange={e => onChange({ sendDate: e.target.value })} />
            </div>
          )}
        </div>

        {/* Audience summary for dispatch */}
        <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, border: '1px solid',
          background: hasNoNovu ? 'var(--yel-lt)' : 'rgba(22,163,74,.07)',
          borderColor: hasNoNovu ? 'var(--yel-bd)' : 'rgba(22,163,74,.2)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6,
            color: hasNoNovu ? 'var(--yellow)' : 'var(--green)' }}>
            {hasNoNovu ? '⚠ Atenção: apenas cohorts PostHog selecionados' : '✓ Prontos para disparo'}
          </div>
          {novuKeys.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              Novu Topics: {novuKeys.map(k => <span key={k} className="badge badge-blue" style={{ marginRight: 4 }}>{k}</span>)}
            </div>
          )}
          {phKeys.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
              PostHog Cohorts: {phKeys.map(k => <span key={k} className="badge badge-purple" style={{ marginRight: 4 }}>{k.replace('ph_','#')}</span>)}
              <div style={{ fontSize: 11, marginTop: 4 }}>
                {hasNoNovu
                  ? 'Cohorts PostHog serão sincronizados para o Novu automaticamente antes do disparo.'
                  : 'Cohorts PostHog incluídos — sincronizados antes do disparo.'}
              </div>
            </div>
          )}
          {(data.includeKeys || []).length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Todos os contatos (nenhuma lista específica selecionada no passo 1).</div>
          )}
        </div>

        {/* Preview */}
        {data.body && (
          <div className="card mt-12">
            <div className="card-hd" style={{ fontSize: 12 }}>
              <span>📧 Pré-visualização</span>
              {data.fromName && <span style={{ color: 'var(--muted)' }}>De: {data.fromName}</span>}
            </div>
            <div className="card-body">
              {data.subject && <div style={{ fontWeight: 700, fontSize: 14, borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 10 }}>{data.subject}</div>}
              <div dangerouslySetInnerHTML={{ __html: data.body }} />
            </div>
          </div>
        )}
      </div>

      {/* Summary card */}
      <div style={{ width: 200, flexShrink: 0 }}>
        <div className="audience-card" style={{ textAlign: 'left' }}>
          <div className="audience-lbl" style={{ marginBottom: 12 }}>Resumo</div>
          {[
            ['Campanha', data.name || '—'],
            ['Assunto', data.subject || '—'],
            ['Workflow', data.workflow || '—'],
          ].map(([k, v]) => (
            <div key={k} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{k}</div>
              <div style={{ fontSize: 12, wordBreak: 'break-word' }}>{v}</div>
            </div>
          ))}
          {data._audTotal != null && (
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue)', marginTop: 8 }}>
              {data._audTotal.toLocaleString('pt-BR')}
              <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}> pessoas</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Wizard ──────────────────────────────────────────────
export default function CampWizard({ onClose }) {
  const { addCamp, updateCamp, camps, toast, cfg } = useStore();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ channel: 'email', includeKeys: [], excludeKeys: [] });

  const update = useCallback((patch) => setData(d => ({ ...d, ...patch })), []);

  const next = () => {
    if (step === 1 && !data.name) { toast('Nome é obrigatório', 'err'); return; }
    if (step === 2 && !data.workflow) { toast('Selecione um workflow', 'err'); return; }
    if (step === 2 && !data.subject) { toast('Assunto é obrigatório', 'err'); return; }
    setStep(s => s + 1);
  };

  const saveDraft = () => {
    addCamp({ ...data, status: 'rascunho' });
    toast('Rascunho salvo', 'ok');
    onClose();
  };

  const fire = async () => {
    const isScheduled = data.sendMode === 'scheduled' && data.sendDate;
    addCamp({ ...data, status: isScheduled ? 'programada' : 'enviada', sentAt: isScheduled ? '' : new Date().toISOString() });

    if (isScheduled) {
      toast(`Agendada para ${new Date(data.sendDate).toLocaleString('pt-BR')}`, 'ok');
      onClose();
      return;
    }

    // Resolve which Novu topic keys to fire to
    const novuKeys = (data.includeKeys || []).filter(k => !k.startsWith('ph_'));
    const phKeys   = (data.includeKeys || []).filter(k => k.startsWith('ph_'));

    // Auto-sync PostHog cohorts → Novu topics
    const syncedKeys = [...novuKeys];
    for (const phKey of phKeys) {
      const cohortId = phKey.replace('ph_', '');
      const topicKey = `ph-cohort-${cohortId}`;
      try {
        toast(`Sincronizando cohort ${cohortId}...`, 'info');
        const r = await posthog.getCohortPersons(cohortId);
        const ids = (r.results || []).map(p => p.distinct_ids?.[0]).filter(Boolean);
        if (ids.length) {
          try { await novu.post('/v1/topics', { key: topicKey, name: `PostHog Cohort ${cohortId}` }); } catch {}
          for (let i = 0; i < ids.length; i += 100)
            await novu.post(`/v1/topics/${topicKey}/subscribers`, { subscribers: ids.slice(i, i + 100) });
          syncedKeys.push(topicKey);
        }
      } catch {}
    }

    if (!syncedKeys.length) {
      toast('Nenhum segmento Novu disponível. Selecione um Novu Topic ou sincronize um cohort PostHog.', 'err');
      return;
    }

    // Fire to each topic
    let fired = 0;
    for (const topicKey of syncedKeys) {
      try {
        await novu.post('/v1/events/trigger', {
          name: data.workflow,
          to: { type: 'Topic', topicKey },
          payload: { subject: data.subject || '', body: data.body || '' },
        });
        fired++;
      } catch (e) { toast(`Erro no disparo para ${topicKey}: ${e.message}`, 'err'); }
    }

    if (fired > 0) {
      toast(`Campanha "${data.name}" disparada para ${fired} segmento(s)!`, 'ok');
      posthog.capture(cfg, 'campaign_sent', { campaign_name: data.name, segments: syncedKeys.join(',') });
    }
    onClose();
  };

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={step === 1 ? onClose : () => setStep(s => s - 1)}>
        {step === 1 ? 'Cancelar' : '← Voltar'}
      </button>
      {step === 3 && <button className="btn btn-secondary" onClick={saveDraft}>Rascunho</button>}
      {step < 3
        ? <button className="btn btn-primary" onClick={next}>{step === 2 ? 'Envio →' : 'Design →'}</button>
        : <button className="btn btn-primary" onClick={fire}>🚀 Disparar</button>
      }
    </>
  );

  return (
    <Modal
      title={`Nova Campanha de Email — ${STEPS[step - 1]}`}
      size="xl"
      onClose={onClose}
      footer={footer}
    >
      <WizardSteps current={step} />
      {step === 1 && <StepRecipients data={data} onChange={update} onNext={next} onClose={onClose} />}
      {step === 2 && <StepDesign data={data} onChange={update} />}
      {step === 3 && <StepEnvio data={data} onChange={update} />}
    </Modal>
  );
}

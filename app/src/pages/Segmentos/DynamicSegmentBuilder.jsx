import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import { posthog } from '../../api/posthog';
import { useStore } from '../../store';

// ── Helpers ──────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 8);

const emptyCondition = () => ({
  id: uid(),
  type: 'event',          // 'event' | 'property'
  event: '',
  operator: 'performed_event',   // performed_event | not_performed_event
  timeValue: 30,
  timeInterval: 'day',
  propKey: '',
  propOperator: 'exact',
  propValue: '',
});

const emptyGroup = () => ({ id: uid(), conditions: [emptyCondition()] });

// Builds PostHog cohort filters payload from groups
function buildFilters(groups) {
  return {
    properties: {
      type: 'AND',
      values: groups.map(g => ({
        type: 'OR',
        values: g.conditions.map(c => {
          if (c.type === 'event') {
            return {
              key: c.event,
              event_type: 'events',
              time_value: Number(c.timeValue),
              time_interval: c.timeInterval,
              value: c.operator,
              type: 'behavioral',
            };
          } else {
            return {
              key: c.propKey,
              value: c.propValue,
              operator: c.propOperator,
              type: 'person',
            };
          }
        }),
      })),
    },
  };
}

// Builds a HogQL query to estimate audience count
function buildHogQL(groups) {
  const clauses = groups.flatMap(g =>
    g.conditions
      .filter(c => c.type === 'event' && c.event)
      .map(c => {
        const op = c.operator === 'performed_event' ? '' : 'NOT ';
        const interval = `${c.timeValue} ${c.timeInterval}`;
        return `${op}distinct_id IN (SELECT DISTINCT distinct_id FROM events WHERE event = '${c.event.replace(/'/g, "\\'")}' AND timestamp > now() - interval ${interval})`;
      })
  );
  if (!clauses.length) return null;
  return `SELECT COUNT(DISTINCT distinct_id) FROM events WHERE ${clauses.join(' AND ')}`;
}

// ── Sub-components ────────────────────────────────────────────
const OPERATORS = [
  { value: 'performed_event',     label: 'realizou' },
  { value: 'not_performed_event', label: 'não realizou' },
];
const INTERVALS = [
  { value: 'day',   label: 'dias' },
  { value: 'week',  label: 'semanas' },
  { value: 'month', label: 'meses' },
];
const PROP_OPERATORS = [
  { value: 'exact',      label: '=' },
  { value: 'is_not',     label: '≠' },
  { value: 'icontains',  label: 'contém' },
  { value: 'not_icontains', label: 'não contém' },
  { value: 'gt',         label: '>' },
  { value: 'lt',         label: '<' },
];

function ConditionRow({ cond, events, onChange, onRemove, canRemove }) {
  const sel = (k) => (e) => onChange({ ...cond, [k]: e.target.value });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', flexWrap: 'wrap' }}>
      {/* Type toggle */}
      <select className="form-control" style={{ width: 120 }} value={cond.type} onChange={sel('type')}>
        <option value="event">Evento</option>
        <option value="property">Propriedade</option>
      </select>

      {cond.type === 'event' ? (<>
        {/* Operator */}
        <select className="form-control" style={{ width: 130 }} value={cond.operator} onChange={sel('operator')}>
          {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {/* Event name */}
        <input className="form-control" style={{ flex: 1, minWidth: 140 }} value={cond.event}
          onChange={sel('event')} placeholder="nome do evento"
          list={`ev-list-${cond.id}`} />
        <datalist id={`ev-list-${cond.id}`}>
          {events.map(e => <option key={e} value={e} />)}
        </datalist>
        {/* Time */}
        <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>nos últimos</span>
        <input className="form-control" type="number" style={{ width: 64 }} min={1} max={365}
          value={cond.timeValue} onChange={sel('timeValue')} />
        <select className="form-control" style={{ width: 90 }} value={cond.timeInterval} onChange={sel('timeInterval')}>
          {INTERVALS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
        </select>
      </>) : (<>
        {/* Property key */}
        <input className="form-control" style={{ flex: 1, minWidth: 110 }} value={cond.propKey}
          onChange={sel('propKey')} placeholder="chave da propriedade" />
        {/* Prop operator */}
        <select className="form-control" style={{ width: 110 }} value={cond.propOperator} onChange={sel('propOperator')}>
          {PROP_OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {/* Prop value */}
        <input className="form-control" style={{ flex: 1, minWidth: 100 }} value={cond.propValue}
          onChange={sel('propValue')} placeholder="valor" />
      </>)}

      {canRemove && (
        <button className="btn btn-ghost btn-sm" onClick={onRemove}
          style={{ color: 'var(--muted)', padding: '4px 6px', flexShrink: 0 }}>✕</button>
      )}
    </div>
  );
}

function ConditionGroup({ group, index, events, onChange, onRemove, isLast }) {
  const updateCond = (cid, patch) =>
    onChange({ ...group, conditions: group.conditions.map(c => c.id === cid ? patch : c) });
  const addCond = () =>
    onChange({ ...group, conditions: [...group.conditions, emptyCondition()] });
  const removeCond = (cid) =>
    onChange({ ...group, conditions: group.conditions.filter(c => c.id !== cid) });

  return (
    <div>
      {index > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: 'rgba(200,16,46,.1)', color: 'var(--red)', letterSpacing: '.5px' }}>E</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
      )}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
            Grupo {index + 1}
          </span>
          {onRemove && (
            <button className="btn btn-ghost btn-sm" onClick={onRemove}
              style={{ fontSize: 11, color: 'var(--muted)' }}>Remover grupo</button>
          )}
        </div>

        {group.conditions.map((c, i) => (
          <div key={c.id}>
            {i > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '2px 0' }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: 'rgba(59,130,246,.1)', color: 'var(--blue)' }}>OU</span>
              </div>
            )}
            <ConditionRow
              cond={c}
              events={events}
              onChange={(patch) => updateCond(c.id, patch)}
              onRemove={() => removeCond(c.id)}
              canRemove={group.conditions.length > 1}
            />
          </div>
        ))}

        <button className="btn btn-ghost btn-sm" onClick={addCond}
          style={{ fontSize: 12, marginTop: 4, color: 'var(--blue)' }}>
          + OU: adicionar condição alternativa
        </button>
      </div>
    </div>
  );
}

// ── Main Builder ──────────────────────────────────────────────
export default function DynamicSegmentBuilder({ onClose, onCreated }) {
  const { cfg, toast } = useStore();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [groups, setGroups] = useState([emptyGroup()]);
  const [events, setEvents] = useState([]);
  const [preview, setPreview] = useState(null); // null | { count, loading }
  const [saving, setSaving] = useState(false);

  // Fetch available events from PostHog
  useEffect(() => {
    posthog.query(
      "SELECT DISTINCT event FROM events WHERE timestamp > now() - interval 90 day ORDER BY event LIMIT 200"
    ).then(r => {
      setEvents((r.results || []).map(row => row[0]).filter(Boolean));
    }).catch(() => {});
  }, []);

  const updateGroup = (gid, patch) =>
    setGroups(gs => gs.map(g => g.id === gid ? patch : g));
  const removeGroup = (gid) =>
    setGroups(gs => gs.filter(g => g.id !== gid));
  const addGroup = () =>
    setGroups(gs => [...gs, emptyGroup()]);

  const runPreview = async () => {
    const sql = buildHogQL(groups);
    if (!sql) { toast('Adicione pelo menos uma condição de evento', 'err'); return; }
    setPreview({ loading: true, count: null });
    try {
      const r = await posthog.query(sql);
      const count = r.results?.[0]?.[0] ?? 0;
      setPreview({ loading: false, count });
    } catch (e) {
      toast('Erro ao calcular: ' + e.message, 'err');
      setPreview(null);
    }
  };

  const save = async () => {
    if (!name) { toast('Nome é obrigatório', 'err'); return; }
    const hasConditions = groups.some(g => g.conditions.some(c =>
      (c.type === 'event' && c.event) || (c.type === 'property' && c.propKey)
    ));
    if (!hasConditions) { toast('Adicione pelo menos uma condição', 'err'); return; }

    setSaving(true);
    try {
      await fetch(`${cfg.phHost}/api/projects/${cfg.phProjectId}/cohorts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.phApiKey}` },
        body: JSON.stringify({ name, description: desc, is_static: false, filters: buildFilters(groups) }),
      }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); });
      toast('Segmento dinâmico criado no PostHog!', 'ok');
      onCreated?.();
      onClose();
    } catch (e) {
      toast('Erro: ' + e.message, 'err');
    }
    setSaving(false);
  };

  return (
    <Modal
      title="Novo Segmento Dinâmico"
      size="xl"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-secondary" onClick={runPreview} disabled={preview?.loading}>
            {preview?.loading ? 'Calculando...' : '👁 Preview'}
          </button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Criando...' : 'Criar Segmento'}
          </button>
        </>
      }
    >
      {/* Header info */}
      <div style={{ padding: '10px 14px', background: 'rgba(124,58,237,.08)', border: '1px solid rgba(124,58,237,.2)', borderRadius: 10, fontSize: 12, color: 'var(--purple)', marginBottom: 20 }}>
        Segmentos dinâmicos são mantidos automaticamente pelo PostHog conforme novos eventos chegam.
      </div>

      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
        {/* Left: builder */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="form-row" style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Nome do segmento *</label>
              <input className="form-control" value={name} onChange={e => setName(e.target.value)}
                placeholder="Ex: Engajados últimos 30 dias" autoFocus />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Descrição</label>
              <input className="form-control" value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="Opcional" />
            </div>
          </div>

          {/* Logic explanation */}
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>Incluir pessoas que satisfazem</span>
            <span style={{ padding: '2px 8px', borderRadius: 20, background: 'rgba(200,16,46,.1)', color: 'var(--red)', fontSize: 11, fontWeight: 700 }}>TODOS</span>
            <span>os grupos, onde cada grupo usa lógica</span>
            <span style={{ padding: '2px 8px', borderRadius: 20, background: 'rgba(59,130,246,.1)', color: 'var(--blue)', fontSize: 11, fontWeight: 700 }}>OU</span>
          </div>

          {/* Groups */}
          {groups.map((g, i) => (
            <ConditionGroup
              key={g.id}
              group={g}
              index={i}
              events={events}
              onChange={(patch) => updateGroup(g.id, patch)}
              onRemove={groups.length > 1 ? () => removeGroup(g.id) : null}
              isLast={i === groups.length - 1}
            />
          ))}

          <button className="btn btn-secondary btn-sm" onClick={addGroup} style={{ marginTop: 14 }}>
            + E: adicionar grupo de condições
          </button>
        </div>

        {/* Right: preview panel */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div className="audience-card">
            <div className="audience-lbl">Audiência Estimada</div>
            <svg viewBox="0 0 120 68" width="120" height="70" style={{ overflow: 'visible', display: 'block', margin: '0 auto 6px' }}>
              <path d="M 14 62 A 46 46 0 0 1 106 62" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="12" strokeLinecap="round"/>
              <path d="M 14 62 A 46 46 0 0 1 106 62" fill="none" stroke="var(--purple)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray="144.51"
                strokeDashoffset={preview?.count != null ? Math.max(0, 144.51 * (1 - Math.min(1, preview.count / 100000))) : 144.51}
                style={{ transition: 'stroke-dashoffset .6s ease' }}/>
            </svg>

            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, marginBottom: 4, color: 'var(--purple)' }}>
              {preview?.loading ? '...' : preview?.count != null ? preview.count.toLocaleString('pt-BR') : '—'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.5px', fontWeight: 600, marginBottom: 16 }}>
              PESSOAS
            </div>
            <button className="btn btn-secondary" style={{ width: '100%', fontSize: 12 }}
              onClick={runPreview} disabled={preview?.loading}>
              {preview?.loading ? 'Calculando...' : 'Calcular Preview'}
            </button>

            <div style={{ marginTop: 16, fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, textAlign: 'left' }}>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Como funciona:</div>
              <div>• Grupos → lógica <strong style={{ color: 'var(--red)' }}>E</strong></div>
              <div>• Condições no grupo → lógica <strong style={{ color: 'var(--blue)' }}>OU</strong></div>
              <div>• PostHog recalcula a cada hora</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

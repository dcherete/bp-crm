import { useState, useMemo } from 'react';
import { useStore } from '../../../../store';
import { Empty } from '../../../../components/ui/Loading';
import CampWizard from '../CampWizard';

const STATUS_STYLES = {
  enviada:   { dot: '#16A34A', label: 'Enviada',    cls: 'badge-green' },
  programada:{ dot: '#D97706', label: 'Programado', cls: 'badge-orange' },
  rascunho:  { dot: '#6b6b6b', label: 'Rascunho',  cls: 'badge-gray' },
  cancelada: { dot: '#C8102E', label: 'Cancelado',  cls: 'badge-red' },
};

const TYPE_LABELS = {
  single:     'Único',
  recurring:  'Recorrente',
  experiment: 'Experimento',
};

function StatusDot({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.rascunho;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      <span className={`badge ${s.cls}`} style={{ padding: '2px 8px' }}>{s.label}</span>
    </span>
  );
}

function TagChip({ tag }) {
  const colors = ['badge-blue','badge-purple','badge-orange','badge-green','badge-gray'];
  const idx = Math.abs(tag.split('').reduce((a,c) => a + c.charCodeAt(0), 0)) % colors.length;
  return <span className={`badge ${colors[idx]}`}>{tag}</span>;
}

const fdate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

export default function CampanhasTab() {
  const { camps, deleteCamp, updateCamp, toast } = useStore();
  const [wizard, setWizard] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const emailCamps = useMemo(() =>
    camps.filter(c => c.channel === 'email' || c.channel === 'both'),
    [camps]
  );

  const filtered = useMemo(() =>
    emailCamps.filter(c => {
      if (filterStatus && c.status !== filterStatus) return false;
      if (filterType && c.type !== filterType) return false;
      if (search && !c.name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }),
    [emailCamps, filterStatus, filterType, search]
  );

  return (
    <>
      {/* Filter bar */}
      <div className="camp-filter-bar">
        <input
          className="form-control"
          placeholder="Buscar campanha..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 220 }}
        />
        <select className="form-control" style={{ maxWidth: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="enviada">Enviada</option>
          <option value="programada">Programado</option>
          <option value="rascunho">Rascunho</option>
          <option value="cancelada">Cancelado</option>
        </select>
        <select className="form-control" style={{ maxWidth: 160 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="single">Único</option>
          <option value="recurring">Recorrente</option>
          <option value="experiment">Experimento</option>
        </select>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setWizard(true)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
          Nova Campanha
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Empty
          icon={<svg width="48" height="48" viewBox="0 0 44 44" fill="none"><rect x="6" y="8" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="1.8"/><path d="M6 15h32M14 22h16M14 28h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          title="Nenhuma campanha"
          desc="Crie sua primeira campanha de email."
        />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Criado em</th>
                  <th>Data de envio</th>
                  <th>Tags</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={i}>
                    <td><StatusDot status={c.status} /></td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                      {c.subject && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{c.subject}</div>}
                    </td>
                    <td>
                      <span className="badge badge-gray">{TYPE_LABELS[c.type] || 'Único'}</span>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{fdate(c.createdAt)}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>
                      {c.sendDate ? fdate(c.sendDate) : c.sentAt ? fdate(c.sentAt) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {c.tags?.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                          <TagChip key={t} tag={t} />
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {c.status === 'rascunho' && (
                          <button className="btn btn-primary btn-sm" onClick={() => {
                            updateCamp(camps.indexOf(c), { status: 'enviada', sentAt: new Date().toISOString() });
                            toast('Campanha disparada!', 'ok');
                          }}>
                            Disparar
                          </button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => {
                          if (confirm(`Remover "${c.name}"?`)) deleteCamp(camps.indexOf(c));
                        }}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {wizard && <CampWizard onClose={() => setWizard(false)} />}
    </>
  );
}

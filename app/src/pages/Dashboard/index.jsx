import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useStore } from '../../store';
import { novu } from '../../api/novu';
import { Loading } from '../../components/ui/Loading';

const fdate = (d) => d ? new Date(d).toLocaleString('pt-BR') : '—';

export default function DashboardPage() {
  const { camps, unsubs, suppression } = useStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      let subs = 0, segments = 0;
      try { const r = await novu.get('/v1/subscribers?limit=1'); subs = r.totalCount || 0; } catch {}
      try { const r = await novu.get('/v1/topics?page=0&pageSize=1'); segments = r.totalCount || 0; } catch {}
      setStats({ subs, segments });
      setLoading(false);
    };
    load();
  }, []);

  const sentCamps = camps.filter(c => c.status === 'enviada');

  return (
    <Layout title="Dashboard">
      {loading ? <Loading /> : (
        <>
          <div className="stat-grid">
            {[
              { label: 'Campanhas Enviadas', value: sentCamps.length, color: 'var(--red)' },
              { label: 'Subscribers', value: stats.subs.toLocaleString('pt-BR'), color: 'var(--blue)' },
              { label: 'Segmentos', value: stats.segments, color: 'var(--purple)' },
              { label: 'Descadastros', value: unsubs.length, color: 'var(--yellow)' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-hd"><h3>Campanhas Recentes</h3></div>
            {sentCamps.length === 0 ? (
              <div className="card-body" style={{ color: 'var(--muted)', fontSize: 13 }}>Nenhuma campanha enviada ainda.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Nome</th><th>Canal</th><th>Segmento</th><th>Enviado em</th></tr></thead>
                  <tbody>
                    {sentCamps.slice(-10).reverse().map((c, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td><span className="badge badge-blue">{c.channel}</span></td>
                        <td style={{ color: 'var(--muted)' }}>{c.segName || c.segKey || '—'}</td>
                        <td style={{ color: 'var(--muted)', fontSize: 12 }}>{fdate(c.sentAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}

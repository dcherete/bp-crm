import { useEffect, useState } from 'react';
import { novu } from '../../../../api/novu';
import { posthog } from '../../../../api/posthog';
import { useStore } from '../../../../store';
import { Loading } from '../../../../components/ui/Loading';

export default function AnalyticsTab() {
  const { cfg } = useStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let sent = 0, delivered = 0, opened = 0, clicked = 0;
      try {
        const r = await novu.get('/v1/notifications?page=0&limit=50&channel=email');
        const list = r.data || [];
        sent = list.length;
        delivered = list.filter(n => n.status === 'sent' || n.status === 'delivered').length;
      } catch {}

      if (cfg.phApiKey && cfg.phProjectId) {
        try {
          const r = await posthog.query(
            "SELECT event, count() FROM events WHERE event IN ('notification_opened','email_clicked') AND timestamp > now() - interval 30 day GROUP BY event"
          );
          (r.results || []).forEach(([event, count]) => {
            if (event === 'notification_opened') opened = count;
            if (event === 'email_clicked') clicked = count;
          });
        } catch {}
      }

      setData({ sent, delivered, opened, clicked });
      setLoading(false);
    };
    load();
  }, [cfg.phApiKey, cfg.phProjectId]);

  if (loading) return <Loading />;

  const openRate = data.sent > 0 ? ((data.opened / data.sent) * 100).toFixed(1) : '—';
  const clickRate = data.sent > 0 ? ((data.clicked / data.sent) * 100).toFixed(1) : '—';

  return (
    <div>
      <div className="stat-grid">
        {[
          { label: 'Total Enviados', value: data.sent, color: 'var(--blue)' },
          { label: 'Entregues', value: data.delivered, color: 'var(--green)' },
          { label: 'Taxa de Abertura', value: `${openRate}%`, color: 'var(--purple)' },
          { label: 'Taxa de Clique', value: `${clickRate}%`, color: 'var(--yellow)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-sub">Últimos 30 dias</div>
          </div>
        ))}
      </div>

      {(!cfg.phApiKey || !cfg.phProjectId) && (
        <div style={{ padding: '14px 18px', background: 'var(--yel-lt)', border: '1px solid var(--yel-bd)', borderRadius: 12, fontSize: 13, color: 'var(--yellow)' }}>
          Configure PostHog em Configurações para ver dados de abertura e clique.
        </div>
      )}
    </div>
  );
}

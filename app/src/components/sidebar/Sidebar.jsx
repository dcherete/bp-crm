import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ChevronIcon = () => (
  <svg className="sb-chevron" width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function Group({ id, label, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sb-group">
      <button className={`sb-group-hd${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
        <div className="sb-group-ico">{icon}</div>
        <span className="sb-group-label">{label}</span>
        <ChevronIcon />
      </button>
      <div className={`sb-items${open ? ' open' : ''}`}>
        {children}
      </div>
    </div>
  );
}

function NavBtn({ to, label }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = pathname === to || pathname.startsWith(to + '/');
  return (
    <button className={`nav-btn${active ? ' active' : ''}`} onClick={() => navigate(to)}>
      {label}
    </button>
  );
}

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-mark">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L2 7v6l8 5 8-5V7L10 2z" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div className="sb-logo-text">CRM Hub</div>
          <div className="sb-logo-sub">Brasil Paralelo</div>
        </div>
      </div>

      <nav className="sb-nav">
        <Group id="analises" label="Análises" defaultOpen
          icon={<svg width="15" height="15" viewBox="0 0 20 20" fill="none"><rect x="2" y="10" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="8" y="6" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="2" width="4" height="16" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>}>
          <NavBtn to="/dashboard" label="Dashboard" />
          <NavBtn to="/feed" label="Feed de Atividade" />
        </Group>

        <Group id="campanhas" label="Campanhas" defaultOpen
          icon={<svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M3 4h14M3 8h9M3 12h11M3 16h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}>
          <NavBtn to="/campanhas/email" label="Email" />
          <NavBtn to="/campanhas/whatsapp" label="WhatsApp" />
          <NavBtn to="/campanhas/push-app" label="App Push" />
          <NavBtn to="/campanhas/push-web" label="Web Push" />
          <div style={{ height: 1, background: 'var(--border)', margin: '5px 10px 5px 14px' }} />
          <NavBtn to="/jornadas" label="Jornadas" />
          <NavBtn to="/workflows" label="Workflows" />
        </Group>

        <Group id="audiencia" label="Audiência" defaultOpen
          icon={<svg width="15" height="15" viewBox="0 0 20 20" fill="none"><circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M2 17c0-3.3 2.7-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="14" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M11 17c0-2.2 1.3-4 3-4s3 1.8 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}>
          <NavBtn to="/subscribers" label="Subscribers" />
          <NavBtn to="/segmentos" label="Segmentos" />
          <NavBtn to="/unsubscribes" label="Descadastramentos" />
          <NavBtn to="/supressao" label="Supressão" />
        </Group>

        <button className="sb-standalone" onClick={() => window.__openSettings?.()}>
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          <span className="sb-group-label">Configurações</span>
        </button>
      </nav>
    </aside>
  );
}

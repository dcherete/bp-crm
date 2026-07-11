import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/globals.css';

import DashboardPage from './pages/Dashboard';
import EmailPage from './pages/Campanhas/Email';
import SegmentosPage from './pages/Segmentos';
import WorkflowsPage from './pages/Workflows';
import SubscribersPage from './pages/Subscribers';
import ConfigModal from './pages/Configuracoes';
import ToastContainer from './components/ui/Toast';

// Sidebar precisa de acesso ao openSettings — passamos via context ou estado global
// Por simplicidade usamos um evento customizado
import Sidebar from './components/sidebar/Sidebar';
import { useStore } from './store';

function AppShell() {
  const [showCfg, setShowCfg] = useState(false);

  // Expõe openSettings globalmente para o Sidebar usar
  window.__openSettings = () => setShowCfg(true);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/campanhas/email" element={<EmailPage />} />
            <Route path="/segmentos" element={<SegmentosPage />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
            <Route path="/subscribers" element={<SubscribersPage />} />
            <Route path="*" element={<PlaceholderPage />} />
          </Routes>
        </div>
      </main>
      <ToastContainer />
      {showCfg && <ConfigModal onClose={() => setShowCfg(false)} />}
    </div>
  );
}

function PlaceholderPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="topbar"><h1 style={{ color: 'var(--muted)' }}>Em breve</h1></div>
      <div className="content">
        <div className="empty">
          <svg width="48" height="48" viewBox="0 0 44 44" fill="none" style={{ opacity: .3 }}>
            <rect x="6" y="6" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2"/>
            <path d="M22 16v12M22 32v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3 style={{ color: 'var(--muted)' }}>Página em construção</h3>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

import { useState } from 'react';
import Layout from '../../../components/layout/Layout';
import CampanhasTab from './tabs/CampanhasTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import TemplatesTab from './tabs/TemplatesTab';

const TABS = [
  { id: 'campanhas', label: 'Campanhas' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'templates', label: 'Templates' },
];

export default function EmailPage() {
  const [tab, setTab] = useState('campanhas');

  return (
    <Layout title="Email">
      <div className="tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'campanhas' && <CampanhasTab />}
      {tab === 'analytics' && <AnalyticsTab />}
      {tab === 'templates' && <TemplatesTab />}
    </Layout>
  );
}

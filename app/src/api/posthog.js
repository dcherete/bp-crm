import { useStore } from '../store';

const phFetch = async (method, path, body) => {
  const { cfg } = useStore.getState();
  if (!cfg.phApiKey || !cfg.phProjectId) throw new Error('PostHog não configurado');
  const base = cfg.phHost || 'https://us.posthog.com';
  const res = await fetch(`${base}/api/projects/${cfg.phProjectId}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.phApiKey}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`PostHog HTTP ${res.status}`);
  if (method === 'DELETE') return null;
  return res.json();
};

export const posthog = {
  // Cohorts
  listCohorts: () => phFetch('GET', '/cohorts/?limit=100'),
  createCohort: (name, description = '') =>
    phFetch('POST', '/cohorts/', { name, description, is_static: true, groups: [] }),
  deleteCohort: (id) => phFetch('DELETE', `/cohorts/${id}/`),
  getCohortPersons: (id) => phFetch('GET', `/cohorts/${id}/persons?limit=1000`),

  // HogQL query
  query: (sql) =>
    phFetch('POST', '/query/', { query: { kind: 'HogQLQuery', query: sql } }),

  // Capture event
  capture: (cfg, event, props) => {
    fetch(`${cfg.phHost}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: cfg.phToken, event, properties: { distinct_id: 'crm-hub', ...props } }),
    }).catch(() => {});
  },
};

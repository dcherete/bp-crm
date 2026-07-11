import { useStore } from '../store';

const call = async (method, path, body) => {
  const { cfg } = useStore.getState();
  const res = await fetch(cfg.apiUrl + path, {
    method,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `ApiKey ${cfg.apiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json();
};

export const novu = {
  get: (path) => call('GET', path),
  post: (path, body) => call('POST', path, body),
  patch: (path, body) => call('PATCH', path, body),
  delete: (path) => call('DELETE', path),
};

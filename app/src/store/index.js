import { create } from 'zustand';

const LS = {
  get: (k, d = []) => { try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

const defaultCfg = {
  apiUrl: 'http://localhost:3000',
  apiKey: '',
  phHost: 'https://us.posthog.com',
  phToken: '',
  phApiKey: '',
  phProjectId: '',
  defaultWorkflowId: '',
  defaultWorkflowName: '',
};

export const useStore = create((set, get) => ({
  // ── Settings ────────────────────────────────
  cfg: (() => {
    const saved = LS.get('crm-cfg', {});
    const merged = { ...defaultCfg, ...saved };
    // Don't let empty saved values override working defaults
    Object.keys(defaultCfg).forEach(k => { if (!merged[k] && defaultCfg[k]) merged[k] = defaultCfg[k]; });
    return merged;
  })(),
  saveCfg: (patch) => {
    const cfg = { ...get().cfg, ...patch };
    LS.set('crm-cfg', cfg);
    set({ cfg });
  },

  // ── Campaigns ───────────────────────────────
  camps: LS.get('crm-camps', []),
  addCamp: (camp) => {
    const camps = [...get().camps, { ...camp, createdAt: new Date().toISOString() }];
    LS.set('crm-camps', camps);
    set({ camps });
  },
  updateCamp: (idx, patch) => {
    const camps = get().camps.map((c, i) => i === idx ? { ...c, ...patch } : c);
    LS.set('crm-camps', camps);
    set({ camps });
  },
  deleteCamp: (idx) => {
    const camps = get().camps.filter((_, i) => i !== idx);
    LS.set('crm-camps', camps);
    set({ camps });
  },

  // ── Jornadas ────────────────────────────────
  jornadas: LS.get('crm-jornadas', []),
  addJornada: (j) => {
    const jornadas = [...get().jornadas, { ...j, createdAt: new Date().toISOString() }];
    LS.set('crm-jornadas', jornadas);
    set({ jornadas });
  },

  // ── Templates ───────────────────────────────
  templates: LS.get('crm-email-tpl', []),
  saveTemplates: (templates) => { LS.set('crm-email-tpl', templates); set({ templates }); },

  // ── Unsubscribes ────────────────────────────
  unsubs: LS.get('crm-unsubs', []),
  addUnsub: (email) => {
    if (get().unsubs.find(u => u.email === email)) return;
    const unsubs = [...get().unsubs, { email, date: new Date().toISOString() }];
    LS.set('crm-unsubs', unsubs);
    set({ unsubs });
  },
  removeUnsub: (email) => {
    const unsubs = get().unsubs.filter(u => u.email !== email);
    LS.set('crm-unsubs', unsubs);
    set({ unsubs });
  },

  // ── Suppression ─────────────────────────────
  suppression: LS.get('crm-supp', []),
  addSupp: (email, reason) => {
    if (get().suppression.find(s => s.email === email)) return;
    const suppression = [...get().suppression, { email, reason, date: new Date().toISOString() }];
    LS.set('crm-supp', suppression);
    set({ suppression });
  },
  removeSupp: (email) => {
    const suppression = get().suppression.filter(s => s.email !== email);
    LS.set('crm-supp', suppression);
    set({ suppression });
  },

  // ── Toast ────────────────────────────────────
  toasts: [],
  toast: (message, type = 'info') => {
    const id = Date.now();
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 4000);
  },
}));

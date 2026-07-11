import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { Loading, Empty } from '../../components/ui/Loading';
import { novu } from '../../api/novu';
import { useStore } from '../../store';

const GENERIC_WORKFLOW_ID = 'email-generico-crm';

async function createGenericWorkflow() {
  // Try v2 first
  try {
    const wf = await novu.post('/v2/workflows', {
      name: 'Email Genérico CRM',
      workflowId: GENERIC_WORKFLOW_ID,
      description: 'Workflow padrão para todas as campanhas de email do CRM.',
      steps: [{
        name: 'Enviar Email',
        type: 'email',
        controlValues: {
          subject: '{{payload.subject}}',
          body: '{{payload.body}}',
        },
      }],
      payloadSchema: {
        type: 'object',
        properties: {
          subject: { type: 'string', default: '' },
          body: { type: 'string', default: '' },
        },
      },
    });
    const id = wf.workflowId || wf.identifier || wf._id || GENERIC_WORKFLOW_ID;
    return { id, name: wf.name || 'Email Genérico CRM' };
  } catch {}

  // Fall back to v1
  let groupId = '';
  try {
    const groups = await novu.get('/v1/notification-groups');
    groupId = groups.data?.[0]?._id || '';
  } catch {}

  const wf = await novu.post('/v1/notification-templates', {
    name: 'Email Genérico CRM',
    notificationGroupId: groupId,
    description: 'Workflow padrão para todas as campanhas de email do CRM.',
    steps: [{
      template: {
        type: 'email',
        subject: '{{payload.subject}}',
        content: [{ type: 'text', content: '{{payload.body}}' }],
      },
    }],
  });
  const id = wf.data?.triggers?.[0]?.identifier || wf.data?._id || GENERIC_WORKFLOW_ID;
  return { id, name: 'Email Genérico CRM' };
}

function WorkflowCard({ wf, isDefault, onSetDefault }) {
  const id = wf.workflowId || wf.identifier || wf._id || '';
  const active = wf.status === 'ACTIVE' || wf.active !== false;

  return (
    <div className="card" style={{ borderColor: isDefault ? 'rgba(200,16,46,.35)' : undefined }}>
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{wf.name}</div>
            <code style={{ fontSize: 11 }}>{id}</code>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
            {isDefault && (
              <span className="badge badge-red">⭐ Padrão</span>
            )}
            <span className={`badge ${active ? 'badge-green' : 'badge-gray'}`}>
              {active ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>

        {wf.description && (
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>{wf.description}</div>
        )}

        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
          {(wf.steps || wf._templateId ? ['email'] : []).length > 0 && (
            <span className="badge badge-blue" style={{ marginRight: 6 }}>email</span>
          )}
          {wf.steps?.map?.((s, i) => (
            <span key={i} className="badge badge-gray" style={{ marginRight: 4 }}>
              {s.type || s.template?.type || 'step'}
            </span>
          ))}
        </div>

        {!isDefault && (
          <button className="btn btn-secondary btn-sm" onClick={() => onSetDefault(id, wf.name)}>
            Definir como padrão
          </button>
        )}
      </div>
    </div>
  );
}

export default function WorkflowsPage() {
  const { cfg, saveCfg, toast } = useStore();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await novu.get('/v2/workflows?limit=50').catch(() => novu.get('/v1/workflows?limit=50'));
      setWorkflows(r.data?.workflows || r.workflows || r.data || []);
    } catch {
      setWorkflows([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreateGeneric = async () => {
    if (!cfg.apiKey) {
      toast('Configure a API Key do Novu em Configurações primeiro', 'err');
      window.__openSettings?.();
      return;
    }
    setCreating(true);
    try {
      // Check if already exists
      const existing = workflows.find(w =>
        (w.workflowId || w.identifier || w._id) === GENERIC_WORKFLOW_ID ||
        w.name === 'Email Genérico CRM'
      );
      if (existing) {
        const id = existing.workflowId || existing.identifier || existing._id;
        saveCfg({ defaultWorkflowId: id, defaultWorkflowName: existing.name });
        toast('Workflow já existe — definido como padrão!', 'ok');
        setCreating(false);
        return;
      }

      const { id, name } = await createGenericWorkflow();
      saveCfg({ defaultWorkflowId: id, defaultWorkflowName: name });
      toast('Workflow padrão criado e definido!', 'ok');
      await load();
    } catch (e) {
      toast('Erro ao criar workflow: ' + e.message, 'err');
    }
    setCreating(false);
  };

  const setDefault = (id, name) => {
    saveCfg({ defaultWorkflowId: id, defaultWorkflowName: name });
    toast(`"${name}" definido como workflow padrão`, 'ok');
  };

  const hasDefault = !!cfg.defaultWorkflowId;

  const actions = (
    <button className="btn btn-primary" onClick={handleCreateGeneric} disabled={creating}>
      {creating ? 'Criando...' : '⚡ Criar Workflow Padrão de Email'}
    </button>
  );

  return (
    <Layout title="Workflows" actions={actions}>
      {/* Explanation banner */}
      <div style={{ padding: '16px 20px', background: 'rgba(59,130,246,.07)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 14, marginBottom: 24, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 22, lineHeight: 1, paddingTop: 2 }}>💡</div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Como usar workflows</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
            Um <strong style={{ color: 'var(--text)' }}>workflow padrão</strong> é tudo que você precisa para todas as campanhas de email.
            Ele usa <code>{'{{payload.subject}}'}</code> e <code>{'{{payload.body}}'}</code> como variáveis —
            o CRM preenche o conteúdo real em cada disparo. Clique em <strong style={{ color: 'var(--text)' }}>Criar Workflow Padrão</strong> e
            nunca mais precisará pensar nisso.
          </div>
        </div>
      </div>

      {/* Default workflow status */}
      {hasDefault ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(22,163,74,.07)', border: '1px solid rgba(22,163,74,.2)', borderRadius: 12, marginBottom: 22, fontSize: 13 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
          <span>Workflow padrão: <strong>{cfg.defaultWorkflowName || cfg.defaultWorkflowId}</strong></span>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>— selecionado automaticamente em novas campanhas.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--yel-lt)', border: '1px solid var(--yel-bd)', borderRadius: 12, marginBottom: 22, fontSize: 13 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--yellow)', flexShrink: 0 }} />
          <span style={{ color: 'var(--yellow)' }}>Nenhum workflow padrão definido.</span>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>Clique em "Criar Workflow Padrão" acima para configurar em 1 clique.</span>
        </div>
      )}

      {loading ? <Loading /> : workflows.length === 0 ? (
        <Empty
          icon={<svg width="48" height="48" viewBox="0 0 44 44" fill="none"><rect x="6" y="6" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="1.8"/><path d="M14 16h16M14 22h10M14 28h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          title="Nenhum workflow no Novu"
          desc='Clique em "Criar Workflow Padrão de Email" para começar.'
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {workflows.map((wf, i) => {
            const id = wf.workflowId || wf.identifier || wf._id;
            return (
              <WorkflowCard
                key={i}
                wf={wf}
                isDefault={cfg.defaultWorkflowId === id}
                onSetDefault={setDefault}
              />
            );
          })}
        </div>
      )}
    </Layout>
  );
}

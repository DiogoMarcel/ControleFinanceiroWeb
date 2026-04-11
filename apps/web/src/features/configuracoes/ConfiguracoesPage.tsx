import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';

// ── Tipos ──────────────────────────────────────────────────────────────────

interface Membro { idmembrofamilia: number; nome: string; }
interface Credor { idcredor: number; nome: string; }
interface Tag    { idtags: number; descricao: string | null; }

// ── Componente genérico de lista editável ──────────────────────────────────

interface Item { id: number; label: string; }

interface CrudSectionProps {
  title: string;
  items: Item[];
  isLoading: boolean;
  isAdmin: boolean;
  onCreate: (value: string) => Promise<void>;
  onUpdate: (id: number, value: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

function CrudSection({ title, items, isLoading, isAdmin, onCreate, onUpdate, onDelete }: CrudSectionProps) {
  const [novoValor, setNovoValor] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoValor, setEditandoValor] = useState('');
  const [deletandoId, setDeletandoId] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function handleCreate() {
    if (!novoValor.trim()) return;
    setSalvando(true);
    setErro('');
    try {
      await onCreate(novoValor.trim());
      setNovoValor('');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar');
    } finally {
      setSalvando(false);
    }
  }

  function startEdit(item: Item) {
    setEditandoId(item.id);
    setEditandoValor(item.label);
    setErro('');
  }

  async function handleUpdate() {
    if (!editandoValor.trim() || editandoId === null) return;
    setSalvando(true);
    setErro('');
    try {
      await onUpdate(editandoId, editandoValor.trim());
      setEditandoId(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    setSalvando(true);
    setErro('');
    try {
      await onDelete(id);
      setDeletandoId(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir');
    } finally {
      setSalvando(false);
    }
  }

  const inputClass = "flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const btnIcon = "p-1.5 rounded-lg transition-colors";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-4">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>

      {/* Campo nova entrada */}
      {isAdmin && (
        <div className="flex gap-2">
          <input
            value={novoValor}
            onChange={(e) => setNovoValor(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder={`Novo ${title.toLowerCase().replace('s', '')}...`}
            className={inputClass}
          />
          <button
            onClick={handleCreate}
            disabled={salvando || !novoValor.trim()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>
      )}

      {/* Erro */}
      {erro && (
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{erro}</p>
      )}

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
          Nenhum registro cadastrado.
        </p>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 py-2">
              {editandoId === item.id ? (
                <>
                  <input
                    autoFocus
                    value={editandoValor}
                    onChange={(e) => setEditandoValor(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(); if (e.key === 'Escape') setEditandoId(null); }}
                    className={inputClass}
                  />
                  <button onClick={handleUpdate} disabled={salvando}
                    className={`${btnIcon} text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50`}>
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditandoId(null)}
                    className={`${btnIcon} text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700`}>
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : deletandoId === item.id ? (
                <>
                  <span className="flex-1 text-sm text-slate-500 dark:text-slate-400 truncate">
                    Excluir <strong className="text-slate-700 dark:text-slate-200">{item.label}</strong>?
                  </span>
                  <button onClick={() => handleDelete(item.id)} disabled={salvando}
                    className={`${btnIcon} text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50`}>
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeletandoId(null)}
                    className={`${btnIcon} text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700`}>
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-slate-800 dark:text-slate-200 truncate">{item.label}</span>
                  {isAdmin && (
                    <>
                      <button onClick={() => startEdit(item)}
                        className={`${btnIcon} text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeletandoId(item.id)}
                        className={`${btnIcon} text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────

export function ConfiguracoesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const qc = useQueryClient();

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: membros = [], isLoading: loadMembros } = useQuery<Membro[]>({
    queryKey: ['membros'],
    queryFn: async () => (await api.get('/membros')).data,
  });

  const { data: credores = [], isLoading: loadCredores } = useQuery<Credor[]>({
    queryKey: ['credores'],
    queryFn: async () => (await api.get('/credores')).data,
  });

  const { data: tags = [], isLoading: loadTags } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: async () => (await api.get('/tags')).data,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const membroCreate = useMutation({ mutationFn: (nome: string) => api.post('/membros', { nome }), onSuccess: () => qc.invalidateQueries({ queryKey: ['membros'] }) });
  const membroUpdate = useMutation({ mutationFn: ({ id, nome }: { id: number; nome: string }) => api.put(`/membros/${id}`, { nome }), onSuccess: () => qc.invalidateQueries({ queryKey: ['membros'] }) });
  const membroDelete = useMutation({ mutationFn: (id: number) => api.delete(`/membros/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['membros'] }) });

  const credorCreate = useMutation({ mutationFn: (nome: string) => api.post('/credores', { nome }), onSuccess: () => qc.invalidateQueries({ queryKey: ['credores'] }) });
  const credorUpdate = useMutation({ mutationFn: ({ id, nome }: { id: number; nome: string }) => api.put(`/credores/${id}`, { nome }), onSuccess: () => qc.invalidateQueries({ queryKey: ['credores'] }) });
  const credorDelete = useMutation({ mutationFn: (id: number) => api.delete(`/credores/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['credores'] }) });

  const tagCreate = useMutation({ mutationFn: (descricao: string) => api.post('/tags', { descricao }), onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }) });
  const tagUpdate = useMutation({ mutationFn: ({ id, descricao }: { id: number; descricao: string }) => api.put(`/tags/${id}`, { descricao }), onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }) });
  const tagDelete = useMutation({ mutationFn: (id: number) => api.delete(`/tags/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }) });

  // ── Helpers para extrair mensagem de erro da API ──────────────────────────

  function apiError(e: unknown): Error {
    if (e && typeof e === 'object' && 'response' in e) {
      const r = (e as { response?: { data?: { error?: string } } }).response;
      if (r?.data?.error) return new Error(r.data.error);
    }
    return e instanceof Error ? e : new Error('Erro interno');
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Configurações</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Gerencie membros da família, credores e tags
        </p>
      </div>

      {/* Grid das seções */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Membros */}
        <CrudSection
          title="Membros"
          items={membros.map((m) => ({ id: m.idmembrofamilia, label: m.nome }))}
          isLoading={loadMembros}
          isAdmin={isAdmin}
          onCreate={async (nome) => { try { await membroCreate.mutateAsync(nome); } catch (e) { throw apiError(e); } }}
          onUpdate={async (id, nome) => { try { await membroUpdate.mutateAsync({ id, nome }); } catch (e) { throw apiError(e); } }}
          onDelete={async (id) => { try { await membroDelete.mutateAsync(id); } catch (e) { throw apiError(e); } }}
        />

        {/* Credores */}
        <CrudSection
          title="Credores"
          items={credores.map((c) => ({ id: c.idcredor, label: c.nome }))}
          isLoading={loadCredores}
          isAdmin={isAdmin}
          onCreate={async (nome) => { try { await credorCreate.mutateAsync(nome); } catch (e) { throw apiError(e); } }}
          onUpdate={async (id, nome) => { try { await credorUpdate.mutateAsync({ id, nome }); } catch (e) { throw apiError(e); } }}
          onDelete={async (id) => { try { await credorDelete.mutateAsync(id); } catch (e) { throw apiError(e); } }}
        />

        {/* Tags */}
        <CrudSection
          title="Tags"
          items={tags.map((t) => ({ id: t.idtags, label: t.descricao ?? '' }))}
          isLoading={loadTags}
          isAdmin={isAdmin}
          onCreate={async (descricao) => { try { await tagCreate.mutateAsync(descricao); } catch (e) { throw apiError(e); } }}
          onUpdate={async (id, descricao) => { try { await tagUpdate.mutateAsync({ id, descricao }); } catch (e) { throw apiError(e); } }}
          onDelete={async (id) => { try { await tagDelete.mutateAsync(id); } catch (e) { throw apiError(e); } }}
        />

      </div>
    </div>
  );
}

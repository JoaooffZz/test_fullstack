import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../context/store';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Users as UsersIcon, Plus, ShieldAlert, Edit2, Check, X } from 'lucide-react';

interface UserItem {
  uuid: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  status: 'ATIVO' | 'INATIVO';
}

export const Users: React.FC = () => {
  const apiCall = useAuthStore((state) => state.apiCall);
  const currentUser = useAuthStore((state) => state.user);

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUserUuid, setSelectedUserUuid] = useState('');
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'EDITOR' | 'VIEWER'>('EDITOR');
  const [status, setStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = async () => {
    if (currentUser?.role !== 'ADMIN') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiCall('/v1/users');
      setUsers(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedUserUuid('');
    setName('');
    setEmail('');
    setPassword('');
    setRole('EDITOR');
    setStatus('ATIVO');
    setShowModal(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setModalMode('edit');
    setSelectedUserUuid(user.uuid);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); // don't fill password on edit
    setRole(user.role);
    setStatus(user.status);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Nome e email são obrigatórios.');
      return;
    }

    setFormLoading(true);
    try {
      if (modalMode === 'create') {
        if (!password || password.length < 8) {
          alert('Senha de no mínimo 8 caracteres é obrigatória para criação.');
          setFormLoading(false);
          return;
        }

        await apiCall('/v1/users', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, role, status }),
        });
      } else {
        await apiCall(`/v1/users/${selectedUserUuid}`, {
          method: 'PUT',
          body: JSON.stringify({ name, email, role, status }),
        });
      }

      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar usuário.');
    } finally {
      setFormLoading(false);
    }
  };

  // If user is not admin, deny access immediately
  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex justify-center">
        <Card variant="light" className="text-center p-8 flex flex-col items-center gap-4 max-w-[480px] border-accent-tomato/20">
          <div className="p-3 bg-accent-tomato/10 text-accent-tomato rounded-full border border-accent-tomato/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">Acesso Restrito</h2>
            <p className="text-xs text-ink-mute mt-2">
              Apenas administradores do sistema têm permissão para acessar a gestão de usuários da empresa.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink display-md flex items-center gap-2">
            <UsersIcon className="w-8 h-8 text-primary" /> Usuários da Empresa
          </h1>
          <p className="text-ink-mute mt-1">Cadastre e configure permissões de acesso da sua equipe.</p>
        </div>
        <Button onClick={handleOpenCreate} variant="primary" className="flex items-center gap-1.5 self-start">
          <Plus className="w-4 h-4" /> Novo Usuário
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-accent-tomato/10 border border-accent-tomato/20 rounded-[8px] text-accent-tomato text-sm font-medium">
          {error}
        </div>
      )}

      {/* Table of Users */}
      <Card variant="light" className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-xs text-ink-mute">Nenhum usuário cadastrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-canvas-soft border-b border-hairline text-ink-mute text-xs font-semibold uppercase">
                  <th className="p-4">Nome</th>
                  <th className="p-4">E-mail</th>
                  <th className="p-4">Função / Perfil</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-cool text-sm text-ink-secondary">
                {users.map((u) => (
                  <tr key={u.uuid} className="hover:bg-canvas-soft/30 transition-colors">
                    <td className="p-4 font-semibold">{u.name}</td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-canvas border border-hairline font-mono text-xs font-bold text-ink-mute-2">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        u.status === 'ATIVO' ? 'bg-primary/10 text-primary-deep' : 'bg-accent-tomato/15 text-accent-tomato'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        onClick={() => handleOpenEdit(u)}
                        variant="outline"
                        className="py-1.5 px-3 flex items-center gap-1 text-xs ml-auto border-hairline-strong hover:bg-canvas-soft"
                      >
                        <Edit2 className="w-3 h-3" /> Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-canvas w-full max-w-[480px] rounded-[12px] border border-hairline shadow-[0_16px_48px_rgba(0,0,0,0.12)] p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                {modalMode === 'create' ? <Plus className="w-5 h-5 text-primary" /> : <Edit2 className="w-4 h-4 text-primary" />}
                {modalMode === 'create' ? 'Adicionar Novo Usuário' : 'Editar Usuário'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-ink-mute hover:bg-canvas-soft rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Nome Completo"
                placeholder="Ex: João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="E-mail Corporativo"
                placeholder="Ex: joao@suaempresa.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {modalMode === 'create' && (
                <Input
                  label="Senha (mínimo 8 caracteres)"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="w-full flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink-mute">Perfil / Função</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="bg-canvas text-ink text-sm rounded-[6px] border border-hairline px-3 py-2 outline-none w-full"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>

                <div className="w-full flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink-mute">Status da Conta</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="bg-canvas text-ink text-sm rounded-[6px] border border-hairline px-3 py-2 outline-none w-full"
                  >
                    <option value="ATIVO">ATIVO</option>
                    <option value="INATIVO">INATIVO</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <Button type="button" onClick={() => setShowModal(false)} variant="outline" disabled={formLoading}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={formLoading}>
                  {formLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

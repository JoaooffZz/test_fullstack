import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../context/store';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { HardHat, Search, Filter, Plus, Calendar, MapPin, DollarSign, X, Check } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface ObraItem {
  uuid: string;
  name: string;
  address: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budgetTotal: number | null;
  responsibleCnpj: string | null;
  contractUuid: string | null;
  costTotal: number;
}

interface ContractSummary {
  uuid: string;
  title: string;
}

export const Obras: React.FC = () => {
  const apiCall = useAuthStore((state) => state.apiCall);
  const navigate = useNavigate();

  const [obras, setObras] = useState<ObraItem[]>([]);
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetTotal, setBudgetTotal] = useState(''); // in BRL decimal format
  const [responsibleCnpj, setResponsibleCnpj] = useState('');
  const [contractUuid, setContractUuid] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const fetchObrasAndContracts = async () => {
    setLoading(true);
    try {
      const obrasRes = await apiCall('/v1/obras');
      setObras(obrasRes);

      // Load contracts to populate contractUuid selection
      const contractsRes = await apiCall('/v1/contracts?limit=100');
      setContracts(contractsRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados operacionais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObrasAndContracts();
  }, []);

  const formatCnpj = (value: string) => {
    const raw = value.replace(/\D/g, '').substring(0, 14);
    if (raw.length <= 2) return raw;
    if (raw.length <= 5) return `${raw.substring(0, 2)}.${raw.substring(2)}`;
    if (raw.length <= 8) return `${raw.substring(0, 2)}.${raw.substring(2, 5)}.${raw.substring(5)}`;
    if (raw.length <= 12) return `${raw.substring(0, 2)}.${raw.substring(2, 5)}.${raw.substring(5, 8)}/${raw.substring(8)}`;
    return `${raw.substring(0, 2)}.${raw.substring(2, 5)}.${raw.substring(5, 8)}/${raw.substring(8, 12)}-${raw.substring(12)}`;
  };

  const handleCreateObra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) {
      alert('Nome e endereço da obra são obrigatórios.');
      return;
    }

    setCreateLoading(true);
    try {
      const rawCnpj = responsibleCnpj.replace(/\D/g, '');
      const numericBudget = budgetTotal ? Math.round(parseFloat(budgetTotal) * 100) : null;

      await apiCall('/v1/obras', {
        method: 'POST',
        body: JSON.stringify({
          name,
          address,
          description: description || null,
          contractUuid: contractUuid || null,
          startDate: startDate || null,
          endDate: endDate || null,
          budgetTotal: numericBudget,
          responsibleCnpj: rawCnpj || null,
        }),
      });

      setShowCreateModal(false);
      setName('');
      setAddress('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setBudgetTotal('');
      setResponsibleCnpj('');
      setContractUuid('');

      // Refresh list
      const obrasRes = await apiCall('/v1/obras');
      setObras(obrasRes);
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar obra.');
    } finally {
      setCreateLoading(false);
    }
  };

  const formatCurrency = (val: number | null) => {
    if (val === null) return '-';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'EM_EXECUCAO':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary-deep">Em Execução</span>;
      case 'PLANEJAMENTO':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-hairline-cool-3 text-ink-mute">Planejamento</span>;
      case 'CONCLUIDA':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-accent-indigo/10 text-accent-indigo">Concluída</span>;
      case 'CANCELADA':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-accent-tomato/10 text-accent-tomato">Cancelada</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-hairline text-ink-mute">{statusStr}</span>;
    }
  };

  const filteredObras = obras.filter((o) => {
    const matchesSearch = o.name.toLowerCase().includes(search.toLowerCase()) || 
                          o.address.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === '' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink display-md flex items-center gap-2">
            <HardHat className="w-8 h-8 text-primary" /> Obras
          </h1>
          <p className="text-ink-mute mt-1">Monitore o cronograma, orçamentos e vistorias técnicas.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="primary" className="flex items-center gap-1.5 self-start">
          <Plus className="w-4 h-4" /> Nova Obra
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-accent-tomato/10 border border-accent-tomato/20 rounded-[8px] text-accent-tomato text-sm font-medium">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card variant="light" className="p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-ink-mute-2" />
          <input
            type="text"
            placeholder="Buscar por nome ou endereço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-canvas text-ink text-sm rounded-[6px] border border-hairline focus:border-primary focus:ring-1 focus:ring-primary pl-9 pr-3 py-2.5 transition-all outline-none"
          />
        </div>

        <div className="w-full md:w-56 flex items-center gap-1.5 bg-canvas px-3 py-2.5 border border-hairline rounded-[6px]">
          <Filter className="w-4 h-4 text-ink-mute" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-ink-secondary w-full"
          >
            <option value="">Todos os Status</option>
            <option value="PLANEJAMENTO">Planejamento</option>
            <option value="EM_EXECUCAO">Em Execução</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>
      </Card>

      {/* Grid of Obras cards */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredObras.length === 0 ? (
        <Card variant="light" className="text-center py-16 flex flex-col items-center gap-4">
          <HardHat className="w-12 h-12 text-ink-mute-2" />
          <div>
            <h3 className="text-sm font-bold text-ink">Nenhuma obra cadastrada</h3>
            <p className="text-xs text-ink-mute mt-1">Crie sua primeira obra para começar a gerenciar custos e cronograma.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredObras.map((o) => {
            // Calculate spent percentage
            const budget = o.budgetTotal || 0;
            const spent = o.costTotal || 0;
            const consumedPercent = budget > 0 ? (spent / budget) * 100 : 0;
            
            return (
              <Card key={o.uuid} variant="light" className="flex flex-col justify-between hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-hairline-cool hover:border-hairline transition-all duration-200">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    {getStatusBadge(o.status)}
                    <span className="text-[10px] text-ink-mute block font-mono">
                      Venc: {o.endDate ? new Date(o.endDate).toLocaleDateString('pt-BR') : '-'}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-ink-secondary mb-1">
                    <Link to={`/obras/${o.uuid}`} className="hover:underline">{o.name}</Link>
                  </h3>
                  
                  <p className="text-xs text-ink-mute flex items-center gap-1 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-ink-mute-2 shrink-0" />
                    <span className="truncate">{o.address}</span>
                  </p>

                  {/* Spent vs Budget Progress Chart */}
                  <div className="flex flex-col gap-1.5 border-t border-hairline-cool pt-4 mb-2">
                    <div className="flex justify-between text-xs font-semibold text-ink-secondary">
                      <span>Consumido</span>
                      <span className={consumedPercent > 100 ? 'text-accent-tomato font-bold' : 'text-primary-deep'}>
                        {consumedPercent.toFixed(1)}%
                      </span>
                    </div>

                    <div className="w-full bg-hairline-cool h-2.5 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          consumedPercent > 100
                            ? 'bg-accent-tomato'
                            : consumedPercent >= 80
                              ? 'bg-accent-yellow'
                              : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(consumedPercent, 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-[10px] text-ink-mute">
                      <span>Custo: {formatCurrency(spent)}</span>
                      <span>Orçamento: {formatCurrency(budget)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-hairline-cool flex justify-end">
                  <Button
                    onClick={() => navigate(`/obras/${o.uuid}`)}
                    variant="outline"
                    className="w-full py-1.5 text-xs flex items-center justify-center gap-1 border-hairline-strong hover:bg-canvas-soft"
                  >
                    Painel da Obra
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Obra Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-canvas w-full max-w-[550px] rounded-[12px] border border-hairline shadow-[0_16px_48px_rgba(0,0,0,0.12)] p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <HardHat className="w-5 h-5 text-primary" /> Cadastrar Nova Obra
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-ink-mute hover:bg-canvas-soft rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateObra} className="flex flex-col gap-4">
              <Input
                label="Nome da Obra / Identificação"
                placeholder="Ex: Condomínio Jardins - Fase 1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Endereço Completo"
                placeholder="Ex: Av. Paulista, 1000 - São Paulo/SP"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />

              <Input
                label="Descrição / Escopo"
                placeholder="Breve descrição da obra..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Data Início"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  label="Previsão Término"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Orçamento Previsto (R$)"
                  type="number"
                  placeholder="Ex: 150000.00"
                  value={budgetTotal}
                  onChange={(e) => setBudgetTotal(e.target.value)}
                />
                <Input
                  label="CNPJ do Responsável"
                  placeholder="Ex: 00.000.000/0000-00"
                  value={responsibleCnpj}
                  onChange={(e) => setResponsibleCnpj(formatCnpj(e.target.value))}
                />
              </div>

              <div className="w-full flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-mute">Contrato da Empresa Vinculado (Opcional)</label>
                <select
                  value={contractUuid}
                  onChange={(e) => setContractUuid(e.target.value)}
                  className="bg-canvas text-ink text-sm rounded-[6px] border border-hairline focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2 transition-all outline-none w-full"
                >
                  <option value="">Nenhum</option>
                  {contracts.map(c => (
                    <option key={c.uuid} value={c.uuid}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <Button type="button" onClick={() => setShowCreateModal(false)} variant="outline" disabled={createLoading}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={createLoading}>
                  {createLoading ? 'Cadastrando...' : 'Cadastrar Obra'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

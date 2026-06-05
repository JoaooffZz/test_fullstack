import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../context/store';
import { Card } from '../components/Card';
import { FileText, HardHat, TrendingUp, DollarSign, ShoppingBag, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardData {
  contracts: {
    total: number;
    ativos: number;
    vencendo30d: number;
    aguardandoAssinatura: number;
    encerrados: number;
  };
  obras: {
    total: number;
    emExecucao: number;
    concluidas: number;
    orcamentoConsolidado: number;
    custoRealizadoConsolidado: number;
  };
  purchaseOrders: {
    total: number;
    aguardandoAprovacao: number;
  };
  recentContracts: Array<{
    uuid: string;
    title: string;
    type: string;
    status: string;
    relatedParty: string;
    value: number;
    endDate: string | null;
  }>;
  recentObras: Array<{
    uuid: string;
    name: string;
    status: string;
    budgetTotal: number | null;
    address: string;
  }>;
}

export const Dashboard: React.FC = () => {
  const apiCall = useAuthStore((state) => state.apiCall);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await apiCall('/v1/dashboard');
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [apiCall]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getContractStatusBadge = (status: string) => {
    switch (status) {
      case 'ASSINADO':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary-deep">Assinado</span>;
      case 'AGUARDANDO_ASSINATURA':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-accent-yellow/15 text-amber-600">Aguardando</span>;
      case 'RASCUNHO':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-hairline-cool-3 text-ink-mute">Rascunho</span>;
      case 'ENCERRADO':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-accent-tomato/10 text-accent-tomato">Encerrado</span>;
      case 'VENCENDO':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-accent-yellow/20 text-amber-700 animate-pulse">Vencendo</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-hairline text-ink-mute">{status}</span>;
    }
  };

  const getObraStatusBadge = (status: string) => {
    switch (status) {
      case 'EM_EXECUCAO':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary-deep">Em Execução</span>;
      case 'PLANEJAMENTO':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-hairline-cool-3 text-ink-mute">Planejamento</span>;
      case 'CONCLUIDA':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-accent-indigo/10 text-accent-indigo">Concluída</span>;
      case 'CANCELADA':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-accent-tomato/10 text-accent-tomato">Cancelada</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-hairline text-ink-mute">{status}</span>;
    }
  };

  const calculateDaysLeft = (endDateStr: string | null) => {
    if (!endDateStr) return null;
    const end = new Date(endDateStr);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="p-4 bg-accent-tomato/10 border border-accent-tomato/20 rounded-[8px] text-accent-tomato text-sm font-medium">
          {error || 'Erro ao carregar dados do dashboard'}
        </div>
      </div>
    );
  }

  const budgetConsumido = data.obras.orcamentoConsolidado > 0 
    ? (data.obras.custoRealizadoConsolidado / data.obras.orcamentoConsolidado) * 100 
    : 0;

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink display-md sm:text-4xl">Dashboard</h1>
        <p className="text-ink-mute mt-1">Visão consolidada financeira e contratual de suas obras.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="light" className="flex items-start gap-4">
          <div className="p-3 rounded-[8px] bg-canvas-soft border border-hairline text-ink">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-medium text-ink-mute uppercase">Contratos Ativos</span>
            <div className="text-2xl font-bold text-ink mt-0.5">{data.contracts.ativos}</div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-xs text-ink-mute">Total: {data.contracts.total}</span>
              {data.contracts.vencendo30d > 0 && (
                <span className="px-1.5 py-0.5 rounded-[4px] bg-accent-tomato/10 text-accent-tomato text-[10px] font-bold flex items-center gap-0.5 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  {data.contracts.vencendo30d} vencendo
                </span>
              )}
            </div>
          </div>
        </Card>

        <Card variant="light" className="flex items-start gap-4">
          <div className="p-3 rounded-[8px] bg-canvas-soft border border-hairline text-ink">
            <HardHat className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-medium text-ink-mute uppercase">Obras em Execução</span>
            <div className="text-2xl font-bold text-ink mt-0.5">{data.obras.emExecucao}</div>
            <div className="text-xs text-ink-mute mt-2">Total de obras: {data.obras.total}</div>
          </div>
        </Card>

        <Card variant="light" className="flex items-start gap-4">
          <div className="p-3 rounded-[8px] bg-canvas-soft border border-hairline text-ink">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-medium text-ink-mute uppercase">Orçamento Previsto</span>
            <div className="text-2xl font-bold text-ink mt-0.5">{formatCurrency(data.obras.orcamentoConsolidado)}</div>
            <div className="text-xs text-ink-mute mt-2">Total planejado</div>
          </div>
        </Card>

        <Card variant="light" className="flex items-start gap-4">
          <div className="p-3 rounded-[8px] bg-canvas-soft border border-hairline text-ink">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-medium text-ink-mute uppercase">Custo Realizado</span>
            <div className="text-2xl font-bold text-ink mt-0.5">{formatCurrency(data.obras.custoRealizadoConsolidado)}</div>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-full bg-hairline-cool h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${budgetConsumido > 100 ? 'bg-accent-tomato' : 'bg-primary'}`} 
                  style={{ width: `${Math.min(budgetConsumido, 100)}%` }}
                ></div>
              </div>
              <span className={`text-[10px] font-bold shrink-0 ${budgetConsumido > 100 ? 'text-accent-tomato' : 'text-primary-deep'}`}>
                {budgetConsumido.toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Row of Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coluna Esquerda - Contratos Recentes */}
        <Card variant="light" className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Contratos Recentes
            </h2>
            <Link to="/contratos" className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
              Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline text-ink-mute text-xs font-semibold">
                  <th className="pb-3">Título</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Vigência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-cool text-sm">
                {data.recentContracts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-xs text-ink-mute">Nenhum contrato cadastrado.</td>
                  </tr>
                ) : (
                  data.recentContracts.map((c) => {
                    const daysLeft = calculateDaysLeft(c.endDate);
                    return (
                      <tr key={c.uuid} className="hover:bg-canvas-soft/40 transition-colors">
                        <td className="py-3 font-medium text-ink-secondary">
                          <Link to={`/contratos`} className="hover:underline block">{c.title}</Link>
                          <span className="text-[10px] text-ink-mute block mt-0.5">{c.relatedParty}</span>
                        </td>
                        <td className="py-3">{getContractStatusBadge(c.status)}</td>
                        <td className="py-3 text-right text-xs">
                          {daysLeft !== null ? (
                            daysLeft > 0 ? (
                              <span className={daysLeft <= 30 ? 'text-amber-600 font-bold' : 'text-ink-mute'}>
                                {daysLeft} dias restantes
                              </span>
                            ) : (
                              <span className="text-accent-tomato font-bold">Vencido</span>
                            )
                          ) : (
                            <span className="text-ink-mute">Sem prazo</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Coluna Direita - Obras Recentes */}
        <Card variant="light" className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <HardHat className="w-4 h-4 text-primary" /> Obras Recentes
            </h2>
            <Link to="/obras" className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
              Ver todas <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {data.recentObras.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-mute">Nenhuma obra cadastrada.</div>
            ) : (
              data.recentObras.map((o) => (
                <div key={o.uuid} className="p-3 border border-hairline-cool rounded-[8px] hover:border-hairline transition-colors flex items-center justify-between">
                  <div>
                    <Link to={`/obras/${o.uuid}`} className="font-semibold text-sm text-ink-secondary hover:underline">{o.name}</Link>
                    <span className="text-xs text-ink-mute block mt-0.5">{o.address}</span>
                  </div>
                  <div className="text-right">
                    {getObraStatusBadge(o.status)}
                    <span className="text-xs text-ink-mute block mt-1">
                      Orçamento: {o.budgetTotal ? formatCurrency(Number(o.budgetTotal) / 100) : 'R$ 0,00'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

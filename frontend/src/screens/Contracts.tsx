import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../context/store';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { FileText, Plus, Search, Filter, Download, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ContractItem {
  uuid: string;
  title: string;
  type: string;
  status: string;
  relatedParty: string;
  relatedPartyEmail: string;
  value: number | null;
  startDate: string | null;
  endDate: string | null;
  daysRemaining: number | null;
}

export const Contracts: React.FC = () => {
  const apiCall = useAuthStore((state) => state.apiCall);
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();

  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filters State
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) queryParams.set('search', search);
      if (type) queryParams.set('type', type);
      if (status) queryParams.set('status', status);

      const response = await apiCall(`/v1/contracts?${queryParams.toString()}`);
      setContracts(response.data);
      setTotalPages(response.totalPages);
      setTotalItems(response.total);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar contratos');
    } finally {
      setLoading(false);
    }
  }, [apiCall, page, search, type, status]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleExportCSV = () => {
    const queryParams = new URLSearchParams({
      format: 'csv',
    });
    if (status) queryParams.set('status', status);
    if (type) queryParams.set('type', type);
    
    // Open in a new tab with token auth handled or trigger direct download
    const url = `http://localhost:3001/v1/reports/contracts?${queryParams.toString()}`;
    
    // Fetch and download in JS to inject Bearer token header
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.blob())
    .then(blob => {
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'relatorio_contratos.csv';
      link.click();
    })
    .catch(err => {
      alert('Erro ao exportar CSV: ' + err.message);
    });
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'ASSINADO':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary-deep">Assinado</span>;
      case 'AGUARDANDO_ASSINATURA':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-accent-yellow/15 text-amber-600">Aguardando Assinatura</span>;
      case 'RASCUNHO':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-hairline-cool-3 text-ink-mute">Rascunho</span>;
      case 'ENCERRADO':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-accent-tomato/10 text-accent-tomato">Encerrado</span>;
      case 'VENCENDO':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-accent-yellow/20 text-amber-700 animate-pulse">Vencendo</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-hairline text-ink-mute">{statusStr}</span>;
    }
  };

  const formatCurrency = (val: number | null) => {
    if (val === null) return '-';
    // The contract values are returned in cents from DB, but PrismaContractRepository toDomain handles:
    // Actually let's look at what value contains.
    // In database/PrismaContractRepository, value is read as Number(val)/100? Let's check or handle it cleanly.
    // Let's assume standard value returned is ready for formatting.
    return (Number(val) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink display-md flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" /> Contratos
          </h1>
          <p className="text-ink-mute mt-1">Gerencie a vigência, assinaturas e termos aditivos de contratos.</p>
        </div>
        
        <div className="flex gap-2 self-start">
          <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-1.5 py-2">
            <Download className="w-4 h-4" /> Exportar CSV
          </Button>
          <Button onClick={() => navigate('/contratos/novo')} variant="primary" className="flex items-center gap-1.5 py-2">
            <Plus className="w-4 h-4" /> Novo Contrato
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-accent-tomato/10 border border-accent-tomato/20 rounded-[8px] text-accent-tomato text-sm font-medium">
          {error}
        </div>
      )}

      {/* Filters Card */}
      <Card variant="light" className="p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-ink-mute-2" />
          <input
            type="text"
            placeholder="Buscar por título ou parte relacionada..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-canvas text-ink text-sm rounded-[6px] border border-hairline focus:border-primary focus:ring-1 focus:ring-primary pl-9 pr-3 py-2.5 transition-all outline-none"
          />
        </div>
        
        <div className="w-full md:w-auto flex gap-4">
          <div className="w-full md:w-48 flex items-center gap-1.5 bg-canvas px-3 py-2.5 border border-hairline rounded-[6px]">
            <Filter className="w-4 h-4 text-ink-mute" />
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="bg-transparent border-none outline-none text-sm text-ink-secondary w-full"
            >
              <option value="">Todos os Tipos</option>
              <option value="SERVICO">Serviço</option>
              <option value="TRABALHO">Trabalho</option>
              <option value="OBRA">Obra</option>
              <option value="LOCACAO">Locação</option>
              <option value="OUTRO">Outros</option>
            </select>
          </div>

          <div className="w-full md:w-48 flex items-center gap-1.5 bg-canvas px-3 py-2.5 border border-hairline rounded-[6px]">
            <Filter className="w-4 h-4 text-ink-mute" />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-transparent border-none outline-none text-sm text-ink-secondary w-full"
            >
              <option value="">Todos os Status</option>
              <option value="RASCUNHO">Rascunho</option>
              <option value="AGUARDANDO_ASSINATURA">Aguardando Assinatura</option>
              <option value="ASSINADO">Assinado</option>
              <option value="VENCENDO">Vencendo</option>
              <option value="ENCERRADO">Encerrado</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Contracts Table */}
      <Card variant="light" className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : contracts.length === 0 ? (
          <div className="py-16 text-center text-xs text-ink-mute flex flex-col items-center gap-3">
            <FileText className="w-12 h-12 text-ink-mute-2" />
            <span>Nenhum contrato encontrado correspondendo aos critérios.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline bg-canvas-soft text-ink-mute text-xs font-semibold uppercase">
                  <th className="p-4">Título</th>
                  <th className="p-4">Parte Relacionada</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Vigência</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-cool text-sm">
                {contracts.map((c) => (
                  <tr key={c.uuid} className="hover:bg-canvas-soft/30 transition-colors">
                    <td className="p-4 font-semibold text-ink-secondary">
                      {c.title}
                      <span className="text-[10px] text-ink-mute block font-mono font-normal mt-0.5">{c.type}</span>
                    </td>
                    <td className="p-4 text-ink-secondary">
                      {c.relatedParty}
                      <span className="text-[10px] text-ink-mute block font-normal mt-0.5">{c.relatedPartyEmail}</span>
                    </td>
                    <td className="p-4 font-medium text-ink-secondary">{formatCurrency(c.value)}</td>
                    <td className="p-4 text-ink-mute">
                      <div className="text-xs">Fim: {formatDate(c.endDate)}</div>
                      {c.daysRemaining !== null ? (
                        c.daysRemaining > 0 ? (
                          <span className={`text-[10px] font-bold block mt-0.5 ${c.daysRemaining <= 30 ? 'text-amber-600' : 'text-primary-deep'}`}>
                            {c.daysRemaining} dias restantes
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-accent-tomato block mt-0.5">Expirado</span>
                        )
                      ) : null}
                    </td>
                    <td className="p-4">{getStatusBadge(c.status)}</td>
                    <td className="p-4 text-right">
                      <Button
                        onClick={() => navigate(`/contratos/${c.uuid}`)}
                        variant="outline"
                        className="py-1.5 px-3 flex items-center gap-1 text-xs ml-auto border-hairline-strong hover:bg-canvas-soft"
                      >
                        <Eye className="w-3.5 h-3.5" /> Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-hairline bg-canvas-soft/30 flex items-center justify-between text-xs text-ink-mute">
            <span>
              Mostrando página <b>{page}</b> de <b>{totalPages}</b> ({totalItems} itens no total)
            </span>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                variant="outline"
                className="p-1.5 rounded-[4px] border-hairline-strong cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                variant="outline"
                className="p-1.5 rounded-[4px] border-hairline-strong cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

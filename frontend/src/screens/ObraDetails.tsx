import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { HardHat, ArrowLeft, Calendar, MapPin, DollarSign, ListTodo, Landmark, Eye, Camera, Plus, Trash2, CheckCircle2, AlertTriangle, Upload, X, ShieldAlert } from 'lucide-react';
import { maskCurrency, parseCurrencyToNumber } from '../utils/formatters';
import { toast } from 'sonner';

interface ObraStep {
  uuid: string;
  name: string;
  phase: 'PLANEJAMENTO' | 'EXECUCAO' | 'ENTREGA';
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA';
  sortOrder: number;
}

interface ObraCusto {
  uuid: string;
  description: string;
  category: string;
  value: number;
  date: string;
  receipts?: Array<{ fileUrl: string; fileName: string }>;
}

interface ObraVistoria {
  uuid: string;
  createdAt: string;
  type: 'INICIAL' | 'FINAL';
  description: string | null;
  photos?: Array<{ fileUrl: string; fileName: string }>;
}

interface PurchaseOrder {
  uuid: string;
  number: string;
  status: string;
  supplierName: string;
  deliveryDate: string | null;
  items?: any[];
}

interface ObraDetailsData {
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
  totalSpent: number;
  steps: ObraStep[];
  custos: ObraCusto[];
  vistorias: ObraVistoria[];
  purchaseOrders: PurchaseOrder[];
}

export const ObraDetails: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const apiCall = useAuthStore((state) => state.apiCall);
  const user = useAuthStore((state) => state.user);

  const [obra, setObra] = useState<ObraDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab State: 'checklist' | 'finance' | 'vistorias'
  const [activeTab, setActiveTab] = useState<'checklist' | 'finance' | 'vistorias'>('checklist');

  // Modals state
  const [showCustoModal, setShowCustoModal] = useState(false);
  const [custoDesc, setCustoDesc] = useState('');
  const [custoCat, setCustoCat] = useState('MATERIAL');
  const [custoVal, setCustoVal] = useState('');
  const [custoDate, setCustoDate] = useState('');
  const [custoReceipt, setCustoReceipt] = useState<string | null>(null);
  const [custoReceiptName, setCustoReceiptName] = useState('');
  const [custoLoading, setCustoLoading] = useState(false);

  const [showVistoriaModal, setShowVistoriaModal] = useState(false);
  const [vistoriaType, setVistoriaType] = useState('INICIAL');
  const [vistoriaDesc, setVistoriaDesc] = useState('');
  const [vistoriaPhotos, setVistoriaPhotos] = useState<string[]>([]);
  const [vistoriaLoading, setVistoriaLoading] = useState(false);

  const fetchObraDetails = useCallback(async () => {
    if (!uuid) return;
    setLoading(true);
    try {
      const res = await apiCall(`/v1/obras/${uuid}`);
      setObra(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes da obra');
    } finally {
      setLoading(false);
    }
  }, [uuid, apiCall]);

  useEffect(() => {
    fetchObraDetails();
  }, [fetchObraDetails]);

  // Checklist handler
  const handleToggleStep = async (stepUuid: string, currentStatus: string) => {
    if (!obra || !uuid) return;
    
    // Optimistic status transition
    const nextStatus = currentStatus === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA';
    
    try {
      await apiCall(`/v1/obras/${uuid}/steps/${stepUuid}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      // Refetch details
      const updated = await apiCall(`/v1/obras/${uuid}`);
      setObra(updated);
      toast.success('Etapa do cronograma atualizada!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar etapa.');
    }
  };

  // Launch cost handler
  const handleLaunchCusto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uuid || !custoDesc || !custoVal || !custoDate) return;

    setCustoLoading(true);
    try {
      const valueCents = Math.round(parseCurrencyToNumber(custoVal) * 100);
      await apiCall(`/v1/obras/${uuid}/costs`, {
        method: 'POST',
        body: JSON.stringify({
          description: custoDesc,
          category: custoCat,
          value: valueCents,
          date: custoDate,
          receipt_base64: custoReceipt,
          receipt_name: custoReceiptName || undefined,
        }),
      });

      setShowCustoModal(false);
      setCustoDesc('');
      setCustoVal('');
      setCustoReceipt(null);
      setCustoReceiptName('');
      
      const updated = await apiCall(`/v1/obras/${uuid}`);
      setObra(updated);
      toast.success('Despesa lançada com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao lançar despesa.');
    } finally {
      setCustoLoading(false);
    }
  };

  // Launch vistoria handler
  const handleLaunchVistoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uuid || !vistoriaDesc) return;

    setVistoriaLoading(true);
    try {
      await apiCall(`/v1/obras/${uuid}/vistorias`, {
        method: 'POST',
        body: JSON.stringify({
          type: vistoriaType,
          description: vistoriaDesc,
          photos_base64: vistoriaPhotos,
        }),
      });

      setShowVistoriaModal(false);
      setVistoriaDesc('');
      setVistoriaPhotos([]);
      
      const updated = await apiCall(`/v1/obras/${uuid}`);
      setObra(updated);
      toast.success('Vistoria registrada com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar vistoria.');
    } finally {
      setVistoriaLoading(false);
    }
  };

  const handleDeleteCusto = async (costUuid: string) => {
    if (!uuid) return;
    if (!window.confirm('Tem certeza que deseja excluir este lançamento financeiro?')) return;

    try {
      await apiCall(`/v1/obras/${uuid}/costs/${costUuid}`, {
        method: 'DELETE',
      });
      const updated = await apiCall(`/v1/obras/${uuid}`);
      setObra(updated);
      toast.success('Lançamento financeiro excluído!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir custo.');
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const cleanBase64 = base64String.split(',')[1] || base64String;
      setCustoReceipt(cleanBase64);
      setCustoReceiptName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleVistoriaPhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesList = Array.from(e.target.files);
    
    filesList.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const cleanBase64 = base64String.split(',')[1] || base64String;
        setVistoriaPhotos(prev => [...prev, cleanBase64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const formatCurrency = (val: number | null) => {
    if (val === null) return 'R$ 0,00';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getStepProgress = () => {
    if (!obra || !obra.steps || obra.steps.length === 0) return 0;
    const completed = obra.steps.filter((s) => s.status === 'CONCLUIDA').length;
    return (completed / obra.steps.length) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !obra) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-4 bg-accent-tomato/10 border border-accent-tomato/20 rounded-[8px] text-accent-tomato text-sm font-medium">
          {error || 'Obra não encontrada.'}
        </div>
        <Button onClick={() => navigate('/obras')} className="mt-4">
          Voltar para Obras
        </Button>
      </div>
    );
  }

  const budgetTotalVal = obra.budgetTotal || 0;
  const spentVal = obra.costTotal || 0;
  const consumedPercent = budgetTotalVal > 0 ? (spentVal / budgetTotalVal) * 100 : 0;
  const stepsProgress = getStepProgress();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Back Link */}
      <div>
        <Button variant="link" onClick={() => navigate('/obras')} className="flex items-center gap-1 text-ink-mute hover:text-ink">
          <ArrowLeft className="w-4 h-4" /> Voltar para Obras
        </Button>
      </div>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-hairline pb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            {obra.name}
          </h1>
          <p className="text-xs text-ink-mute mt-1.5 flex items-center gap-1.5">
            <MapPin className="w-4 h-4" /> {obra.address}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => navigate('/purchase-orders/novo', { state: { obraUuid: obra.uuid } })}
            variant="primary"
            className="flex items-center gap-1.5 py-2 text-xs"
          >
            <Plus className="w-4 h-4" /> Emitir Ordem de Compra
          </Button>
        </div>
      </div>

      {/* Main Budget Bar consolidated */}
      <Card variant="light" className="p-5 flex flex-col sm:flex-row gap-6 justify-between items-center bg-canvas-soft border-hairline-cool">
        <div className="flex-1 w-full flex flex-col gap-2">
          <span className="text-xs font-bold text-ink-mute uppercase tracking-wider">Progresso do Cronograma (Checklist)</span>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-hairline-cool h-3 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${stepsProgress}%` }}></div>
            </div>
            <span className="text-xs font-bold text-primary-deep shrink-0">{stepsProgress.toFixed(0)}%</span>
          </div>
        </div>

        <div className="h-px w-full sm:h-12 sm:w-px bg-hairline"></div>

        <div className="flex-1 w-full flex flex-col gap-2">
          <span className="text-xs font-bold text-ink-mute uppercase tracking-wider">Orçamento Consumido</span>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-hairline-cool h-3 rounded-full overflow-hidden">
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
            <span className={`text-xs font-bold shrink-0 ${consumedPercent > 100 ? 'text-accent-tomato' : 'text-primary-deep'}`}>
              {consumedPercent.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-[10px] text-ink-mute-2 font-mono">
            <span>Spent: {formatCurrency(spentVal)}</span>
            <span>Budget: {formatCurrency(budgetTotalVal)}</span>
          </div>
        </div>
      </Card>

      {/* Sub Tabs Navigation */}
      <div className="flex gap-1 border-b border-hairline pb-px">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'checklist'
              ? 'border-primary text-ink'
              : 'border-transparent text-ink-mute hover:text-ink'
          }`}
        >
          Roteiro (Checklist)
        </button>
        <button
          onClick={() => setActiveTab('finance')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'finance'
              ? 'border-primary text-ink'
              : 'border-transparent text-ink-mute hover:text-ink'
          }`}
        >
          Financeiro & O.C.
        </button>
        <button
          onClick={() => setActiveTab('vistorias')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'vistorias'
              ? 'border-primary text-ink'
              : 'border-transparent text-ink-mute hover:text-ink'
          }`}
        >
          Vistorias & Relatórios
        </button>
      </div>

      {/* Tab A: Checklist */}
      {activeTab === 'checklist' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['PLANEJAMENTO', 'EXECUCAO', 'ENTREGA'].map((phaseKey) => {
            const steps = obra.steps?.filter((s) => s.phase === phaseKey) || [];
            
            return (
              <Card key={phaseKey} variant="light" className="flex flex-col h-full gap-4">
                <span className="text-xs font-bold text-ink bg-canvas-soft border border-hairline px-3 py-1.5 rounded-[6px] w-full flex items-center justify-between">
                  <span>Fase: {phaseKey}</span>
                  <span className="text-[10px] text-ink-mute">{steps.filter(s => s.status === 'CONCLUIDA').length}/{steps.length} ok</span>
                </span>

                <div className="flex flex-col gap-2.5">
                  {steps.length === 0 ? (
                    <div className="text-xs text-ink-mute italic py-4">Nenhuma etapa cadastrada.</div>
                  ) : (
                    steps.map((stepItem) => (
                      <label
                        key={stepItem.uuid}
                        className={`p-3 border rounded-[8px] flex items-start gap-3 transition-premium cursor-pointer ${
                          stepItem.status === 'CONCLUIDA'
                            ? 'bg-primary/5 border-primary/20 text-ink-secondary'
                            : 'bg-canvas border-hairline hover:border-hairline-strong text-ink'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={stepItem.status === 'CONCLUIDA'}
                          onChange={() => handleToggleStep(stepItem.uuid, stepItem.status)}
                          className="mt-0.5 rounded text-primary focus:ring-primary w-4.5 h-4.5 border-hairline cursor-pointer shrink-0"
                          disabled={user?.role === 'VIEWER'}
                        />
                        <span className={`text-xs font-medium leading-relaxed ${stepItem.status === 'CONCLUIDA' ? 'line-through text-ink-mute' : ''}`}>
                          {stepItem.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tab B: Financeiro */}
      {activeTab === 'finance' && (
        <div className="flex flex-col gap-8">
          {/* Expenses / Costs section */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-ink flex items-center gap-1.5">
                <Landmark className="w-5 h-5 text-primary" /> Histórico de Lançamento de Custos
              </h3>
              <Button onClick={() => setShowCustoModal(true)} variant="primary" className="flex items-center gap-1 py-1.5 text-xs">
                <Plus className="w-4 h-4" /> Lançar Custo
              </Button>
            </div>

            <Card variant="light" className="p-0 overflow-hidden">
              {obra.custos?.length === 0 ? (
                <div className="text-center py-12 text-xs text-ink-mute">Nenhum custo lançado para esta obra.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-canvas-soft border-b border-hairline text-ink-mute text-xs font-semibold uppercase">
                      <th className="p-4">Data</th>
                      <th className="p-4">Descrição</th>
                      <th className="p-4">Categoria</th>
                      <th className="p-4">Valor</th>
                      <th className="p-4">Comprovante</th>
                      {user?.role === 'ADMIN' && <th className="p-4 text-right">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline-cool text-xs text-ink-secondary">
                    {obra.custos.map((c) => (
                      <tr key={c.uuid} className="hover:bg-canvas-soft/30 transition-colors">
                        <td className="p-4">{new Date(c.date).toLocaleDateString('pt-BR')}</td>
                        <td className="p-4 font-semibold">{c.description}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-canvas border border-hairline font-mono text-[10px]">
                            {c.category}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-ink">{formatCurrency(c.value)}</td>
                        <td className="p-4 text-primary">
                          {c.receipts && c.receipts.length > 0 ? (
                            <a
                              href={c.receipts[0].fileUrl.startsWith('http') ? c.receipts[0].fileUrl : `http://localhost:3001${c.receipts[0].fileUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline font-semibold"
                            >
                              Ver recibo
                            </a>
                          ) : (
                            <span className="text-ink-mute-2">Nenhum</span>
                          )}
                        </td>
                        {user?.role === 'ADMIN' && (
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteCusto(c.uuid)}
                              className="text-accent-tomato hover:bg-accent-tomato/10 p-1.5 rounded transition-colors"
                              title="Remover Custo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>

          {/* Linked POs */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-ink flex items-center gap-1.5">
              <DollarSign className="w-5 h-5 text-primary" /> Ordens de Compra Associadas
            </h3>

            <Card variant="light" className="p-0 overflow-hidden">
              {obra.purchaseOrders?.length === 0 ? (
                <div className="text-center py-12 text-xs text-ink-mute">Nenhuma Ordem de Compra emitida para esta obra.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-canvas-soft border-b border-hairline text-ink-mute text-xs font-semibold uppercase">
                      <th className="p-4">Número</th>
                      <th className="p-4">Fornecedor</th>
                      <th className="p-4">Entrega</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline-cool text-xs text-ink-secondary">
                    {obra.purchaseOrders.map((po) => (
                      <tr key={po.uuid} className="hover:bg-canvas-soft/30 transition-colors">
                        <td className="p-4 font-semibold">{po.number}</td>
                        <td className="p-4">{po.supplierName}</td>
                        <td className="p-4">{po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString('pt-BR') : '-'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            po.status === 'APROVADA'
                              ? 'bg-primary/10 text-primary-deep'
                              : po.status === 'EMITIDA'
                                ? 'bg-accent-yellow/15 text-amber-600'
                                : 'bg-hairline text-ink-mute'
                          }`}>
                            {po.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Tab C: Vistorias & Relatórios */}
      {activeTab === 'vistorias' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-ink flex items-center gap-1.5">
              <Camera className="w-5 h-5 text-primary" /> Vistorias Registradas
            </h3>
            <Button onClick={() => setShowVistoriaModal(true)} variant="primary" className="flex items-center gap-1 py-1.5 text-xs">
              <Camera className="w-4 h-4" /> Registrar Vistoria
            </Button>
          </div>

          <div className="flex flex-col gap-6">
            {obra.vistorias?.length === 0 ? (
              <Card variant="light" className="text-center py-12 text-xs text-ink-mute">Nenhuma vistoria registrada para esta obra.</Card>
            ) : (
              obra.vistorias.map((v) => (
                <Card key={v.uuid} variant="light" className="flex flex-col gap-4 border-hairline-cool">
                  <div className="flex justify-between items-center border-b border-hairline-cool pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        v.type === 'INICIAL' ? 'bg-accent-indigo/10 text-accent-indigo' : 'bg-primary/10 text-primary-deep'
                      }`}>
                        Vistoria {v.type}
                      </span>
                      <span className="text-xs font-semibold text-ink-secondary">{new Date(v.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  <p className="text-xs text-ink-secondary leading-relaxed">{v.description}</p>

                  {/* Vistoria Photos Gallery */}
                  {v.photos && v.photos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-4">
                      {v.photos.map((p, idx) => (
                        <a
                          key={idx}
                          href={p.fileUrl.startsWith('http') ? p.fileUrl : `http://localhost:3001${p.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-24 h-24 rounded-[6px] border border-hairline overflow-hidden hover:opacity-85 transition-opacity bg-canvas-soft flex items-center justify-center"
                        >
                          <img
                            src={p.fileUrl.startsWith('http') ? p.fileUrl : `http://localhost:3001${p.fileUrl}`}
                            alt={p.fileName}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Launch Custo Modal */}
      {showCustoModal && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-canvas w-full max-w-[480px] rounded-[12px] border border-hairline shadow-[0_16px_48px_rgba(0,0,0,0.12)] p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" /> Registrar Nova Despesa (Custo)
              </h2>
              <button onClick={() => setShowCustoModal(false)} className="p-1 text-ink-mute hover:bg-canvas-soft rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLaunchCusto} className="flex flex-col gap-4">
              <Input
                label="Descrição do Custo"
                placeholder="Ex: Aquisição de cimento CPII"
                value={custoDesc}
                onChange={(e) => setCustoDesc(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="w-full flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink-mute">Categoria</label>
                  <select
                    value={custoCat}
                    onChange={(e) => setCustoCat(e.target.value)}
                    className="bg-canvas text-ink text-sm rounded-[6px] border border-hairline px-3 py-2 outline-none w-full"
                  >
                    <option value="MATERIAL">Material</option>
                    <option value="MAO_DE_OBRA">Mão de Obra</option>
                    <option value="EQUIPAMENTO">Equipamento</option>
                    <option value="SERVICO">Serviço</option>
                    <option value="OUTRO">Outros</option>
                  </select>
                </div>
                <Input
                  label="Valor (R$)"
                  type="text"
                  placeholder="R$ 0,00"
                  value={custoVal}
                  onChange={(e) => setCustoVal(maskCurrency(e.target.value))}
                  required
                />
              </div>

              <Input
                label="Data da Despesa"
                type="date"
                value={custoDate}
                onChange={(e) => setCustoDate(e.target.value)}
                required
              />

              {/* Upload Comprovante (base64) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-mute">Comprovante de Pagamento / Nota</label>
                <div className="border border-hairline p-3 rounded-[6px] bg-canvas-soft flex items-center justify-between text-xs relative">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleReceiptUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <span className="truncate max-w-[250px] text-ink-secondary">
                    {custoReceiptName || 'Selecione arquivo...'}
                  </span>
                  <Upload className="w-4 h-4 text-ink-mute" />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <Button type="button" onClick={() => setShowCustoModal(false)} variant="outline" disabled={custoLoading}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={custoLoading}>
                  {custoLoading ? 'Lançando...' : 'Lançar Despesa'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registrar Vistoria Modal */}
      {showVistoriaModal && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-canvas w-full max-w-[500px] rounded-[12px] border border-hairline shadow-[0_16px_48px_rgba(0,0,0,0.12)] p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" /> Registrar Nova Vistoria Técnica
              </h2>
              <button onClick={() => setShowVistoriaModal(false)} className="p-1 text-ink-mute hover:bg-canvas-soft rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLaunchVistoria} className="flex flex-col gap-4">
              <div className="w-full flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-mute">Tipo da Vistoria</label>
                <select
                  value={vistoriaType}
                  onChange={(e) => setVistoriaType(e.target.value)}
                  className="bg-canvas text-ink text-sm rounded-[6px] border border-hairline px-3 py-2 outline-none w-full"
                >
                  <option value="INICIAL">Inicial / Lançamento</option>
                  <option value="FINAL">Final / Entrega</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-mute">Descrição / Notas de Inspeção</label>
                <textarea
                  placeholder="Descreva as condições identificadas no local..."
                  value={vistoriaDesc}
                  onChange={(e) => setVistoriaDesc(e.target.value)}
                  rows={4}
                  className="bg-canvas text-ink text-sm rounded-[6px] border border-hairline px-3 py-2 outline-none w-full leading-relaxed"
                  required
                />
              </div>

              {/* Multiple photos upload */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-mute">Registros Fotográficos (Múltiplos)</label>
                <div className="border border-dashed border-hairline hover:border-primary/50 p-4 rounded-[6px] text-center relative cursor-pointer bg-canvas-soft">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleVistoriaPhotosUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Camera className="w-6 h-6 mx-auto text-ink-mute-2 mb-1" />
                  <span className="text-xs font-semibold text-ink-secondary block">Clique para enviar fotos</span>
                </div>

                {vistoriaPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {vistoriaPhotos.map((_, idx) => (
                      <div key={idx} className="w-12 h-12 border border-hairline bg-canvas-soft rounded-[4px] flex items-center justify-center text-[10px] font-bold text-ink-mute">
                        Foto {idx + 1}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <Button type="button" onClick={() => setShowVistoriaModal(false)} variant="outline" disabled={vistoriaLoading}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={vistoriaLoading}>
                  {vistoriaLoading ? 'Registrando...' : 'Registrar Vistoria'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

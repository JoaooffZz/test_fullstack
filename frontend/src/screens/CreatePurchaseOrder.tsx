import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ArrowLeft, Plus, Trash2, ShoppingBag, Receipt, DollarSign, Calendar } from 'lucide-react';
import { maskCnpj, maskCurrency, parseCurrencyToNumber } from '../utils/formatters';
import { toast } from 'sonner';

interface ObraSummary {
  uuid: string;
  name: string;
}

interface PurchaseOrderItemInput {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string; // in BRL decimal format
}

export const CreatePurchaseOrder: React.FC = () => {
  const apiCall = useAuthStore((state) => state.apiCall);
  const navigate = useNavigate();
  const location = useLocation();

  // Route state passing pre-selected obraUuid
  const preSelectedObraUuid = location.state?.obraUuid || '';

  const [obras, setObras] = useState<ObraSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [obrasLoading, setObrasLoading] = useState(true);

  // Form states
  const [obraUuid, setObraUuid] = useState(preSelectedObraUuid);
  const [supplierName, setSupplierName] = useState('');
  const [supplierCnpj, setSupplierCnpj] = useState('');
  const [payerCnpj, setPayerCnpj] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  
  // Table Items state
  const [items, setItems] = useState<PurchaseOrderItemInput[]>([
    { description: '', quantity: '1', unit: 'UN', unitPrice: '' }
  ]);

  useEffect(() => {
    const fetchObras = async () => {
      try {
        const res = await apiCall('/v1/obras');
        setObras(res);
      } catch (err) {
        console.error('Erro ao carregar obras', err);
      } finally {
        setObrasLoading(false);
      }
    };
    fetchObras();
  }, [apiCall]);



  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: '1', unit: 'UN', unitPrice: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, key: keyof PurchaseOrderItemInput, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [key]: value };
    setItems(updated);
  };

  // Calculations
  const calculateLineTotal = (item: PurchaseOrderItemInput) => {
    const q = parseFloat(item.quantity) || 0;
    const p = parseCurrencyToNumber(item.unitPrice);
    return q * p;
  };

  const calculateGlobalTotal = () => {
    return items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obraUuid || !supplierName || !payerCnpj) {
      alert('Por favor, preencha os campos obrigatórios (Obra, Fornecedor e CNPJ Pagador).');
      return;
    }

    // Validate items
    const invalidItems = items.some(
      (item) => !item.description || parseFloat(item.quantity) <= 0 || parseCurrencyToNumber(item.unitPrice) <= 0
    );
    if (invalidItems) {
      alert('Por favor, garanta que todos os itens tenham descrição, quantidade > 0 e preço unitário > 0.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        obra_uuid: obraUuid,
        supplier_name: supplierName,
        supplier_cnpj: supplierCnpj.replace(/\D/g, '') || null,
        payer_cnpj: payerCnpj.replace(/\D/g, ''),
        delivery_date: deliveryDate || null,
        notes: notes || null,
        items: items.map((item) => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          unitPrice: Math.round(parseCurrencyToNumber(item.unitPrice) * 100), // convert to cents
        })),
      };

      await apiCall('/v1/purchase-orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success('Ordem de Compra emitida com sucesso!');
      // Navigate back to the obra detail panel
      navigate(`/obras/${obraUuid}`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao emitir ordem de compra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Back Link */}
      <div>
        <Button
          variant="link"
          onClick={() => {
            if (obraUuid) navigate(`/obras/${obraUuid}`);
            else navigate('/obras');
          }}
          className="flex items-center gap-1 text-ink-mute hover:text-ink"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
          <ShoppingBag className="w-7 h-7 text-primary" /> Emitir Ordem de Compra
        </h1>
        <p className="text-xs text-ink-mute mt-1">Gere ordens de fornecimento vinculadas a uma obra específica.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: General Metadata fields */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card variant="light" className="flex flex-col gap-5">
            <h3 className="text-sm font-bold text-ink-secondary border-b border-hairline pb-2 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-primary" /> Informações Gerais
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="w-full flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-mute">Obra Destino</label>
                {obrasLoading ? (
                  <span className="text-xs text-ink-mute">Carregando obras...</span>
                ) : (
                  <select
                    value={obraUuid}
                    onChange={(e) => setObraUuid(e.target.value)}
                    className="bg-canvas text-ink text-sm rounded-[6px] border border-hairline px-3 py-2 outline-none w-full"
                    required
                  >
                    <option value="">Selecione a obra...</option>
                    {obras.map(o => (
                      <option key={o.uuid} value={o.uuid}>{o.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <Input
                label="Razão Social do Fornecedor"
                placeholder="Ex: Gerdau Aços S/A"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="CNPJ do Fornecedor"
                placeholder="Ex: 00.000.000/0000-00"
                value={supplierCnpj}
                onChange={(e) => setSupplierCnpj(maskCnpj(e.target.value))}
              />
              <Input
                label="CNPJ do Pagador (Sua Empresa)"
                placeholder="Ex: 00.000.000/0000-00"
                value={payerCnpj}
                onChange={(e) => setPayerCnpj(maskCnpj(e.target.value))}
                required
              />
              <Input
                label="Previsão de Entrega"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>

            <div className="w-full flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-mute">Observações / Instruções de Entrega</label>
              <textarea
                placeholder="Ex: Entregar no canteiro de obras, portão B, falar com encarregado..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="bg-canvas text-ink text-sm rounded-[6px] border border-hairline px-3 py-2 outline-none w-full"
              />
            </div>
          </Card>

          {/* Dynamic Table Items */}
          <Card variant="light" className="flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-hairline pb-2">
              <h3 className="text-sm font-bold text-ink-secondary flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-primary" /> Itens do Pedido
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-primary hover:text-primary-deep flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Item
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-3 items-end border-b border-hairline-cool pb-4 sm:pb-3 last:border-b-0 last:pb-0">
                  <div className="w-full sm:flex-1">
                    <Input
                      label={idx === 0 ? "Descrição do Material/Serviço" : undefined}
                      placeholder="Ex: Barra de ferro 3/8"
                      value={item.description}
                      onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                      required
                    />
                  </div>

                  <div className="w-24 shrink-0">
                    <Input
                      label={idx === 0 ? "Qtd." : undefined}
                      type="number"
                      min="0.001"
                      step="any"
                      placeholder="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                      required
                    />
                  </div>

                  <div className="w-20 shrink-0">
                    {idx === 0 && <label className="text-sm font-medium text-ink-mute block mb-1.5">Unid.</label>}
                    <select
                      value={item.unit}
                      onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                      className="bg-canvas text-ink text-sm rounded-[6px] border border-hairline px-3 py-2 outline-none w-full"
                    >
                      <option value="UN">UN</option>
                      <option value="KG">KG</option>
                      <option value="M">M</option>
                      <option value="M2">M²</option>
                      <option value="M3">M³</option>
                      <option value="PCT">PCT</option>
                      <option value="MIL">MIL</option>
                    </select>
                  </div>

                  <div className="w-32 shrink-0">
                    <Input
                      label={idx === 0 ? "Preço Unit. (R$)" : undefined}
                      type="text"
                      placeholder="R$ 0,00"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateItem(idx, 'unitPrice', maskCurrency(e.target.value))}
                      required
                    />
                  </div>

                  <div className="w-28 shrink-0 text-right pb-3 text-xs font-semibold text-ink-secondary">
                    {idx === 0 && <span className="text-ink-mute block mb-1 text-left">Subtotal</span>}
                    R$ {calculateLineTotal(item).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length === 1}
                    className="p-2 mb-1 hover:bg-canvas-soft border border-transparent hover:border-hairline rounded-[6px] text-ink-mute hover:text-accent-tomato disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                    title="Excluir item"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Calculations card Summary */}
        <div className="flex flex-col gap-6">
          <Card variant="light" className="flex flex-col gap-5 border-primary/20 sticky top-24">
            <h3 className="text-xs font-bold text-ink-mute uppercase tracking-wider">Resumo do Pedido</h3>
            
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between py-1 border-b border-hairline-cool text-ink-mute">
                <span>Total de Itens</span>
                <span className="font-semibold text-ink-secondary">{items.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="font-bold text-ink">Total Geral</span>
                <span className="text-base font-bold text-primary-deep flex items-center gap-0.5">
                  R$ {calculateGlobalTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 mt-2"
              disabled={loading}
            >
              {loading ? 'Transmitindo...' : 'Emitir Ordem de Compra'}
            </Button>
          </Card>
        </div>

      </form>
    </div>
  );
};

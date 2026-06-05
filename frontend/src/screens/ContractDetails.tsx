import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ArrowLeft, FileText, Send, Calendar, User, DollarSign, Clock, Layers, PlusCircle, CheckCircle2, XCircle, Copy, Check, Paperclip, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface SignatureRequestItem {
  uuid: string;
  createdAt: string;
  channel: string;
  status: string;
  token: string;
  expiresAt: string;
  signedAt: string | null;
  signerName: string | null;
  signerIp: string | null;
}

interface UploadItem {
  uuid: string;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  sizeBytes: number | null;
}

interface ContractDetailsData {
  uuid: string;
  title: string;
  type: string;
  status: string;
  relatedParty: string;
  relatedPartyEmail: string;
  relatedPartyWhatsapp: string | null;
  value: number | null;
  startDate: string | null;
  endDate: string | null;
  body: string;
  fieldValues: Record<string, any> | null;
  closeReason: string | null;
  originContractUuid: string | null;
  daysRemaining: number | null;
  uploads: UploadItem[];
  signatureRequests: SignatureRequestItem[];
}

export const ContractDetails: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const apiCall = useAuthStore((state) => state.apiCall);

  const [contract, setContract] = useState<ContractDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureChannel, setSignatureChannel] = useState('EMAIL');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [closeLoading, setCloseLoading] = useState(false);

  const [showAdditiveModal, setShowAdditiveModal] = useState(false);
  const [additiveTitle, setAdditiveTitle] = useState('');
  const [additiveChanges, setAdditiveChanges] = useState('');
  const [additiveLoading, setAdditiveLoading] = useState(false);

  const fetchContractDetails = useCallback(async () => {
    if (!uuid) return;
    setLoading(true);
    try {
      const res = await apiCall(`/v1/contracts/${uuid}`);
      setContract(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes do contrato');
    } finally {
      setLoading(false);
    }
  }, [uuid, apiCall]);

  useEffect(() => {
    fetchContractDetails();
  }, [fetchContractDetails]);

  const handleSendSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uuid) return;
    
    setSignatureLoading(true);
    try {
      const res = await apiCall(`/v1/contracts/${uuid}/signature-request`, {
        method: 'POST',
        body: JSON.stringify({
          channel: signatureChannel,
          expires_in_days: parseInt(expiresInDays, 10),
        }),
      });
      
      setGeneratedLink(res.link || `http://localhost:5173/assinar/${res.token}`);
      toast.success('Assinatura solicitada com sucesso!');
      fetchContractDetails();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao solicitar assinatura');
    } finally {
      setSignatureLoading(false);
    }
  };

  const handleCloseContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uuid || !closeReason) return;

    setCloseLoading(true);
    try {
      await apiCall(`/v1/contracts/${uuid}/close`, {
        method: 'POST',
        body: JSON.stringify({ close_reason: closeReason }),
      });
      setShowCloseModal(false);
      setCloseReason('');
      toast.success('Contrato encerrado com sucesso!');
      fetchContractDetails();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao encerrar contrato');
    } finally {
      setCloseLoading(false);
    }
  };

  const handleCreateAdditive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uuid || !additiveTitle || !additiveChanges) return;

    setAdditiveLoading(true);
    try {
      const res = await apiCall(`/v1/contracts/${uuid}/additive`, {
        method: 'POST',
        body: JSON.stringify({
          title: additiveTitle,
          description_of_changes: additiveChanges,
        }),
      });
      setShowAdditiveModal(false);
      setAdditiveTitle('');
      setAdditiveChanges('');
      
      toast.success('Aditivo contratual criado com sucesso!');
      // Navigate to the newly created additive contract details
      navigate(`/contratos/${res.uuid}`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar aditivo');
    } finally {
      setAdditiveLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success('Link de assinatura copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (val: number | null) => {
    if (val === null) return '-';
    return (Number(val) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'ASSINADO':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary-deep flex items-center gap-1 w-fit"><CheckCircle2 className="w-3.5 h-3.5" /> Assinado</span>;
      case 'AGUARDANDO_ASSINATURA':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-accent-yellow/15 text-amber-600 flex items-center gap-1 w-fit"><Clock className="w-3.5 h-3.5" /> Aguardando Assinatura</span>;
      case 'RASCUNHO':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-hairline-cool-3 text-ink-mute flex items-center gap-1 w-fit"><Layers className="w-3.5 h-3.5" /> Rascunho</span>;
      case 'ENCERRADO':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-accent-tomato/10 text-accent-tomato flex items-center gap-1 w-fit"><XCircle className="w-3.5 h-3.5" /> Encerrado</span>;
      case 'VENCENDO':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-accent-yellow/20 text-amber-700 animate-pulse flex items-center gap-1 w-fit"><Clock className="w-3.5 h-3.5" /> Vencendo</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-hairline text-ink-mute w-fit">{statusStr}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-4 bg-accent-tomato/10 border border-accent-tomato/20 rounded-[8px] text-accent-tomato text-sm font-medium">
          {error || 'Contrato não encontrado.'}
        </div>
        <Button onClick={() => navigate('/contratos')} className="mt-4">
          Voltar para Contratos
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Back Link */}
      <div>
        <Button variant="link" onClick={() => navigate('/contratos')} className="flex items-center gap-1 text-ink-mute hover:text-ink">
          <ArrowLeft className="w-4 h-4" /> Voltar para Contratos
        </Button>
      </div>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-hairline pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-ink">{contract.title}</h1>
            {getStatusBadge(contract.status)}
          </div>
          <p className="text-xs text-ink-mute mt-1.5 font-mono">
            UUID: {contract.uuid} {contract.originContractUuid && `| Aditivo de: ${contract.originContractUuid}`}
          </p>
        </div>

        {/* Dynamic Actions */}
        <div className="flex flex-wrap gap-2">
          {contract.status === 'RASCUNHO' && (
            <Button onClick={() => { setGeneratedLink(''); setShowSignatureModal(true); }} variant="primary" className="flex items-center gap-1.5 py-2">
              <Send className="w-4 h-4" /> Enviar para Assinatura
            </Button>
          )}

          {contract.status === 'AGUARDANDO_ASSINATURA' && (
            <Button onClick={() => {
              // Extract latest request token
              const latestReq = contract.signatureRequests[0];
              if (latestReq) {
                setGeneratedLink(`http://localhost:5173/assinar/${latestReq.token}`);
                setShowSignatureModal(true);
              } else {
                setGeneratedLink('');
                setShowSignatureModal(true);
              }
            }} variant="outline" className="flex items-center gap-1.5 py-2 border-hairline-strong hover:bg-canvas-soft">
              <Eye className="w-4 h-4" /> Ver Link de Assinatura
            </Button>
          )}

          {contract.status === 'ASSINADO' && (
            <>
              <Button onClick={() => setShowAdditiveModal(true)} variant="outline" className="flex items-center gap-1.5 py-2 border-hairline-strong hover:bg-canvas-soft">
                <PlusCircle className="w-4 h-4 text-primary-deep" /> Gerar Termo Aditivo
              </Button>
              <Button onClick={() => setShowCloseModal(true)} variant="dark" className="flex items-center gap-1.5 py-2">
                <XCircle className="w-4 h-4 text-accent-tomato" /> Encerrar Contrato
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left / Center: Contract Text Body */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card variant="light" className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-ink-mute uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-4 h-4 text-primary" /> Cláusulas Contratuais
            </h3>
            
            <div className="p-6 bg-canvas-soft border border-hairline rounded-[8px] text-sm text-ink-secondary font-serif leading-relaxed whitespace-pre-wrap min-h-[400px]">
              {contract.body}
            </div>

            {contract.closeReason && (
              <div className="p-4 bg-accent-tomato/10 border border-accent-tomato/20 rounded-[8px] text-xs">
                <span className="font-bold text-accent-tomato block mb-1">Motivo de Encerramento:</span>
                <p className="text-ink-secondary">{contract.closeReason}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Panel: Metadata & Side Stats */}
        <div className="flex flex-col gap-6">
          {/* Info Card */}
          <Card variant="light" className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-ink-mute uppercase tracking-wider">Ficha Técnica</h3>
            
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between py-1 border-b border-hairline-cool">
                <span className="text-ink-mute flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Tipo</span>
                <span className="font-bold text-ink-secondary">{contract.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-hairline-cool">
                <span className="text-ink-mute flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Valor Contratual</span>
                <span className="font-bold text-ink-secondary">{formatCurrency(contract.value)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-hairline-cool">
                <span className="text-ink-mute flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Início</span>
                <span className="font-semibold text-ink-secondary">{formatDate(contract.startDate)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-hairline-cool">
                <span className="text-ink-mute flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Término</span>
                <span className="font-semibold text-ink-secondary">{formatDate(contract.endDate)}</span>
              </div>
              {contract.daysRemaining !== null && (
                <div className="flex justify-between py-1 border-b border-hairline-cool">
                  <span className="text-ink-mute flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Vigência Restante</span>
                  <span className={`font-bold ${contract.daysRemaining <= 30 ? 'text-amber-600' : 'text-primary-deep'}`}>
                    {contract.daysRemaining > 0 ? `${contract.daysRemaining} dias` : 'Expirado'}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Related Party Card */}
          <Card variant="light" className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-ink-mute uppercase tracking-wider">Contratado / Signatário</h3>
            
            <div className="flex flex-col gap-2.5 text-xs text-ink-secondary">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-ink-mute-2 shrink-0" />
                <div>
                  <span className="block font-semibold">{contract.relatedParty}</span>
                  <span className="text-[10px] text-ink-mute">{contract.relatedPartyEmail}</span>
                </div>
              </div>
              {contract.relatedPartyWhatsapp && (
                <div className="text-[10px] text-ink-mute pl-6">
                  WhatsApp: <span className="font-medium text-ink-secondary">{contract.relatedPartyWhatsapp}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Uploads Card */}
          {contract.uploads?.length > 0 && (
            <Card variant="light" className="flex flex-col gap-4">
              <h3 className="text-xs font-bold text-ink-mute uppercase tracking-wider flex items-center gap-1">
                <Paperclip className="w-4 h-4" /> Anexos ({contract.uploads.length})
              </h3>
              <div className="flex flex-col gap-2">
                {contract.uploads.map((up) => (
                  <a
                    key={up.uuid}
                    href={up.fileUrl.startsWith('http') ? up.fileUrl : `http://localhost:3001${up.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 border border-hairline-cool bg-canvas-soft hover:bg-canvas rounded-[6px] text-xs font-medium text-ink-secondary flex items-center justify-between hover:border-hairline transition-colors"
                  >
                    <span className="truncate max-w-[200px]">{up.fileName}</span>
                    <span className="text-[10px] text-primary hover:underline">Abrir</span>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Signature History */}
          <Card variant="light" className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-ink-mute uppercase tracking-wider">Histórico de Assinaturas</h3>
            
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
              {contract.signatureRequests?.length === 0 ? (
                <span className="text-xs text-ink-mute text-center py-4">Nenhuma solicitação enviada.</span>
              ) : (
                contract.signatureRequests.map((req) => (
                  <div key={req.uuid} className="p-3 border border-hairline-cool bg-canvas-soft/50 rounded-[8px] text-xs flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold uppercase text-[9px] px-1.5 py-0.5 rounded bg-canvas border border-hairline text-ink-mute w-fit">
                        {req.channel}
                      </span>
                      <span className={`font-semibold ${
                        req.status === 'ASSINADO'
                          ? 'text-primary-deep'
                          : req.status === 'EXPIRADO'
                            ? 'text-accent-tomato'
                            : 'text-amber-600'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <span className="text-[10px] text-ink-mute block">Enviado em: {new Date(req.createdAt).toLocaleDateString('pt-BR')}</span>

                    {req.status === 'ASSINADO' && (
                      <div className="pt-2 mt-1 border-t border-hairline-cool flex flex-col gap-1 text-[10px] text-ink-mute">
                        <span className="font-semibold text-ink-secondary block">Assinado por: {req.signerName}</span>
                        <span>Data: {formatDate(req.signedAt)}</span>
                        <span>IP: {req.signerIp}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Signature Request Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-canvas w-full max-w-[480px] rounded-[12px] border border-hairline shadow-[0_16px_48px_rgba(0,0,0,0.12)] p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" /> Solicitar Assinatura Eletrônica
              </h2>
              <button onClick={() => setShowSignatureModal(false)} className="p-1 text-ink-mute hover:bg-canvas-soft rounded cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {!generatedLink ? (
              <form onSubmit={handleSendSignature} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-ink-mute uppercase">Canal de Comunicação</label>
                  <select
                    value={signatureChannel}
                    onChange={(e) => setSignatureChannel(e.target.value)}
                    className="bg-canvas text-ink text-sm rounded-[6px] border border-hairline px-3 py-2 outline-none w-full"
                  >
                    <option value="EMAIL">E-mail</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="AMBOS">E-mail e WhatsApp</option>
                    <option value="LINK">Apenas Gerar Link</option>
                  </select>
                </div>

                <Input
                  label="Expira em (dias)"
                  type="number"
                  min="1"
                  max="90"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  required
                />

                <Button type="submit" variant="primary" disabled={signatureLoading} className="w-full mt-2">
                  {signatureLoading ? 'Processando...' : 'Gerar e Enviar Solicitação'}
                </Button>
              </form>
            ) : (
              <div className="flex flex-col gap-4 py-2">
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-[8px] flex items-center gap-2.5 text-xs text-primary-deep font-semibold">
                  <CheckCircle2 className="w-5 h-5" /> Solicitação gerada com sucesso!
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-ink-mute uppercase">Link público para assinatura</span>
                  <div className="flex items-center gap-2 border border-hairline p-2 rounded-[6px] bg-canvas-soft">
                    <span className="text-xs truncate font-mono flex-1 text-ink-secondary">{generatedLink}</span>
                    <button
                      onClick={copyToClipboard}
                      className="p-1.5 hover:bg-hairline rounded text-ink border border-transparent hover:border-hairline-strong cursor-pointer"
                      title="Copiar Link"
                    >
                      {copied ? <Check className="w-4 h-4 text-primary-deep" /> : <Copy className="w-4 h-4 text-ink-mute" />}
                    </button>
                  </div>
                </div>

                <Button onClick={() => setShowSignatureModal(false)} className="w-full mt-2">Concluído</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close Contract Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-canvas w-full max-w-[480px] rounded-[12px] border border-hairline shadow-[0_16px_48px_rgba(0,0,0,0.12)] p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <XCircle className="w-5 h-5 text-accent-tomato" /> Encerrar Vigência do Contrato
              </h2>
              <button onClick={() => setShowCloseModal(false)} className="p-1 text-ink-mute hover:bg-canvas-soft rounded cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseContract} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-ink-mute uppercase">Motivo do Encerramento</label>
                <textarea
                  placeholder="Descreva as razões jurídicas, comerciais ou finalização da obra..."
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  rows={4}
                  className="bg-canvas text-ink text-sm rounded-[6px] border border-hairline px-3 py-2 outline-none w-full leading-relaxed"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <Button type="button" onClick={() => setShowCloseModal(false)} variant="outline" disabled={closeLoading}>
                  Cancelar
                </Button>
                <Button type="submit" variant="dark" className="bg-accent-tomato text-on-dark border-transparent hover:bg-red-700" disabled={closeLoading}>
                  {closeLoading ? 'Finalizando...' : 'Confirmar Encerramento'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Additive Modal */}
      {showAdditiveModal && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-canvas w-full max-w-[500px] rounded-[12px] border border-hairline shadow-[0_16px_48px_rgba(0,0,0,0.12)] p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-primary" /> Criar Termo Aditivo
              </h2>
              <button onClick={() => setShowAdditiveModal(false)} className="p-1 text-ink-mute hover:bg-canvas-soft rounded cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdditive} className="flex flex-col gap-4">
              <Input
                label="Título do Aditivo"
                placeholder="Ex: Termo Aditivo 01 - Prorrogação de Prazo"
                value={additiveTitle}
                onChange={(e) => setAdditiveTitle(e.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-ink-mute uppercase">Descrição das Alterações / Escopo</label>
                <textarea
                  placeholder="Descreva as alterações de prazo, valor ou cláusulas originais..."
                  value={additiveChanges}
                  onChange={(e) => setAdditiveChanges(e.target.value)}
                  rows={5}
                  className="bg-canvas text-ink text-sm rounded-[6px] border border-hairline px-3 py-2 outline-none w-full leading-relaxed"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <Button type="button" onClick={() => setShowAdditiveModal(false)} variant="outline" disabled={additiveLoading}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={additiveLoading}>
                  {additiveLoading ? 'Criando...' : 'Criar Aditivo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

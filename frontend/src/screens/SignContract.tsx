import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { CheckCircle, ShieldCheck, Eye, Calendar, User, FileText, HelpCircle } from 'lucide-react';

interface SignContractDetails {
  contract: {
    uuid: string;
    title: string;
    body: string;
    type: string;
    relatedParty: string;
    relatedPartyEmail: string;
    value: number | null;
  };
  request: {
    uuid: string;
    status: string;
    expiresAt: string;
    signerName: string | null;
    signedAt: string | null;
  };
}

export const SignContract: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const apiCall = useAuthStore((state) => state.apiCall);

  const [data, setData] = useState<SignContractDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Signature Form
  const [fullName, setFullName] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [signingLoading, setSigningLoading] = useState(false);
  const [signedSuccess, setSignedSuccess] = useState(false);

  useEffect(() => {
    const fetchSignatureDetails = async () => {
      if (!token) return;
      try {
        const res = await apiCall(`/v1/sign/${token}`);
        setData(res);
        if (res.request.status === 'ASSINADO') {
          setSignedSuccess(true);
        }
      } catch (err: any) {
        setError(err.message || 'Link de assinatura inválido ou expirado.');
      } finally {
        setLoading(false);
      }
    };
    fetchSignatureDetails();
  }, [token, apiCall]);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !fullName || !accepted) return;

    setSigningLoading(true);
    try {
      await apiCall(`/v1/sign/${token}`, {
        method: 'POST',
        body: JSON.stringify({ name: fullName }),
      });
      setSignedSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Erro ao realizar assinatura eletrônica.');
    } finally {
      setSigningLoading(false);
    }
  };

  const formatCurrency = (val: number | null) => {
    if (val === null) return '-';
    return (Number(val) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-soft flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-canvas-soft flex items-center justify-center p-4">
        <Card variant="light" className="w-full max-w-[480px] text-center p-8 flex flex-col items-center gap-4">
          <div className="p-3 bg-accent-tomato/10 text-accent-tomato border border-accent-tomato/20 rounded-full">
            <ShieldCheck className="w-8 h-8 rotate-180" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">Erro de Assinatura</h2>
            <p className="text-xs text-ink-mute mt-2">{error || 'Link de assinatura inválido ou expirado.'}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-soft flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        
        {/* Top Header Logo (Public) */}
        <div className="flex items-center justify-between border-b border-hairline pb-4 mb-2">
          <div className="text-lg font-bold tracking-tight text-ink flex items-center gap-1">
            Supabaze<span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            <span className="text-ink-mute font-medium text-xs border border-hairline px-1.5 py-0.5 rounded-[4px]">Sign</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ink-mute">
            <ShieldCheck className="w-4 h-4 text-primary-deep" /> Assinatura Eletrônica Segura
          </div>
        </div>

        {signedSuccess ? (
          <Card variant="light" className="text-center p-8 flex flex-col items-center gap-5 shadow-[0_16px_48px_rgba(0,0,0,0.06)]">
            <div className="p-4 bg-primary/15 border border-primary/25 rounded-full text-primary-deep">
              <CheckCircle className="w-12 h-12" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink">Documento Assinado com Sucesso!</h2>
              <p className="text-xs text-ink-mute mt-2">
                Sua assinatura para o contrato <b>"{data.contract.title}"</b> foi autenticada eletronicamente.
              </p>
              <div className="mt-4 p-3 bg-canvas-soft border border-hairline rounded-[6px] text-[10px] font-mono text-ink-secondary text-left w-fit mx-auto flex flex-col gap-1">
                <span><b>Signatário:</b> {data.request.signerName || fullName}</span>
                <span><b>UUID do Contrato:</b> {data.contract.uuid}</span>
                <span><b>Autenticidade:</b> MP 2.200-2/2001</span>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Contract Body */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <Card variant="light" className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-hairline pb-2">
                  <h3 className="text-xs font-bold text-ink-mute uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-primary" /> Visualizar Contrato
                  </h3>
                  <span className="text-[10px] text-ink-mute bg-canvas-soft px-2 py-0.5 rounded border border-hairline">
                    Tipo: {data.contract.type}
                  </span>
                </div>
                
                <div className="p-4 sm:p-6 bg-canvas-soft border border-hairline rounded-[8px] text-sm text-ink-secondary font-serif leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                  {data.contract.body}
                </div>
              </Card>
            </div>

            {/* Right Column: Signature Panel */}
            <div className="flex flex-col gap-6">
              <Card variant="light" className="flex flex-col gap-4">
                <h3 className="text-xs font-bold text-ink-mute uppercase tracking-wider">Instruções</h3>
                <div className="text-xs text-ink-mute flex flex-col gap-3">
                  <p>1. Leia atentamente as cláusulas contratuais na janela ao lado.</p>
                  <p>2. Preencha seu nome completo exatamente como consta em seu documento oficial.</p>
                  <p>3. Dê o seu consentimento marcando a caixa de aceite e clique em <b>"Assinar Documento"</b>.</p>
                </div>
              </Card>

              <Card variant="light" className="flex flex-col gap-4 border-primary/20 bg-canvas/90">
                <h3 className="text-sm font-bold text-ink flex items-center gap-1.5 border-b border-hairline pb-2">
                  <ShieldCheck className="w-4 h-4 text-primary-deep" /> Assinar Termo
                </h3>

                <form onSubmit={handleSign} className="flex flex-col gap-4">
                  <Input
                    label="Nome Completo do Signatário"
                    placeholder="Seu Nome Completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={signingLoading}
                  />

                  <div className="flex items-start gap-2.5 mt-1">
                    <input
                      type="checkbox"
                      id="accept-terms"
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                      className="rounded text-primary focus:ring-primary w-4.5 h-4.5 border-hairline mt-0.5 cursor-pointer shrink-0"
                      required
                    />
                    <label htmlFor="accept-terms" className="text-xs text-ink-mute cursor-pointer leading-relaxed">
                      Eu aceito assinar este documento de forma eletrônica sob as diretrizes da <b>MP 2.200-2/2001</b>.
                    </label>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-2.5 mt-2 flex items-center gap-1.5"
                    disabled={!accepted || !fullName || signingLoading}
                  >
                    {signingLoading ? 'Processando assinatura...' : 'Assinar Documento'}
                  </Button>
                </form>
              </Card>

              {/* Security info */}
              <div className="text-[10px] text-ink-mute flex items-center justify-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> Assinatura amparada legalmente pelo Artigo 10 da MP nº 2.200-2.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

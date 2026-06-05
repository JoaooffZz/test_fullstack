import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ArrowLeft, Check, FileText, ChevronRight, ChevronLeft, Upload, Info } from 'lucide-react';
import { maskPhone, maskCurrency, parseCurrencyToNumber, validateEmail } from '../utils/formatters';
import { toast } from 'sonner';

interface TemplateField {
  uuid: string;
  key: string;
  label: string;
  fieldType: 'TEXT' | 'NUMBER' | 'DATE' | 'SIGNATURE' | 'ADDRESS';
  isRequired: boolean;
}

interface Template {
  uuid: string;
  name: string;
  type: string;
  body: string;
  fields: TemplateField[];
}

export const CreateContract: React.FC = () => {
  const apiCall = useAuthStore((state) => state.apiCall);
  const navigate = useNavigate();
  const location = useLocation();

  // Route State passing pre-selected templateUuid
  const preSelectedTemplateUuid = location.state?.templateUuid || '';

  // Wizard Steps: 1 = Dados Gerais, 2 = Variáveis, 3 = Pré-visualização, 4 = Anexos
  const [step, setStep] = useState(1);

  // Database states
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Form states - Step 1
  const [title, setTitle] = useState('');
  const [type, setType] = useState('SERVICO');
  const [templateUuid, setTemplateUuid] = useState('');
  const [relatedParty, setRelatedParty] = useState('');
  const [relatedPartyEmail, setRelatedPartyEmail] = useState('');
  const [relatedPartyWhatsapp, setRelatedPartyWhatsapp] = useState('');
  const [value, setValue] = useState(''); // in BRL decimal format
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form states - Step 2 (Dynamic Fields)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  // Form states - Step 3 (Body Text)
  const [body, setBody] = useState('');

  // Form states - Step 4 (Files)
  const [files, setFiles] = useState<Array<{ name: string; base64: string }>>([]);

  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  // Fetch templates list on init
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await apiCall('/v1/contract-templates');
        setTemplates(res);
        
        // Handle preselected template from route state
        if (preSelectedTemplateUuid) {
          const selected = res.find((t: Template) => t.uuid === preSelectedTemplateUuid);
          if (selected) {
            setSelectedTemplate(selected);
            setTemplateUuid(selected.uuid);
            setType(selected.type);
            setBody(selected.body);
            // Pre-fill initial keys
            const initialVals: Record<string, string> = {};
            selected.fields.forEach((f: TemplateField) => {
              initialVals[f.key] = '';
            });
            setFieldValues(initialVals);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar templates', err);
      } finally {
        setTemplatesLoading(false);
      }
    };
    loadTemplates();
  }, [apiCall, preSelectedTemplateUuid]);

  // Handle template selection change
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uuid = e.target.value;
    setTemplateUuid(uuid);
    
    if (!uuid) {
      setSelectedTemplate(null);
      setBody('');
      setFieldValues({});
      return;
    }

    const template = templates.find(t => t.uuid === uuid);
    if (template) {
      setSelectedTemplate(template);
      setType(template.type);
      setBody(template.body);
      
      const initialVals: Record<string, string> = {};
      template.fields.forEach(f => {
        initialVals[f.key] = '';
      });
      setFieldValues(initialVals);
    }
  };

  // Dynamically replace variables in the body text in real-time
  const getInterpolatedBody = () => {
    if (!body) return '';
    let text = body;
    
    // Interpolate default metadata variables if present
    text = text.replace(/\{\{TITULO\}\}/g, title || '{{TITULO}}');
    text = text.replace(/\{\{PARTE_RELACIONADA\}\}/g, relatedParty || '{{PARTE_RELACIONADA}}');
    text = text.replace(/\{\{VALOR\}\}/g, value ? `R$ ${value}` : '{{VALOR}}');
    
    // Interpolate template dynamic variables
    Object.entries(fieldValues).forEach(([key, val]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      text = text.replace(regex, val || `{{${key}}}`);
    });
    return text;
  };

  // Convert files to base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileList = Array.from(e.target.files);
    
    fileList.forEach(file => {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert(`O arquivo "${file.name}" excede o limite de 5MB.`);
        return;
      }

      // Validate file format
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      const allowedExts = ['.png', '.jpeg', '.jpg', '.pdf'];
      
      if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
        alert(`O arquivo "${file.name}" possui formato inválido. Apenas PNG, JPEG e PDF são permitidos.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Keep name and base64 (clean format - strip prefix if backend doesn't want metadata)
        const cleanBase64 = base64String.split(',')[1] || base64String;
        setFiles(prev => [...prev, { name: file.name, base64: cleanBase64 }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!title || !relatedParty || !relatedPartyEmail) {
        alert('Por favor, preencha o Título, Nome e E-mail da Parte Relacionada.');
        return;
      }
      if (!validateEmail(relatedPartyEmail)) {
        alert('Por favor, insira um e-mail válido para a Parte Relacionada.');
        return;
      }
      // If we have a template, go to variables (Step 2), else skip to step 3 (body preview/edit)
      if (selectedTemplate) {
        setStep(2);
      } else {
        setStep(3);
      }
    } else if (step === 2) {
      // Validate required template fields
      if (selectedTemplate) {
        const missingFields = selectedTemplate.fields.filter(
          f => f.isRequired && !fieldValues[f.key]
        );
        if (missingFields.length > 0) {
          alert(`Por favor, preencha os campos obrigatórios: ${missingFields.map(f => f.label).join(', ')}`);
          return;
        }
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const rawValue = parseCurrencyToNumber(value);
      const numericValue = rawValue > 0 ? Math.round(rawValue * 100) : null;
      
      const payload = {
        templateUuid: templateUuid || null,
        title,
        type,
        relatedParty,
        relatedPartyEmail,
        relatedPartyWhatsapp: relatedPartyWhatsapp || null,
        value: numericValue,
        startDate: startDate || null,
        endDate: endDate || null,
        body: getInterpolatedBody() || body,
        fieldValues: selectedTemplate ? fieldValues : null,
        files: files.length > 0 ? files : undefined,
      };

       const res = await apiCall('/v1/contracts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success('Contrato criado com sucesso!');
      navigate(`/contratos/${res.uuid}`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar o contrato');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Back link */}
      <div>
        <Button variant="link" onClick={() => navigate('/contratos')} className="flex items-center gap-1 text-ink-mute hover:text-ink">
          <ArrowLeft className="w-4 h-4" /> Voltar para Contratos
        </Button>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-ink">Novo Contrato</h1>
        <p className="text-xs text-ink-mute mt-1">Siga o assistente de etapas para criar e revisar seu documento.</p>
      </div>

      {/* Progress Wizard Bar */}
      <div className="flex items-center gap-2 bg-canvas-soft border border-hairline p-3 rounded-[8px]">
        {[
          { label: 'Dados Gerais', stepNum: 1 },
          ...(selectedTemplate ? [{ label: 'Variáveis', stepNum: 2 }] : []),
          { label: 'Revisão e Preview', stepNum: 3 },
          { label: 'Anexos & Concluir', stepNum: 4 }
        ].map((item, idx, arr) => (
          <React.Fragment key={item.stepNum}>
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                step === item.stepNum
                  ? 'bg-primary text-on-primary'
                  : step > item.stepNum
                    ? 'bg-primary-deep text-on-dark'
                    : 'bg-hairline text-ink-mute'
              }`}>
                {step > item.stepNum ? <Check className="w-3 h-3" /> : item.stepNum}
              </span>
              <span className={`text-xs font-semibold ${step === item.stepNum ? 'text-ink' : 'text-ink-mute'}`}>
                {item.label}
              </span>
            </div>
            {idx < arr.length - 1 && <div className="h-px bg-hairline flex-1 max-w-[40px]"></div>}
          </React.Fragment>
        ))}
      </div>

      {/* Content Step 1 */}
      {step === 1 && (
        <Card variant="light" className="flex flex-col gap-6">
          <h3 className="text-sm font-bold text-ink-secondary border-b border-hairline pb-2">Passo 1: Detalhes do Documento</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <Input
                label="Título do Contrato"
                placeholder="Ex: Contrato de Fundações - Bloco A"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div className="w-full flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-mute">Usar Modelo / Template</label>
                {templatesLoading ? (
                  <div className="text-xs text-ink-mute">Carregando modelos...</div>
                ) : (
                  <select
                    value={templateUuid}
                    onChange={handleTemplateChange}
                    className="bg-canvas text-ink text-sm rounded-[6px] border border-hairline focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2 transition-all outline-none w-full"
                  >
                    <option value="">Nenhum (Escrever texto livre)</option>
                    {templates.map(t => (
                      <option key={t.uuid} value={t.uuid}>{t.name} ({t.type})</option>
                    ))}
                  </select>
                )}
              </div>

              {!selectedTemplate && (
                <div className="w-full flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink-mute">Tipo do Contrato</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="bg-canvas text-ink text-sm rounded-[6px] border border-hairline focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2 transition-all outline-none w-full"
                  >
                    <option value="SERVICO">Serviço</option>
                    <option value="TRABALHO">Trabalho</option>
                    <option value="OBRA">Obra</option>
                    <option value="LOCACAO">Locação</option>
                    <option value="OUTRO">Outros</option>
                  </select>
                </div>
              )}

              <Input
                label="Valor do Contrato"
                placeholder="R$ 0,00"
                type="text"
                value={value}
                onChange={(e) => setValue(maskCurrency(e.target.value))}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Data de Início"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  label="Data Fim / Encerramento"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold text-ink-mute uppercase tracking-wider block border-b border-hairline pb-1">
                Contratado / Parte Relacionada
              </span>
              
              <Input
                label="Nome / Razão Social"
                placeholder="Ex: Construtora Alfa LTDA"
                value={relatedParty}
                onChange={(e) => setRelatedParty(e.target.value)}
                required
              />

              <Input
                label="E-mail da Parte Relacionada"
                placeholder="Ex: financeiro@alfa.com"
                type="email"
                value={relatedPartyEmail}
                onChange={(e) => setRelatedPartyEmail(e.target.value)}
                required
              />

              <Input
                label="WhatsApp (com DDD)"
                placeholder="(11) 99999-9999"
                value={relatedPartyWhatsapp}
                onChange={(e) => setRelatedPartyWhatsapp(maskPhone(e.target.value))}
              />

              {!selectedTemplate && (
                <div className="w-full flex flex-col gap-1.5 mt-2">
                  <label className="text-sm font-medium text-ink-mute">Corpo do Contrato</label>
                  <textarea
                    placeholder="Escreva as cláusulas contratuais aqui..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={8}
                    className="bg-canvas text-ink text-sm rounded-[6px] border border-hairline focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2 transition-all outline-none w-full"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Content Step 2 */}
      {step === 2 && selectedTemplate && (
        <Card variant="light" className="flex flex-col gap-6">
          <h3 className="text-sm font-bold text-ink-secondary border-b border-hairline pb-2">Passo 2: Preencher Variáveis Dinâmicas</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Dynamic Inputs */}
            <div className="flex flex-col gap-4">
              <div className="p-3 bg-canvas-soft border border-hairline rounded-[8px] flex items-start gap-2 text-xs text-ink-mute mb-2">
                <Info className="w-4 h-4 shrink-0 text-primary-deep" />
                <span>Preencha os campos abaixo. Eles serão inseridos no texto do contrato em tempo real na aba ao lado.</span>
              </div>

              {selectedTemplate.fields.map((field) => {
                const handleFieldChange = (val: string) => {
                  setFieldValues({ ...fieldValues, [field.key]: val });
                };

                return (
                  <div key={field.uuid} className="w-full flex flex-col gap-1">
                    <label className="text-sm font-semibold text-ink-secondary">
                      {field.label} {field.isRequired && <span className="text-accent-tomato">*</span>}
                    </label>
                    {field.fieldType === 'DATE' ? (
                      <input
                        type="date"
                        value={fieldValues[field.key] || ''}
                        onChange={(e) => handleFieldChange(e.target.value)}
                        className="bg-canvas text-ink text-sm rounded-[6px] border border-hairline px-3 py-2 outline-none w-full"
                      />
                    ) : field.fieldType === 'NUMBER' ? (
                      <input
                        type="number"
                        value={fieldValues[field.key] || ''}
                        onChange={(e) => handleFieldChange(e.target.value)}
                        className="bg-canvas text-ink text-sm rounded-[6px] border border-hairline px-3 py-2 outline-none w-full"
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder={field.label}
                        value={fieldValues[field.key] || ''}
                        onChange={(e) => handleFieldChange(e.target.value)}
                        className="bg-canvas text-ink text-sm rounded-[6px] border border-hairline px-3 py-2 outline-none w-full"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Micro Live preview in step 2 */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-ink-mute uppercase tracking-wider">Preview Rápido</span>
              <div className="p-4 bg-canvas-soft border border-hairline rounded-[8px] text-xs font-serif text-ink-secondary whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto">
                {getInterpolatedBody() || 'Corpo do modelo de contrato.'}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Content Step 3 */}
      {step === 3 && (
        <Card variant="light" className="flex flex-col gap-6">
          <h3 className="text-sm font-bold text-ink-secondary border-b border-hairline pb-2">Passo 3: Revisão em Tela Dividida (Split Screen)</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left variables summary */}
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold text-ink-mute uppercase tracking-wider block">Revisar Informações</span>
              
              <div className="grid grid-cols-2 gap-4 text-xs border border-hairline-cool p-4 bg-canvas-soft rounded-[8px]">
                <div>
                  <span className="text-ink-mute block">Título</span>
                  <span className="font-semibold text-ink-secondary">{title}</span>
                </div>
                <div>
                  <span className="text-ink-mute block">Tipo</span>
                  <span className="font-semibold text-ink-secondary">{type}</span>
                </div>
                <div>
                  <span className="text-ink-mute block">Parte Relacionada</span>
                  <span className="font-semibold text-ink-secondary">{relatedParty}</span>
                </div>
                <div>
                  <span className="text-ink-mute block">E-mail</span>
                  <span className="font-semibold text-ink-secondary">{relatedPartyEmail}</span>
                </div>
                <div>
                  <span className="text-ink-mute block">Valor</span>
                  <span className="font-semibold text-ink-secondary">{value ? `R$ ${parseFloat(value).toLocaleString('pt-BR')}` : '-'}</span>
                </div>
                <div>
                  <span className="text-ink-mute block">Vigência</span>
                  <span className="font-semibold text-ink-secondary">{startDate ? `${formatDate(startDate)} a ${formatDate(endDate)}` : '-'}</span>
                </div>
              </div>

              {selectedTemplate && (
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold text-ink-mute uppercase tracking-wider block mt-2">Variáveis Interpoladas</span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTemplate.fields.map(f => (
                      <div key={f.uuid} className="p-2 border border-hairline rounded-[6px] text-xs">
                        <span className="text-ink-mute block">{f.label}</span>
                        <span className="font-medium text-ink-secondary">{fieldValues[f.key] || <span className="text-accent-tomato">Não preenchido</span>}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right complete preview */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-ink-mute uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-4 h-4 text-primary" /> Visualização Geral do Termo
              </span>
              <div className="p-6 bg-canvas-soft border border-hairline rounded-[8px] text-sm font-serif text-ink-secondary leading-relaxed whitespace-pre-wrap min-h-[300px] max-h-[450px] overflow-y-auto">
                {getInterpolatedBody() || body}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Content Step 4 */}
      {step === 4 && (
        <Card variant="light" className="flex flex-col gap-6">
          <h3 className="text-sm font-bold text-ink-secondary border-b border-hairline pb-2">Passo 4: Anexos e Finalização</h3>
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-hairline hover:border-primary/50 transition-premium rounded-[8px] cursor-pointer relative">
              <input
                type="file"
                multiple
                accept="application/pdf,image/png,image/jpeg"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-ink-mute-2 mb-2" />
              <span className="text-sm font-bold text-ink-secondary">Arraste ou clique para enviar arquivos</span>
              <span className="text-xs text-ink-mute mt-1">Formatos suportados: PDF ou imagens (até 5MB por arquivo)</span>
            </div>

            {files.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                <span className="text-xs font-bold text-ink-mute uppercase tracking-wider block">Arquivos selecionados ({files.length})</span>
                <div className="flex flex-wrap gap-3">
                  {files.map((file, idx) => (
                    <div key={idx} className="p-2 border border-hairline bg-canvas-soft rounded-[6px] flex items-center gap-4 text-xs font-medium">
                      <span className="max-w-[200px] truncate text-ink-secondary">{file.name}</span>
                      <button
                        onClick={() => removeFile(idx)}
                        className="text-accent-tomato hover:underline cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Navigation Wizard Buttons */}
      <div className="flex justify-between items-center bg-canvas-soft p-4 border border-hairline rounded-[8px]">
        <Button
          onClick={() => {
            if (step === 1) navigate('/contratos');
            else if (step === 3 && !selectedTemplate) setStep(1);
            else setStep(step - 1);
          }}
          variant="outline"
          className="flex items-center gap-1"
          disabled={loading}
        >
          <ChevronLeft className="w-4 h-4" /> Anterior
        </Button>

        {step < 4 ? (
          <Button onClick={handleNextStep} className="flex items-center gap-1">
            Próximo <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} variant="primary" disabled={loading} className="flex items-center gap-1.5">
            {loading ? 'Salvando...' : 'Criar e Salvar Contrato'}
          </Button>
        )}
      </div>
    </div>
  );
};

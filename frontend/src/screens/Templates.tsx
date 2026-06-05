import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../context/store';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Layers, Plus, X, Eye, FileSpreadsheet, PlusCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FieldInput {
  key: string;
  label: string;
  fieldType: 'TEXT' | 'NUMBER' | 'DATE' | 'SIGNATURE' | 'ADDRESS';
  isRequired: boolean;
}

interface ContractTemplate {
  uuid: string;
  name: string;
  type: string;
  description: string | null;
  body: string;
  fields: Array<{
    uuid: string;
    key: string;
    label: string;
    fieldType: string;
    isRequired: boolean;
  }>;
}

export const Templates: React.FC = () => {
  const apiCall = useAuthStore((state) => state.apiCall);
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('SERVICO');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [fields, setFields] = useState<FieldInput[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  
  // View state
  const [viewingTemplate, setViewingTemplate] = useState<ContractTemplate | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await apiCall('/v1/contract-templates');
      setTemplates(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const addField = () => {
    setFields([...fields, { key: '', label: '', fieldType: 'TEXT', isRequired: true }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: keyof FieldInput, value: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    setFields(updated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !body) {
      alert('Nome e corpo do template são obrigatórios.');
      return;
    }
    
    // Auto-detect placeholders in body (e.g. {{NOME_RAZAO}}) and ensure they are represented in fields
    const regex = /\{\{([^}]+)\}\}/g;
    let match;
    const bodyPlaceholders: string[] = [];
    while ((match = regex.exec(body)) !== null) {
      const ph = match[1].trim();
      if (!bodyPlaceholders.includes(ph)) {
        bodyPlaceholders.push(ph);
      }
    }

    // Add missing placeholders to fields as TEXT type automatically if not defined
    const currentKeys = fields.map(f => f.key.trim().toUpperCase());
    const finalFields = [...fields];
    bodyPlaceholders.forEach(ph => {
      const formattedKey = ph.toUpperCase();
      if (!currentKeys.includes(formattedKey)) {
        finalFields.push({
          key: formattedKey,
          label: ph.replace(/_/g, ' '),
          fieldType: 'TEXT',
          isRequired: true
        });
      }
    });

    setCreateLoading(true);
    try {
      await apiCall('/v1/contract-templates', {
        method: 'POST',
        body: JSON.stringify({
          name,
          type,
          description,
          body,
          fields: finalFields.map((f, i) => ({
            key: f.key.trim().toUpperCase(),
            label: f.label.trim(),
            fieldType: f.fieldType,
            isRequired: f.isRequired,
            sortOrder: i,
          })),
        }),
      });
      setShowCreateModal(false);
      setName('');
      setDescription('');
      setBody('');
      setFields([]);
      fetchTemplates();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar template');
    } finally {
      setCreateLoading(false);
    }
  };

  // Highlights placeholders in body for display
  const highlightPlaceholders = (text: string) => {
    const parts = text.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, index) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        return (
          <span key={index} className="bg-amber-100 text-amber-800 font-mono px-1 rounded text-xs border border-amber-200">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink display-md flex items-center gap-2">
            <Layers className="w-8 h-8 text-primary" /> Modelos de Contrato
          </h1>
          <p className="text-ink-mute mt-1">Crie e gerencie os templates base de seus contratos jurídicos e operacionais.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="primary" className="flex items-center gap-1.5 self-start">
          <Plus className="w-4 h-4" /> Novo Modelo
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-accent-tomato/10 border border-accent-tomato/20 rounded-[8px] text-accent-tomato text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : templates.length === 0 ? (
        <Card variant="light" className="text-center py-12 flex flex-col items-center gap-4">
          <Layers className="w-12 h-12 text-ink-mute-2" />
          <div>
            <h3 className="text-sm font-bold text-ink">Nenhum template cadastrado</h3>
            <p className="text-xs text-ink-mute mt-1">Comece cadastrando seu primeiro modelo clicando em "Novo Modelo".</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((t) => (
            <Card key={t.uuid} variant="light" className="flex flex-col justify-between hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-hairline-cool hover:border-hairline transition-all duration-200">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-canvas-soft border border-hairline text-ink-mute">
                    {t.type}
                  </span>
                  <span className="text-xs text-ink-mute-2">{t.fields?.length || 0} variáveis</span>
                </div>
                <h3 className="font-bold text-sm text-ink-secondary mb-1">{t.name}</h3>
                <p className="text-xs text-ink-mute line-clamp-2 mb-4">{t.description || 'Sem descrição cadastrada.'}</p>
              </div>
              
              <div className="flex gap-2 mt-4 pt-4 border-t border-hairline-cool">
                <Button onClick={() => setViewingTemplate(t)} variant="outline" className="flex-1 py-1.5 flex items-center gap-1.5 text-xs">
                  <Eye className="w-3.5 h-3.5" /> Visualizar
                </Button>
                <Button onClick={() => navigate('/contratos/novo', { state: { templateUuid: t.uuid } })} variant="primary" className="flex-1 py-1.5 text-xs">
                  Usar Modelo
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* View Template Modal */}
      {viewingTemplate && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-canvas w-full max-w-3xl rounded-[12px] border border-hairline shadow-[0_16px_48px_rgba(0,0,0,0.12)] max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-hairline flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-canvas-soft border border-hairline text-ink-mute px-2 py-0.5 rounded-full">
                  {viewingTemplate.type}
                </span>
                <h2 className="text-lg font-bold text-ink mt-1.5">{viewingTemplate.name}</h2>
              </div>
              <button onClick={() => setViewingTemplate(null)} className="p-1.5 hover:bg-canvas-soft rounded-[6px] border border-transparent hover:border-hairline transition-premium">
                <X className="w-5 h-5 text-ink-mute" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              {viewingTemplate.description && (
                <div>
                  <h4 className="text-xs font-bold text-ink-mute uppercase tracking-wider mb-1">Descrição</h4>
                  <p className="text-sm text-ink-secondary">{viewingTemplate.description}</p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-ink-mute uppercase tracking-wider mb-2">Campos / Variáveis do Contrato</h4>
                <div className="grid grid-cols-2 gap-3">
                  {viewingTemplate.fields?.map((f) => (
                    <div key={f.uuid} className="p-2.5 border border-hairline-cool bg-canvas-soft rounded-[6px] text-xs">
                      <span className="font-semibold block text-ink-secondary">{f.label}</span>
                      <span className="font-mono text-[10px] text-amber-800 bg-amber-50 px-1 rounded block w-fit mt-1">
                        {`{{${f.key}}}`}
                      </span>
                      <span className="text-[10px] text-ink-mute block mt-1">
                        Tipo: {f.fieldType} | {f.isRequired ? 'Obrigatorio' : 'Opcional'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-ink-mute uppercase tracking-wider mb-2">Texto do Modelo</h4>
                <div className="p-4 bg-canvas-soft border border-hairline rounded-[8px] text-sm text-ink-secondary font-serif whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                  {highlightPlaceholders(viewingTemplate.body)}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-hairline flex justify-end gap-3 bg-canvas-soft/40">
              <Button onClick={() => setViewingTemplate(null)} variant="outline">Fechar</Button>
              <Button onClick={() => navigate('/contratos/novo', { state: { templateUuid: viewingTemplate.uuid } })}>
                Iniciar Contrato com este modelo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-canvas w-full max-w-4xl rounded-[12px] border border-hairline shadow-[0_16px_48px_rgba(0,0,0,0.12)] max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-hairline flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-primary" /> Novo Modelo de Contrato
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-canvas-soft rounded-[6px] border border-transparent hover:border-hairline transition-premium">
                <X className="w-5 h-5 text-ink-mute" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex-1 flex flex-col min-h-0">
              <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Form Panel */}
                <div className="flex flex-col gap-4">
                  <Input
                    label="Nome do Modelo"
                    placeholder="Ex: Contrato de Prestação de Serviços"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />

                  <div className="w-full flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-ink-mute">Tipo do Contrato</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="bg-canvas text-ink text-sm rounded-[6px] border border-hairline focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2 transition-all outline-none w-full"
                    >
                      <option value="SERVICO">Prestação de Serviço</option>
                      <option value="TRABALHO">Trabalho / Emprego</option>
                      <option value="OBRA">Construção / Obra</option>
                      <option value="LOCACAO">Locação de Equipamentos</option>
                      <option value="OUTRO">Outros</option>
                    </select>
                  </div>

                  <Input
                    label="Descrição Rápida"
                    placeholder="Ex: Utilizado para fechamento de sub-empreiteiros..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />

                  <div className="w-full flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-ink-mute">Corpo do Modelo (Use {"{{VARIAVEL}}"} para placeholders)</label>
                    <textarea
                      placeholder="Declaro que contratado {{CONTRATADO}} realizará serviços na obra {{OBRA}} pelo valor de R$ {{VALOR}}."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={10}
                      className="bg-canvas text-ink text-sm font-serif rounded-[6px] border border-hairline focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2 transition-all outline-none w-full leading-relaxed"
                      required
                    />
                  </div>
                </div>

                {/* Right Fields Panel */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-hairline pb-2">
                    <span className="text-xs font-bold text-ink-mute uppercase tracking-wider">Campos Dinâmicos Específicos</span>
                    <button
                      type="button"
                      onClick={addField}
                      className="text-xs font-bold text-primary hover:text-primary-deep flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Campo
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {fields.length === 0 ? (
                      <div className="py-6 text-center text-xs text-ink-mute border border-dashed border-hairline rounded-[6px]">
                        Nenhuma variável customizada definida. Os placeholders do texto (ex: {"{{NOME_EXEMPLO}}"}) serão criados automaticamente como campos de texto se não definidos aqui.
                      </div>
                    ) : (
                      fields.map((field, idx) => (
                        <div key={idx} className="p-3 border border-hairline-cool bg-canvas-soft/50 rounded-[8px] flex flex-col gap-3 relative">
                          <button
                            type="button"
                            onClick={() => removeField(idx)}
                            className="absolute top-2 right-2 text-ink-mute hover:text-accent-tomato cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              label="Chave (Ex: NOME_OBRA)"
                              placeholder="CHAVE"
                              value={field.key}
                              onChange={(e) => updateField(idx, 'key', e.target.value.toUpperCase().replace(/\s/g, '_'))}
                              required
                            />
                            <Input
                              label="Rótulo (Ex: Nome da Obra)"
                              placeholder="Nome da Obra"
                              value={field.label}
                              onChange={(e) => updateField(idx, 'label', e.target.value)}
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 items-center pt-1">
                            <div className="flex flex-col gap-1">
                              <label className="text-[11px] font-bold text-ink-mute">Tipo do Input</label>
                              <select
                                value={field.fieldType}
                                onChange={(e) => updateField(idx, 'fieldType', e.target.value)}
                                className="bg-canvas text-ink text-xs rounded-[4px] border border-hairline px-2 py-1 w-full"
                              >
                                <option value="TEXT">Texto</option>
                                <option value="NUMBER">Número</option>
                                <option value="DATE">Data</option>
                                <option value="SIGNATURE">Assinatura</option>
                                <option value="ADDRESS">Endereço</option>
                              </select>
                            </div>

                            <label className="flex items-center gap-2 mt-4 cursor-pointer text-xs font-semibold text-ink-mute">
                              <input
                                type="checkbox"
                                checked={field.isRequired}
                                onChange={(e) => updateField(idx, 'isRequired', e.target.checked)}
                                className="rounded text-primary focus:ring-primary w-4 h-4 border-hairline"
                              />
                              Campo Obrigatório
                            </label>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-hairline flex justify-end gap-3 bg-canvas-soft/40">
                <Button type="button" onClick={() => setShowCreateModal(false)} variant="outline" disabled={createLoading}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={createLoading}>
                  {createLoading ? 'Salvando...' : 'Salvar Modelo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

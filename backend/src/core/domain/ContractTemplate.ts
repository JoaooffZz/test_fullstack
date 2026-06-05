import { ContractType } from '../../generated/prisma/client';

export type TemplateFieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'SIGNATURE' | 'ADDRESS';

export interface ContractTemplateFieldProps {
  uuid?: string;
  createdAt?: Date;
  templateUuid?: string;
  key: string;
  label: string;
  fieldType: TemplateFieldType;
  isRequired?: boolean;
  sortOrder?: number;
}

export interface ContractTemplateProps {
  uuid?: string;
  createdAt?: Date;
  updatedAt?: Date;
  companyUuid: string;
  name: string;
  type: ContractType;
  description?: string | null;
  body: string;
  isActive?: boolean;
  fields?: ContractTemplateFieldProps[];
}

export class ContractTemplate {
  public readonly uuid?: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
  public readonly companyUuid: string;
  public name: string;
  public type: ContractType;
  public description: string | null;
  public body: string;
  public isActive: boolean;
  public fields: ContractTemplateFieldProps[];

  constructor(props: ContractTemplateProps) {
    this.uuid = props.uuid;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.companyUuid = props.companyUuid;
    this.name = props.name;
    this.type = props.type;
    this.description = props.description ?? null;
    this.body = props.body;
    this.isActive = props.isActive ?? true;
    this.fields = props.fields ?? [];

    this.validate();
  }

  private validate(): void {
    if (!this.companyUuid) {
      throw new Error('Empresa vinculada é obrigatória');
    }
    if (!this.name || this.name.trim() === '') {
      throw new Error('Nome do template é obrigatório');
    }
    if (!this.body || this.body.trim() === '') {
      throw new Error('Corpo do template é obrigatório');
    }

    // Extrair placeholders do corpo do template: busca tudo que estiver entre {{ e }}
    const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    const bodyPlaceholders = new Set<string>();
    let match;
    while ((match = regex.exec(this.body)) !== null) {
      bodyPlaceholders.add(match[1]);
    }

    // Chaves declaradas na lista de fields
    const declaredKeys = new Set(this.fields.map((f) => f.key));

    // Validar se todas as chaves declaradas estão no corpo
    for (const key of declaredKeys) {
      if (!bodyPlaceholders.has(key)) {
        throw new Error(`A chave de campo declarada "${key}" não foi encontrada no corpo do template`);
      }
    }

    // Validar se todos os placeholders no corpo estão declarados em fields
    for (const key of bodyPlaceholders) {
      if (!declaredKeys.has(key)) {
        throw new Error(`O placeholder "{{${key}}}" encontrado no corpo do template não foi declarado na lista de campos`);
      }
    }
  }
}

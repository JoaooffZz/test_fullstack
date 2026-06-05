import { ContractType, ContractStatus } from '../../generated/prisma/client';

export interface ContractProps {
  uuid?: string;
  createdAt?: Date;
  updatedAt?: Date;
  companyUuid: string;
  templateUuid?: string | null;
  createdByUuid?: string | null;
  title: string;
  type: ContractType;
  status?: ContractStatus;
  relatedParty: string;
  relatedPartyEmail: string;
  relatedPartyWhatsapp?: string | null;
  value?: bigint | number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  body: string;
  fieldValues?: Record<string, any> | null;
  closeReason?: string | null;
  originContractUuid?: string | null;
}

export class Contract {
  public readonly uuid?: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
  public readonly companyUuid: string;
  public templateUuid: string | null;
  public createdByUuid: string | null;
  public title: string;
  public type: ContractType;
  public status: ContractStatus;
  public relatedParty: string;
  public relatedPartyEmail: string;
  public relatedPartyWhatsapp: string | null;
  public value: bigint | number | null;
  public startDate: Date | null;
  public endDate: Date | null;
  public body: string;
  public fieldValues: Record<string, any> | null;
  public closeReason: string | null;
  public originContractUuid: string | null;

  constructor(props: ContractProps) {
    this.uuid = props.uuid;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.companyUuid = props.companyUuid;
    this.templateUuid = props.templateUuid ?? null;
    this.createdByUuid = props.createdByUuid ?? null;
    this.title = props.title;
    this.type = props.type;
    this.status = props.status ?? 'RASCUNHO';
    this.relatedParty = props.relatedParty;
    this.relatedPartyEmail = props.relatedPartyEmail;
    this.relatedPartyWhatsapp = props.relatedPartyWhatsapp ?? null;
    this.value = props.value ?? null;
    this.startDate = props.startDate ?? null;
    this.endDate = props.endDate ?? null;
    this.body = props.body;
    this.fieldValues = props.fieldValues ?? null;
    this.closeReason = props.closeReason ?? null;
    this.originContractUuid = props.originContractUuid ?? null;

    this.validate();
  }

  private validate(): void {
    if (!this.companyUuid) {
      throw new Error('Empresa vinculada é obrigatória');
    }
    if (!this.title || this.title.trim() === '') {
      throw new Error('Título do contrato é obrigatório');
    }
    if (!this.relatedParty || this.relatedParty.trim() === '') {
      throw new Error('Parte relacionada é obrigatória');
    }
    if (!this.relatedPartyEmail || !this.relatedPartyEmail.includes('@')) {
      throw new Error('E-mail da parte relacionada inválido');
    }
    if (!this.body || this.body.trim() === '') {
      throw new Error('Corpo do contrato é obrigatório');
    }
  }

  // Preenche placeholders dinamicamente
  public static fillTemplate(body: string, values: Record<string, any>): string {
    let filled = body;
    for (const key of Object.keys(values)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      filled = filled.replace(regex, String(values[key]));
    }
    return filled;
  }

  // Cálculo dinâmico dos dias restantes em tempo de execução
  public getDaysRemaining(today = new Date()): number | null {
    if (!this.endDate) return null;
    
    // Zera as horas para cálculo de dias inteiros
    const end = new Date(this.endDate);
    end.setHours(0, 0, 0, 0);
    
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
}

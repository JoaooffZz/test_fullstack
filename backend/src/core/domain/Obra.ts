import { ObraStatus } from '../../generated/prisma/client';

export interface ObraProps {
  uuid?: string;
  createdAt?: Date;
  updatedAt?: Date;
  companyUuid: string;
  contractUuid?: string | null;
  createdByUuid?: string | null;
  name: string;
  address: string;
  description?: string | null;
  status?: ObraStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  budgetTotal?: bigint | number | null;
  responsibleCnpj?: string | null;
}

export class Obra {
  public readonly uuid?: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
  public readonly companyUuid: string;
  public contractUuid: string | null;
  public createdByUuid: string | null;
  public name: string;
  public address: string;
  public description: string | null;
  public status: ObraStatus;
  public startDate: Date | null;
  public endDate: Date | null;
  public budgetTotal: bigint | number | null;
  public responsibleCnpj: string | null;

  constructor(props: ObraProps) {
    this.uuid = props.uuid;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.companyUuid = props.companyUuid;
    this.contractUuid = props.contractUuid ?? null;
    this.createdByUuid = props.createdByUuid ?? null;
    this.name = props.name;
    this.address = props.address;
    this.description = props.description ?? null;
    this.status = props.status ?? 'PLANEJAMENTO';
    this.startDate = props.startDate ?? null;
    this.endDate = props.endDate ?? null;
    this.budgetTotal = props.budgetTotal ?? null;
    this.responsibleCnpj = props.responsibleCnpj ?? null;

    this.validate();
  }

  private validate(): void {
    if (!this.companyUuid) throw new Error('Empresa vinculada é obrigatória');
    if (!this.name || this.name.trim() === '') throw new Error('Nome da obra é obrigatório');
    if (!this.address || this.address.trim() === '') throw new Error('Endereço da obra é obrigatório');
  }
}

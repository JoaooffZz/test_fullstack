import { PurchaseOrderStatus } from '../../generated/prisma/client';

export interface PurchaseOrderProps {
  uuid?: string;
  createdAt?: Date;
  updatedAt?: Date;
  companyUuid: string;
  obraUuid?: string | null;
  createdByUuid?: string | null;
  number?: string;
  supplierName: string;
  supplierCnpj?: string | null;
  payerCnpj: string;
  deliveryDate?: Date | null;
  status?: PurchaseOrderStatus;
  notes?: string | null;
}

export class PurchaseOrder {
  public readonly uuid?: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
  public readonly companyUuid: string;
  public readonly obraUuid: string | null;
  public readonly createdByUuid: string | null;
  public readonly number?: string;
  public supplierName: string;
  public supplierCnpj: string | null;
  public payerCnpj: string;
  public deliveryDate: Date | null;
  public status: PurchaseOrderStatus;
  public notes: string | null;

  constructor(props: PurchaseOrderProps) {
    this.uuid = props.uuid;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.companyUuid = props.companyUuid;
    this.obraUuid = props.obraUuid ?? null;
    this.createdByUuid = props.createdByUuid ?? null;
    this.number = props.number;
    this.supplierName = props.supplierName;
    this.supplierCnpj = props.supplierCnpj ?? null;
    this.payerCnpj = props.payerCnpj;
    this.deliveryDate = props.deliveryDate ?? null;
    this.status = props.status ?? 'RASCUNHO';
    this.notes = props.notes ?? null;

    this.validate();
  }

  private validate(): void {
    if (!this.companyUuid) throw new Error('Empresa vinculada é obrigatória');
    if (!this.supplierName || this.supplierName.trim() === '') throw new Error('Nome do fornecedor é obrigatório');
    if (!this.payerCnpj || this.payerCnpj.trim() === '') throw new Error('CNPJ do pagador é obrigatório');
  }
}

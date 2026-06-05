import { CostCategory } from '../../generated/prisma/client';

export interface ObraCustoProps {
  uuid?: string;
  createdAt?: Date;
  obraUuid: string;
  createdByUuid?: string | null;
  description: string;
  category: CostCategory;
  value: bigint | number;
  date: Date;
}

export class ObraCusto {
  public readonly uuid?: string;
  public readonly createdAt?: Date;
  public readonly obraUuid: string;
  public createdByUuid: string | null;
  public description: string;
  public category: CostCategory;
  public value: bigint | number;
  public date: Date;

  constructor(props: ObraCustoProps) {
    this.uuid = props.uuid;
    this.createdAt = props.createdAt;
    this.obraUuid = props.obraUuid;
    this.createdByUuid = props.createdByUuid ?? null;
    this.description = props.description;
    this.category = props.category;
    this.value = props.value;
    this.date = props.date;

    this.validate();
  }

  private validate(): void {
    if (!this.obraUuid) throw new Error('Vínculo com a obra é obrigatório');
    if (!this.description || this.description.trim() === '') throw new Error('Descrição do custo é obrigatória');
    if (Number(this.value) <= 0) throw new Error('O valor do custo deve ser maior que zero');
  }
}

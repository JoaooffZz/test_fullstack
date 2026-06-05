import { ObraPhase, ObraStepStatus } from '../../generated/prisma/client';

export interface ObraStepProps {
  uuid?: string;
  createdAt?: Date;
  updatedAt?: Date;
  obraUuid: string;
  name: string;
  phase: ObraPhase;
  status?: ObraStepStatus;
  sortOrder?: number;
  completedAt?: Date | null;
}

export class ObraStep {
  public readonly uuid?: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
  public readonly obraUuid: string;
  public name: string;
  public phase: ObraPhase;
  public status: ObraStepStatus;
  public sortOrder: number;
  public completedAt: Date | null;

  constructor(props: ObraStepProps) {
    this.uuid = props.uuid;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.obraUuid = props.obraUuid;
    this.name = props.name;
    this.phase = props.phase;
    this.status = props.status ?? 'PENDENTE';
    this.sortOrder = props.sortOrder ?? 0;
    this.completedAt = props.completedAt ?? null;

    this.validate();
  }

  private validate(): void {
    if (!this.obraUuid) throw new Error('Vínculo com a obra é obrigatório');
    if (!this.name || this.name.trim() === '') throw new Error('Nome da etapa é obrigatório');
  }

  public complete(): void {
    this.status = 'CONCLUIDA';
    this.completedAt = new Date();
  }
}

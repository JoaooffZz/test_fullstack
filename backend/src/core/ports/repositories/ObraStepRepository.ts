import { ObraStep } from '../../domain/ObraStep';
import { ObraPhase, ObraStepStatus } from '../../../generated/prisma/client';

export interface ObraStepRepository {
  create(step: ObraStep): Promise<ObraStep>;
  createMany(steps: ObraStep[]): Promise<void>;
  update(step: ObraStep): Promise<ObraStep>;
  findById(uuid: string, obraUuid: string): Promise<ObraStep | null>;
  listByObra(obraUuid: string): Promise<ObraStep[]>;
}

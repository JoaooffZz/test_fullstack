import { ObraStepRepository } from '../../core/ports/repositories/ObraStepRepository';
import { ObraStep } from '../../core/domain/ObraStep';
import { prisma } from '../../infrastructure/database/prisma';
import { ObraPhase, ObraStepStatus } from '../../generated/prisma/client';

export class PrismaObraStepRepository implements ObraStepRepository {
  private toDomain(record: any): ObraStep {
    return new ObraStep({
      uuid: record.uuid,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      obraUuid: record.obraUuid,
      name: record.name,
      phase: record.phase as ObraPhase,
      status: record.status as ObraStepStatus,
      sortOrder: record.sortOrder,
      completedAt: record.completedAt,
    });
  }

  async create(step: ObraStep): Promise<ObraStep> {
    const record = await prisma.obraStep.create({
      data: {
        obraUuid: step.obraUuid,
        name: step.name,
        phase: step.phase,
        status: step.status,
        sortOrder: step.sortOrder,
        completedAt: step.completedAt,
      },
    });
    return this.toDomain(record);
  }

  async createMany(steps: ObraStep[]): Promise<void> {
    await prisma.obraStep.createMany({
      data: steps.map((s) => ({
        obraUuid: s.obraUuid,
        name: s.name,
        phase: s.phase,
        status: s.status,
        sortOrder: s.sortOrder,
      })),
    });
  }

  async update(step: ObraStep): Promise<ObraStep> {
    if (!step.uuid) throw new Error('UUID do step é obrigatório para atualização');
    const record = await prisma.obraStep.update({
      where: { uuid: step.uuid },
      data: {
        name: step.name,
        status: step.status,
        sortOrder: step.sortOrder,
        completedAt: step.completedAt,
      },
    });
    return this.toDomain(record);
  }

  async findById(uuid: string, obraUuid: string): Promise<ObraStep | null> {
    const record = await prisma.obraStep.findFirst({
      where: { uuid, obraUuid },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async listByObra(obraUuid: string): Promise<ObraStep[]> {
    const records = await prisma.obraStep.findMany({
      where: { obraUuid },
      orderBy: [{ phase: 'asc' }, { sortOrder: 'asc' }],
    });
    return records.map((r) => this.toDomain(r));
  }
}

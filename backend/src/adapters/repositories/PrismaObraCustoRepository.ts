import { ObraCustoRepository } from '../../core/ports/repositories/ObraCustoRepository';
import { ObraCusto } from '../../core/domain/ObraCusto';
import { prisma } from '../../infrastructure/database/prisma';
import { CostCategory } from '../../generated/prisma/client';

export class PrismaObraCustoRepository implements ObraCustoRepository {
  private toDomain(record: any): ObraCusto {
    return new ObraCusto({
      uuid: record.uuid,
      createdAt: record.createdAt,
      obraUuid: record.obraUuid,
      createdByUuid: record.createdByUuid,
      description: record.description,
      category: record.category as CostCategory,
      value: Number(record.value) / 100,
      date: record.date,
    });
  }

  async create(custo: ObraCusto): Promise<ObraCusto> {
    const record = await prisma.obraCusto.create({
      data: {
        obraUuid: custo.obraUuid,
        createdByUuid: custo.createdByUuid,
        description: custo.description,
        category: custo.category,
        value: BigInt(Math.round(Number(custo.value) * 100)),
        date: custo.date,
      },
    });
    return this.toDomain(record);
  }

  async delete(uuid: string, obraUuid: string): Promise<void> {
    await prisma.obraCusto.deleteMany({
      where: { uuid, obraUuid },
    });
  }

  async listByObra(obraUuid: string): Promise<ObraCusto[]> {
    const records = await prisma.obraCusto.findMany({
      where: { obraUuid },
      orderBy: { date: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }
}

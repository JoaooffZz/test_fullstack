import { ObraRepository } from '../../core/ports/repositories/ObraRepository';
import { ObraStepRepository } from '../../core/ports/repositories/ObraStepRepository';
import { ObraCustoRepository } from '../../core/ports/repositories/ObraCustoRepository';
import { UploadRepository } from '../../core/ports/repositories/UploadRepository';
import { prisma } from '../../infrastructure/database/prisma';

export class GetObraUseCase {
  constructor(
    private obraRepository: ObraRepository,
    private stepRepository: ObraStepRepository,
    private custoRepository: ObraCustoRepository,
    private uploadRepository: UploadRepository,
  ) {}

  async execute(uuid: string, companyUuid: string): Promise<any> {
    const obra = await this.obraRepository.findById(uuid, companyUuid);
    if (!obra) {
      throw { status: 404, message: 'Obra não encontrada' };
    }

    const [steps, custos, costTotal, vistorias, purchaseOrders] = await Promise.all([
      this.stepRepository.listByObra(uuid),
      this.custoRepository.listByObra(uuid),
      this.obraRepository.sumCosts(uuid),
      prisma.obraVistoria.findMany({
        where: { obraUuid: uuid },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchaseOrder.findMany({
        where: { obraUuid: uuid },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Buscar uploads de vistorias
    const vistoriasWithPhotos = await Promise.all(
      vistorias.map(async (v) => {
        const photos = await this.uploadRepository.findByEntity(v.uuid, 'obra_vistoria', companyUuid);
        return { ...v, photos };
      }),
    );

    // Buscar comprovantes de custos
    const custosWithReceipts = await Promise.all(
      custos.map(async (c) => {
        if (!c.uuid) return { ...c, receipts: [] };
        const receipts = await this.uploadRepository.findByEntity(c.uuid, 'obra_custo', companyUuid);
        return { ...c, receipts };
      }),
    );

    return {
      ...obra,
      costTotal,
      totalSpent: costTotal,
      total_spent: costTotal,
      steps,
      vistorias: vistoriasWithPhotos,
      custos: custosWithReceipts,
      purchaseOrders,
    };
  }
}

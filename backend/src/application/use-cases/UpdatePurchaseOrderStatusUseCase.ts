import { PurchaseOrderRepository } from '../../core/ports/repositories/PurchaseOrderRepository';
import { ObraCustoRepository } from '../../core/ports/repositories/ObraCustoRepository';
import { PurchaseOrder } from '../../core/domain/PurchaseOrder';
import { ObraCusto } from '../../core/domain/ObraCusto';
import { PurchaseOrderStatus } from '../../generated/prisma/client';

interface UpdateStatusInput {
  uuid: string;
  companyUuid: string;
  userRole: string;
  createdByUuid?: string | null;
  status: PurchaseOrderStatus;
}

export class UpdatePurchaseOrderStatusUseCase {
  constructor(
    private purchaseOrderRepository: PurchaseOrderRepository,
    private custoRepository: ObraCustoRepository,
  ) {}

  async execute(input: UpdateStatusInput): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findById(input.uuid, input.companyUuid);
    if (!order) throw { status: 404, message: 'Ordem de Compra não encontrada' };

    const currentStatus = order.status;
    const targetStatus = input.status;

    if (currentStatus === targetStatus) {
      return order;
    }

    // Regras de Transição
    let allowed = false;

    if (currentStatus === 'RASCUNHO') {
      if (targetStatus === 'EMITIDA') {
        allowed = true;
      } else if (targetStatus === 'CANCELADA') {
        // EDITOR ou ADMIN pode cancelar rascunho
        if (input.userRole === 'ADMIN' || input.userRole === 'EDITOR') {
          allowed = true;
        } else {
          throw { status: 403, message: 'Permissão insuficiente para cancelar rascunho de Ordem de Compra' };
        }
      }
    } else if (currentStatus === 'EMITIDA') {
      if (targetStatus === 'APROVADA' || targetStatus === 'CANCELADA') {
        // Apenas ADMIN ou EDITOR podem aprovar ou cancelar emitida
        if (input.userRole === 'ADMIN' || input.userRole === 'EDITOR') {
          allowed = true;
        } else {
          throw { status: 403, message: 'Apenas administradores ou editores podem alterar o status de uma Ordem de Compra emitida' };
        }
      }
    }

    if (!allowed) {
      throw { status: 400, message: `Transição de status inválida de ${currentStatus} para ${targetStatus}` };
    }

    const updated = await this.purchaseOrderRepository.updateStatus(input.uuid, targetStatus, input.companyUuid);

    // Se aprovada e vinculada a uma obra, lança um custo automaticamente
    if (targetStatus === 'APROVADA' && updated.obraUuid) {
      const items = await this.purchaseOrderRepository.findItemsByOrderUuid(input.uuid);
      const totalValue = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

      const description = `Ordem de Compra ${updated.number} - ${updated.supplierName}`;

      const custo = new ObraCusto({
        obraUuid: updated.obraUuid,
        createdByUuid: input.createdByUuid || null,
        description,
        category: 'MATERIAL', // Categoria padrão O.C.
        value: totalValue,
        date: new Date(),
      });

      await this.custoRepository.create(custo);
    }

    return updated;
  }
}

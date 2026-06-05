import { PurchaseOrderRepository } from '../../core/ports/repositories/PurchaseOrderRepository';

export class GetPurchaseOrderUseCase {
  constructor(private purchaseOrderRepository: PurchaseOrderRepository) {}

  async execute(uuid: string, companyUuid: string): Promise<any> {
    const order = await this.purchaseOrderRepository.findById(uuid, companyUuid);
    if (!order) throw { status: 404, message: 'Ordem de Compra não encontrada' };

    const items = await this.purchaseOrderRepository.findItemsByOrderUuid(uuid);
    const totalValue = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    return {
      ...order,
      items,
      totalValue,
    };
  }
}

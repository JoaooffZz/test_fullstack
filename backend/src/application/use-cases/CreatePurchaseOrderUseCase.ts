import { PurchaseOrderRepository } from '../../core/ports/repositories/PurchaseOrderRepository';
import { ObraRepository } from '../../core/ports/repositories/ObraRepository';
import { PurchaseOrder } from '../../core/domain/PurchaseOrder';
import { PurchaseOrderItem } from '../../core/domain/PurchaseOrderItem';

interface CreateItemInput {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

interface CreatePurchaseOrderInput {
  companyUuid: string;
  createdByUuid?: string | null;
  obraUuid?: string | null;
  supplierName: string;
  supplierCnpj?: string | null;
  payerCnpj: string;
  deliveryDate?: Date | string | null;
  notes?: string | null;
  items: CreateItemInput[];
}

export class CreatePurchaseOrderUseCase {
  constructor(
    private purchaseOrderRepository: PurchaseOrderRepository,
    private obraRepository: ObraRepository,
  ) {}

  async execute(input: CreatePurchaseOrderInput): Promise<any> {
    if (input.obraUuid) {
      const obra = await this.obraRepository.findById(input.obraUuid, input.companyUuid);
      if (!obra) throw { status: 404, message: 'Obra vinculada não encontrada' };
    }

    if (!input.items || input.items.length === 0) {
      throw { status: 400, message: 'A Ordem de Compra deve conter pelo menos um item' };
    }

    const order = new PurchaseOrder({
      companyUuid: input.companyUuid,
      createdByUuid: input.createdByUuid,
      obraUuid: input.obraUuid,
      supplierName: input.supplierName,
      supplierCnpj: input.supplierCnpj,
      payerCnpj: input.payerCnpj,
      deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : null,
      notes: input.notes,
    });

    const items = input.items.map(
      (item) =>
        new PurchaseOrderItem({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
        }),
    );

    const created = await this.purchaseOrderRepository.create(order, items);
    const totalValue = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);

    return {
      ...created,
      items,
      totalValue,
    };
  }
}

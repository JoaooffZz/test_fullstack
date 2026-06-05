import { PurchaseOrderRepository, ListPurchaseOrdersFilter } from '../../core/ports/repositories/PurchaseOrderRepository';
import { PurchaseOrderStatus } from '../../generated/prisma/client';

interface ListPurchaseOrdersInput {
  companyUuid: string;
  status?: PurchaseOrderStatus;
  obraUuid?: string;
}

export class ListPurchaseOrdersUseCase {
  constructor(private purchaseOrderRepository: PurchaseOrderRepository) {}

  async execute(input: ListPurchaseOrdersInput): Promise<any[]> {
    return this.purchaseOrderRepository.list(input.companyUuid, {
      status: input.status,
      obraUuid: input.obraUuid,
    });
  }
}

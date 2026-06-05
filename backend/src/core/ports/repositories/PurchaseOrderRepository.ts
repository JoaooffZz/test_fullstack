import { PurchaseOrder } from '../../domain/PurchaseOrder';
import { PurchaseOrderItem } from '../../domain/PurchaseOrderItem';
import { PurchaseOrderStatus } from '../../../generated/prisma/client';

export interface ListPurchaseOrdersFilter {
  status?: PurchaseOrderStatus;
  obraUuid?: string;
}

export interface PurchaseOrderRepository {
  create(purchaseOrder: PurchaseOrder, items: PurchaseOrderItem[]): Promise<PurchaseOrder>;
  updateStatus(uuid: string, status: PurchaseOrderStatus, companyUuid: string): Promise<PurchaseOrder>;
  findById(uuid: string, companyUuid: string): Promise<PurchaseOrder | null>;
  findItemsByOrderUuid(orderUuid: string): Promise<PurchaseOrderItem[]>;
  list(companyUuid: string, filter: ListPurchaseOrdersFilter): Promise<(PurchaseOrder & { itemsCount: number; totalValue: number })[]>;
}

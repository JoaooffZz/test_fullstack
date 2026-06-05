import { Router } from 'express';
import { PurchaseOrderController } from '../adapters/controllers/PurchaseOrderController';
import { requireAuth } from '../adapters/middlewares/requireAuth';
import { requireRole } from '../adapters/middlewares/requireRole';

const router = Router();
const controller = new PurchaseOrderController();

router.use(requireAuth);

router.post('/', requireRole(['ADMIN', 'EDITOR']), controller.create);
router.get('/', controller.list);
router.get('/:uuid', controller.get);
router.patch('/:uuid/status', requireRole(['ADMIN', 'EDITOR', 'VIEWER']), controller.updateStatus);

export { router as purchaseOrderRoutes };

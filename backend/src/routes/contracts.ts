import { Router } from 'express';
import { ContractController } from '../adapters/controllers/ContractController';
import { requireAuth } from '../adapters/middlewares/requireAuth';
import { requireRole } from '../adapters/middlewares/requireRole';

const router = Router();
const controller = new ContractController();

router.use(requireAuth);

router.post('/', requireRole(['ADMIN', 'EDITOR']), controller.create);
router.get('/', controller.list);
router.get('/:uuid', controller.get);
router.patch('/:uuid', requireRole(['ADMIN', 'EDITOR']), controller.update);
router.patch('/:uuid/close', requireRole(['ADMIN', 'EDITOR']), controller.close);
router.post('/:uuid/additive', requireRole(['ADMIN', 'EDITOR']), controller.additive);

export { router as contractRoutes };

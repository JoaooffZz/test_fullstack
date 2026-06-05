import { Router } from 'express';
import { ObraController } from '../adapters/controllers/ObraController';
import { requireAuth } from '../adapters/middlewares/requireAuth';
import { requireRole } from '../adapters/middlewares/requireRole';

const router = Router();
const controller = new ObraController();

router.use(requireAuth);

router.post('/', requireRole(['ADMIN', 'EDITOR']), controller.create);
router.get('/', controller.list);
router.get('/:uuid', controller.get);
router.patch('/:uuid', requireRole(['ADMIN', 'EDITOR']), controller.update);

// Steps
router.patch('/:uuid/steps/:step_uuid', requireRole(['ADMIN', 'EDITOR']), controller.updateStep);

// Vistorias
router.post('/:uuid/vistorias', requireRole(['ADMIN', 'EDITOR']), controller.createVistoria);

// Custos
router.post('/:uuid/costs', requireRole(['ADMIN', 'EDITOR']), controller.createCusto);
router.delete('/:uuid/costs/:cost_uuid', requireRole(['ADMIN']), controller.deleteCusto);

export { router as obraRoutes };

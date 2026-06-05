import { Router } from 'express';
import { TemplateController } from '../adapters/controllers/TemplateController';
import { requireAuth } from '../adapters/middlewares/requireAuth';
import { requireRole } from '../adapters/middlewares/requireRole';

const router = Router();
const controller = new TemplateController();

router.use(requireAuth);

router.post('/', requireRole(['ADMIN', 'EDITOR']), controller.create);
router.get('/', controller.list);
router.get('/:uuid', controller.get);

export { router as templateRoutes };

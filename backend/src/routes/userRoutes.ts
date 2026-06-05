import { Router } from 'express';
import { UserController } from '../adapters/controllers/UserController';
import { CreateUserUseCase } from '../application/use-cases/CreateUserUseCase';
import { UpdateUserUseCase } from '../application/use-cases/UpdateUserUseCase';
import { ListUsersUseCase } from '../application/use-cases/ListUsersUseCase';
import { PrismaUserRepository } from '../adapters/repositories/PrismaUserRepository';
import { BcryptHashService } from '../infrastructure/providers/BcryptHashService';
import { requireAuth } from '../adapters/middlewares/requireAuth';
import { requireRole } from '../adapters/middlewares/requireRole';

const router = Router();

const userRepository = new PrismaUserRepository();
const hashService = new BcryptHashService();

const createUserUseCase = new CreateUserUseCase(userRepository, hashService);
const updateUserUseCase = new UpdateUserUseCase(userRepository);
const listUsersUseCase = new ListUsersUseCase(userRepository);

const userController = new UserController(
  createUserUseCase,
  updateUserUseCase,
  listUsersUseCase,
);

// Todas as rotas de usuários requerem autenticação
router.use(requireAuth);

router.get('/me', userController.me);

// Rotas administrativas (apenas ADMIN pode criar, editar ou listar os usuários da empresa)
router.post('/', requireRole(['ADMIN']), userController.create);
router.put('/:uuid', requireRole(['ADMIN']), userController.update);
router.get('/', requireRole(['ADMIN']), userController.list);

export { router as userRoutes };

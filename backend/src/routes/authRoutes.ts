import { Router } from 'express';
import { AuthController } from '../adapters/controllers/AuthController';
import { RegisterCompanyUseCase } from '../application/use-cases/RegisterCompanyUseCase';
import { LoginUseCase } from '../application/use-cases/LoginUseCase';
import { PrismaCompanyRepository } from '../adapters/repositories/PrismaCompanyRepository';
import { PrismaUserRepository } from '../adapters/repositories/PrismaUserRepository';
import { BcryptHashService } from '../infrastructure/providers/BcryptHashService';
import { JwtTokenService } from '../infrastructure/providers/JwtTokenService';

const router = Router();

const companyRepository = new PrismaCompanyRepository();
const userRepository = new PrismaUserRepository();
const hashService = new BcryptHashService();
const tokenService = new JwtTokenService();

const registerCompanyUseCase = new RegisterCompanyUseCase(
  companyRepository,
  userRepository,
  hashService,
);

const loginUseCase = new LoginUseCase(
  userRepository,
  companyRepository,
  hashService,
  tokenService,
);

const authController = new AuthController(registerCompanyUseCase, loginUseCase);

router.post('/register', authController.register);
router.post('/login', authController.login);

export { router as authRoutes };

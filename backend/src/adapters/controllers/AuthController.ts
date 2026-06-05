import { Request, Response } from 'express';
import { RegisterCompanyUseCase } from '../../application/use-cases/RegisterCompanyUseCase';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';

export class AuthController {
  constructor(
    private registerCompanyUseCase: RegisterCompanyUseCase,
    private loginUseCase: LoginUseCase,
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { companyName, cnpj, userName, email, password } = req.body;
      await this.registerCompanyUseCase.execute({
        companyName,
        cnpj,
        userName,
        email,
        password,
      });

      res.status(201).json({ message: 'Empresa e administrador cadastrados com sucesso' });
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Erro interno do servidor';
      res.status(status).json({ message });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.loginUseCase.execute({ email, password });

      res.status(200).json(result);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Erro interno do servidor';
      res.status(status).json({ message });
    }
  };
}

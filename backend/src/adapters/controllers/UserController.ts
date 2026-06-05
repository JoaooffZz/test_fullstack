import { Request, Response } from 'express';
import { CreateUserUseCase } from '../../application/use-cases/CreateUserUseCase';
import { UpdateUserUseCase } from '../../application/use-cases/UpdateUserUseCase';
import { ListUsersUseCase } from '../../application/use-cases/ListUsersUseCase';

export class UserController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private updateUserUseCase: UpdateUserUseCase,
    private listUsersUseCase: ListUsersUseCase,
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const { name, email, password, role, status } = req.body;

      const created = await this.createUserUseCase.execute({
        companyUuid,
        name,
        email,
        password,
        role,
        status,
      });

      res.status(201).json({
        uuid: created.uuid,
        name: created.name,
        email: created.email,
        role: created.role,
        status: created.status,
      });
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Erro interno do servidor';
      res.status(status).json({ message });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const { uuid } = req.params as any;
      const { name, email, role, status } = req.body;

      const updated = await this.updateUserUseCase.execute({
        uuid,
        companyUuid,
        name,
        email,
        role,
        status,
      });

      res.status(200).json({
        uuid: updated.uuid,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        status: updated.status,
      });
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Erro interno do servidor';
      res.status(status).json({ message });
    }
  };

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const users = await this.listUsersUseCase.execute(companyUuid);

      res.status(200).json(
        users.map((u) => ({
          uuid: u.uuid,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
        })),
      );
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Erro interno do servidor';
      res.status(status).json({ message });
    }
  };

  me = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        user: req.user,
        company: req.company,
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Erro ao buscar dados do perfil' });
    }
  };
}

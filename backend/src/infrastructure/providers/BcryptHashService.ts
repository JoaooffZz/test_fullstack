import * as bcrypt from 'bcryptjs';
import { HashService } from '../../core/ports/services/HashService';

const SALT_ROUNDS = 10;

export class BcryptHashService implements HashService {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

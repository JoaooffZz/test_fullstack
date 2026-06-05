import { AuditAction } from '../../../generated/prisma/client';

export interface AuditLogRecord {
  uuid?: string;
  createdAt?: Date;
  companyUuid: string;
  userUuid?: string | null;
  action: AuditAction;
  entityType: string;
  entityUuid?: string | null;
  description?: string | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
}

export interface AuditRepository {
  create(record: AuditLogRecord): Promise<AuditLogRecord>;
}

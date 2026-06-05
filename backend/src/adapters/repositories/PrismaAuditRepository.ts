import { AuditRepository, AuditLogRecord } from '../../core/ports/repositories/AuditRepository';
import { prisma } from '../../infrastructure/database/prisma';
import { AuditAction } from '../../generated/prisma/client';

export class PrismaAuditRepository implements AuditRepository {
  async create(record: AuditLogRecord): Promise<AuditLogRecord> {
    const created = await prisma.auditLog.create({
      data: {
        companyUuid: record.companyUuid,
        userUuid: record.userUuid,
        action: record.action as AuditAction,
        entityType: record.entityType,
        entityUuid: record.entityUuid,
        description: record.description,
        metadata: record.metadata ?? undefined,
        ipAddress: record.ipAddress,
      },
    });

    return {
      uuid: created.uuid,
      createdAt: created.createdAt,
      companyUuid: created.companyUuid,
      userUuid: created.userUuid,
      action: created.action,
      entityType: created.entityType,
      entityUuid: created.entityUuid,
      description: created.description,
      metadata: created.metadata as Record<string, any>,
      ipAddress: created.ipAddress,
    };
  }
}

import { UploadRepository, UploadRecord } from '../../core/ports/repositories/UploadRepository';
import { prisma } from '../../infrastructure/database/prisma';

export class PrismaUploadRepository implements UploadRepository {
  async create(record: UploadRecord): Promise<UploadRecord> {
    const created = await prisma.upload.create({
      data: {
        companyUuid: record.companyUuid,
        entityType: record.entityType,
        entityUuid: record.entityUuid,
        fileName: record.fileName,
        fileUrl: record.fileUrl,
        mimeType: record.mimeType,
        sizeBytes: record.sizeBytes !== null && record.sizeBytes !== undefined ? BigInt(record.sizeBytes) : null,
      },
    });

    return {
      uuid: created.uuid,
      createdAt: created.createdAt,
      companyUuid: created.companyUuid,
      entityType: created.entityType,
      entityUuid: created.entityUuid,
      fileName: created.fileName,
      fileUrl: created.fileUrl,
      mimeType: created.mimeType,
      sizeBytes: created.sizeBytes !== null ? Number(created.sizeBytes) : null,
    };
  }

  async findByEntity(entityUuid: string, entityType: string, companyUuid: string): Promise<UploadRecord[]> {
    const records = await prisma.upload.findMany({
      where: { entityUuid, entityType, companyUuid },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((r) => ({
      uuid: r.uuid,
      createdAt: r.createdAt,
      companyUuid: r.companyUuid,
      entityType: r.entityType,
      entityUuid: r.entityUuid,
      fileName: r.fileName,
      fileUrl: r.fileUrl,
      mimeType: r.mimeType,
      sizeBytes: r.sizeBytes !== null ? Number(r.sizeBytes) : null,
    }));
  }
}
